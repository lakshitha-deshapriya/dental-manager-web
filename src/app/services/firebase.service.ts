import { inject, Injectable } from '@angular/core';
import { AppointmentModel, AppointmentStatus } from '../models/appointment.model';
import { TreatmentModel } from '../models/treatment.model';
import { PatientModel } from '../models/patient.model';
import { collection, collectionData, Firestore, getDocs, query, where, doc, getDoc, documentId } from '@angular/fire/firestore';
import { from, map, Observable, forkJoin, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db: Firestore = inject(Firestore);

  // Get treatments filtered by organization ID
  getTreatments(): Observable<TreatmentModel[]> {
    const q = query(
      collection(this.db, environment.collectionPaths.treatments),
      where('organizationId', '==', environment.organizationId),
      where('isActive', '==', true)
    );
    
    return from(getDocs(q)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => 
          TreatmentModel.fromMap({ id: doc.id, ...doc.data() })
        )
      )
    );
  }

  // Get patients filtered by organization ID
  getPatients(): Observable<PatientModel[]> {
    const q = query(
      collection(this.db, environment.collectionPaths.patients),
      where('organizationId', '==', environment.organizationId),
      where('isActive', '==', true)
    );
    
    return from(getDocs(q)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => 
          PatientModel.fromMap({ id: doc.id, ...doc.data() })
        )
      )
    );
  }

  // Get appointments filtered by organization ID
  getAppointmentsByOrganization(): Observable<AppointmentModel[]> {
    const q = query(
      collection(this.db, environment.collectionPaths.appointments),
      where('organizationId', '==', environment.organizationId),
      where('isActive', '==', true)
    );
    
    return from(getDocs(q)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => 
          AppointmentModel.fromMap({ id: doc.id, ...doc.data() })
        )
      )
    );
  }

  // Get appointments with related patient and treatment data
  getAppointmentsWithRelatedData(): Observable<any[]> {
    return new Observable(observer => {
      this.getAppointmentsByOrganization().subscribe(async (appointments) => {
        try {
          // Extract unique patient and treatment IDs
          const patientIds = [...new Set(appointments.map(apt => apt.patientId).filter(id => id))];
          const treatmentIds = [...new Set(
            appointments.flatMap(apt => apt.treatmentIds || []).filter(id => id)
          )];

          // Fetch patients and treatments
          const [patients, treatments] = await Promise.all([
            this.fetchPatientsByIds(patientIds),
            this.fetchTreatmentsByIds(treatmentIds)
          ]);

          // Combine data
          const result = appointments.map(appointment => ({
            ...appointment,
            patient: patients.find(p => p.id === appointment.patientId),
            treatments: (appointment.treatmentIds || [])
              .map(id => treatments.find(t => t.id === id))
              .filter(Boolean)
          }));

          observer.next(result);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      });
    });
  }

  // Get upcoming appointments with related patient and treatment data (OPTIMIZED)
  getUpcomingAppointmentsWithRelatedData(): Observable<any[]> {
    return new Observable(observer => {
      this.getUpcomingAppointments().subscribe(async (appointments) => {
        try {
          // Extract unique patient and treatment IDs
          const patientIds = [...new Set(appointments.map(apt => apt.patientId).filter(id => id))];
          const treatmentIds = [...new Set(
            appointments.flatMap(apt => apt.treatmentIds || []).filter(id => id)
          )];

          // Fetch patients and treatments in parallel
          const [patients, treatments] = await Promise.all([
            this.fetchPatientsByIds(patientIds),
            this.fetchTreatmentsByIds(treatmentIds)
          ]);

          // Combine data
          const result = appointments.map(appointment => ({
            ...appointment,
            patient: patients.find(p => p.id === appointment.patientId),
            treatments: (appointment.treatmentIds || [])
              .map(id => treatments.find(t => t.id === id))
              .filter(Boolean)
          }));

          observer.next(result);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      });
    });
  }

  // Get appointments by date with related data (OPTIMIZED)
  getAppointmentsByDateWithRelatedData(targetDate: string): Observable<any[]> {
    return new Observable(observer => {
      this.getAppointmentsByDate(targetDate).subscribe(async (appointments) => {
        try {
          // Extract unique patient and treatment IDs
          const patientIds = [...new Set(appointments.map(apt => apt.patientId).filter(id => id))];
          const treatmentIds = [...new Set(
            appointments.flatMap(apt => apt.treatmentIds || []).filter(id => id)
          )];

          // Fetch patients and treatments in parallel
          const [patients, treatments] = await Promise.all([
            this.fetchPatientsByIds(patientIds),
            this.fetchTreatmentsByIds(treatmentIds)
          ]);

          // Combine data
          const result = appointments.map(appointment => ({
            ...appointment,
            patient: patients.find(p => p.id === appointment.patientId),
            treatments: (appointment.treatmentIds || [])
              .map(id => treatments.find(t => t.id === id))
              .filter(Boolean)
          }));

          observer.next(result);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      });
    });
  }

  // Get today's appointments with related data (OPTIMIZED)
  getTodaysAppointmentsWithRelatedData(): Observable<any[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointmentsByDateWithRelatedData(today);
  }

  // Get appointments by status with related data (OPTIMIZED)
  getAppointmentsByStatusWithRelatedData(status: AppointmentStatus): Observable<any[]> {
    return new Observable(observer => {
      this.getAppointmentsByStatus(status).subscribe(async (appointments) => {
        try {
          // Extract unique patient and treatment IDs
          const patientIds = [...new Set(appointments.map(apt => apt.patientId).filter(id => id))];
          const treatmentIds = [...new Set(
            appointments.flatMap(apt => apt.treatmentIds || []).filter(id => id)
          )];

          // Fetch patients and treatments in parallel
          const [patients, treatments] = await Promise.all([
            this.fetchPatientsByIds(patientIds),
            this.fetchTreatmentsByIds(treatmentIds)
          ]);

          // Combine data
          const result = appointments.map(appointment => ({
            ...appointment,
            patient: patients.find(p => p.id === appointment.patientId),
            treatments: (appointment.treatmentIds || [])
              .map(id => treatments.find(t => t.id === id))
              .filter(Boolean)
          }));

          observer.next(result);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      });
    });
  }

  private async fetchPatientsByIds(patientIds: string[]): Promise<PatientModel[]> {
    if (patientIds.length === 0) return [];
    
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

  private async fetchTreatmentsByIds(treatmentIds: string[]): Promise<TreatmentModel[]> {
    if (treatmentIds.length === 0) return [];
    
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

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Get upcoming appointments
  getUpcomingAppointments(): Observable<AppointmentModel[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(this.db, environment.collectionPaths.appointments),
      where('organizationId', '==', environment.organizationId),
      where('appointmentDate', '>=', today.toISOString()),
      where('isActive', '==', true)
    );

    return from(getDocs(q)).pipe( 
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => 
          AppointmentModel.fromMap({ id: doc.id, ...doc.data() })
        )
      )
    );
  }

  // Get appointments by date
  getAppointmentsByDate(targetDate: string): Observable<AppointmentModel[]> {
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const q = query(
      collection(this.db, environment.collectionPaths.appointments),
      where('organizationId', '==', environment.organizationId),
      where('appointmentDate', '>=', startDate.toISOString()),
      where('appointmentDate', '<=', endDate.toISOString()),
      where('isActive', '==', true)
    );

    return from(getDocs(q)).pipe( 
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => 
          AppointmentModel.fromMap({ id: doc.id, ...doc.data() })
        )
      )
    );
  }

  // Get appointments by status
  getAppointmentsByStatus(status: AppointmentStatus): Observable<AppointmentModel[]> {
    const q = query(
      collection(this.db, environment.collectionPaths.appointments),
      where('organizationId', '==', environment.organizationId),
      where('status', '==', status),
      where('isActive', '==', true)
    );

    return from(getDocs(q)).pipe( 
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => 
          AppointmentModel.fromMap({ id: doc.id, ...doc.data() })
        )
      )
    );
  }

  // Get a specific appointment by ID
  async getAppointmentById(appointmentId: string): Promise<AppointmentModel | null> {
    const appointmentRef = doc(this.db, environment.collectionPaths.appointments, appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (appointmentSnap.exists()) {
      const data = appointmentSnap.data();
      // Check if appointment belongs to our organization
      if (data && data['organizationId'] === environment.organizationId) {
        return AppointmentModel.fromMap({ id: appointmentSnap.id, ...data });
      }
    }
    return null;
  }

  // Get a specific patient by ID
  async getPatientById(patientId: string): Promise<PatientModel | null> {
    const patientRef = doc(this.db, environment.collectionPaths.patients, patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      const data = patientSnap.data();
      // Check if patient belongs to our organization
      if (data && data['organizationId'] === environment.organizationId) {
        return PatientModel.fromMap({ id: patientSnap.id, ...data });
      }
    }
    return null;
  }

  // Get a specific treatment by ID
  async getTreatmentById(treatmentId: string): Promise<TreatmentModel | null> {
    const treatmentRef = doc(this.db, environment.collectionPaths.treatments, treatmentId);
    const treatmentSnap = await getDoc(treatmentRef);
    
    if (treatmentSnap.exists()) {
      const data = treatmentSnap.data();
      // Check if treatment belongs to our organization
      if (data && data['organizationId'] === environment.organizationId) {
        return TreatmentModel.fromMap({ id: treatmentSnap.id, ...data });
      }
    }
    return null;
  }

  // Get today's appointments
  getTodaysAppointments(): Observable<AppointmentModel[]> {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    return this.getAppointmentsByDate(today);
  }

  // Get appointments for a specific patient
  getAppointmentsByPatient(patientId: string): Observable<AppointmentModel[]> {
    const q = query(
      collection(this.db, environment.collectionPaths.appointments),
      where('organizationId', '==', environment.organizationId),
      where('patientId', '==', patientId),
      where('isActive', '==', true)
    );

    return from(getDocs(q)).pipe( 
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => 
          AppointmentModel.fromMap({ id: doc.id, ...doc.data() })
        )
      )
    );
  }
}
