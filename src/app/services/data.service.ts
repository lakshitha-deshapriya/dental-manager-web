import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { collection, getDocs, query, where, documentId, Firestore } from '@angular/fire/firestore';
import { AppointmentModel } from '../models/appointment.model';
import { PatientModel } from '../models/patient.model';
import { TreatmentModel } from '../models/treatment.model';
import { environment } from '../../environments/environment';

export interface AppointmentWithRelatedData {
  appointment: AppointmentModel;
  patient: PatientModel | null;
  treatments: TreatmentModel[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private db: Firestore = inject(Firestore);

  /**
   * Load appointments for a specific date with all related patient and treatment data
   * This method does NOT block the UI - it returns an Observable
   * @param targetDate ISO date string (YYYY-MM-DD). Defaults to today
   * @returns Observable of appointments with related data
   */
  getAppointmentsForDate(targetDate?: string): Observable<AppointmentWithRelatedData[]> {
    const dateToUse = targetDate || this.getTodayDateString();
    
    return new Observable(observer => {
      this.loadAppointmentsForDateInternal(dateToUse)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => {
          console.error('Error loading appointments for date:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Load upcoming appointments (from today onwards) with all related data
   * This method does NOT block the UI - it returns an Observable
   * @returns Observable of appointments with related data
   */
  getUpcomingAppointments(): Observable<AppointmentWithRelatedData[]> {
    return new Observable(observer => {
      this.loadUpcomingAppointmentsInternal()
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => {
          console.error('Error loading upcoming appointments:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Internal method to load appointments for a specific date
   */
  private async loadAppointmentsForDateInternal(targetDate: string): Promise<AppointmentWithRelatedData[]> {
    console.log('Loading appointments for date:', targetDate);

    // Step 1: Query appointments for the specific date from Firebase
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const appointmentsQuery = query(
      collection(this.db, environment.collectionPaths.appointments),
      where('organizationId', '==', environment.organizationId),
      where('appointmentDate', '>=', startDate.toISOString()),
      where('appointmentDate', '<=', endDate.toISOString()),
      where('isActive', '==', true)
    );

    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = appointmentsSnapshot.docs.map(doc => 
      AppointmentModel.fromMap({ id: doc.id, ...doc.data() })
    );

    console.log(`Found ${appointments.length} appointments for ${targetDate}`);

    if (appointments.length === 0) {
      return [];
    }

    // Step 2: Extract all unique treatment IDs from appointments
    const treatmentIds = [...new Set(
      appointments.flatMap(apt => apt.treatmentIds || []).filter(id => id)
    )];

    // Step 3: Extract all unique patient IDs from appointments
    const patientIds = [...new Set(
      appointments.map(apt => apt.patientId).filter(id => id)
    )];

    console.log(`Fetching ${patientIds.length} patients and ${treatmentIds.length} treatments`);

    // Step 4: Fetch all required patients and treatments in parallel
    const [patients, treatments] = await Promise.all([
      this.fetchPatientsByIds(patientIds),
      this.fetchTreatmentsByIds(treatmentIds)
    ]);

    // Step 5: Combine appointments with their related data
    const result: AppointmentWithRelatedData[] = appointments.map(appointment => ({
      appointment,
      patient: patients.find(p => p.id === appointment.patientId) || null,
      treatments: (appointment.treatmentIds || [])
        .map(id => treatments.find(t => t.id === id))
        .filter((t): t is TreatmentModel => t !== undefined)
    }));

    console.log(`Successfully loaded ${result.length} appointments with related data`);
    return result;
  }

  /**
   * Internal method to load upcoming appointments
   */
  private async loadUpcomingAppointmentsInternal(): Promise<AppointmentWithRelatedData[]> {
    console.log('Loading upcoming appointments...');

    // Step 1: Query upcoming appointments from Firebase (date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsQuery = query(
      collection(this.db, environment.collectionPaths.appointments),
      where('organizationId', '==', environment.organizationId),
      where('appointmentDate', '>=', today.toISOString()),
      where('isActive', '==', true)
    );

    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = appointmentsSnapshot.docs.map(doc => 
      AppointmentModel.fromMap({ id: doc.id, ...doc.data() })
    );

    console.log(`Found ${appointments.length} upcoming appointments`);

    if (appointments.length === 0) {
      return [];
    }

    // Step 2: Extract all unique treatment IDs from appointments
    const treatmentIds = [...new Set(
      appointments.flatMap(apt => apt.treatmentIds || []).filter(id => id)
    )];

    // Step 3: Extract all unique patient IDs from appointments
    const patientIds = [...new Set(
      appointments.map(apt => apt.patientId).filter(id => id)
    )];

    console.log(`Fetching ${patientIds.length} patients and ${treatmentIds.length} treatments`);

    // Step 4: Fetch all required patients and treatments in parallel
    const [patients, treatments] = await Promise.all([
      this.fetchPatientsByIds(patientIds),
      this.fetchTreatmentsByIds(treatmentIds)
    ]);

    // Step 5: Combine appointments with their related data
    const result: AppointmentWithRelatedData[] = appointments.map(appointment => ({
      appointment,
      patient: patients.find(p => p.id === appointment.patientId) || null,
      treatments: (appointment.treatmentIds || [])
        .map(id => treatments.find(t => t.id === id))
        .filter((t): t is TreatmentModel => t !== undefined)
    }));

    console.log(`Successfully loaded ${result.length} upcoming appointments with related data`);
    return result;
  }

  /**
   * Fetch patients by IDs using Firestore 'in' operator
   * Handles batching for Firestore's 10-item limit
   */
  private async fetchPatientsByIds(patientIds: string[]): Promise<PatientModel[]> {
    if (patientIds.length === 0) {
      return [];
    }

    const patients: PatientModel[] = [];
    const patientsRef = collection(this.db, environment.collectionPaths.patients);
    
    // Firestore 'in' queries are limited to 10 items, so batch if needed
    const batches = this.chunkArray(patientIds, 10);
    
    for (const batch of batches) {
      const q = query(patientsRef, where(documentId(), 'in', batch));
      const snapshot = await getDocs(q);
      patients.push(...snapshot.docs.map(doc => 
        PatientModel.fromMap({ id: doc.id, ...doc.data() })
      ));
    }
    
    return patients;
  }

  /**
   * Fetch treatments by IDs using Firestore 'in' operator
   * Handles batching for Firestore's 10-item limit
   */
  private async fetchTreatmentsByIds(treatmentIds: string[]): Promise<TreatmentModel[]> {
    if (treatmentIds.length === 0) {
      return [];
    }

    const treatments: TreatmentModel[] = [];
    const treatmentsRef = collection(this.db, environment.collectionPaths.treatments);
    
    const batches = this.chunkArray(treatmentIds, 10);
    
    for (const batch of batches) {
      const q = query(treatmentsRef, where(documentId(), 'in', batch));
      const snapshot = await getDocs(q);
      treatments.push(...snapshot.docs.map(doc => 
        TreatmentModel.fromMap({ id: doc.id, ...doc.data() })
      ));
    }
    
    return treatments;
  }

  /**
   * Utility method to chunk an array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a date for grouping (YYYY-MM-DD)
   */
  formatDateForGrouping(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Group appointments by date
   */
  groupAppointmentsByDate(appointments: AppointmentWithRelatedData[]): Map<string, AppointmentWithRelatedData[]> {
    const groupedAppointments = new Map<string, AppointmentWithRelatedData[]>();

    appointments.forEach(item => {
      const date = new Date(item.appointment.appointmentDate);
      const dateKey = this.formatDateForGrouping(date);
      
      if (!groupedAppointments.has(dateKey)) {
        groupedAppointments.set(dateKey, []);
      }
      groupedAppointments.get(dateKey)!.push(item);
    });

    // Sort appointments within each date group by appointment number
    groupedAppointments.forEach((appointments) => {
      appointments.sort((a, b) => {
        const dateComparison = new Date(a.appointment.appointmentDate).getTime() - 
                              new Date(b.appointment.appointmentDate).getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
        return a.appointment.appointmentNumber - b.appointment.appointmentNumber;
      });
    });

    return groupedAppointments;
  }
}
