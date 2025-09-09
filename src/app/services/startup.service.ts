import { inject, Injectable } from '@angular/core';
import { Appointment } from '../models/appointment';
import { PatientModel } from '../models/patient.model';
import { TreatmentModel } from '../models/treatment.model';
import { FirebaseService } from './firebase.service';
import { AppointmentModel } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class StartupService {
  appointments: Map<string, Appointment[]> = new Map();

  private firebaseService: FirebaseService = inject(FirebaseService);

  async loadData(): Promise<Map<string, Appointment[]>> {
    console.log('Loading data...');

    try {
      // Get all data with related information using the new method
      const appointmentsWithData = await this.firebaseService.getAppointmentsWithRelatedData().toPromise();
      
      if (!appointmentsWithData) {
        console.warn('No appointments data received');
        return new Map();
      }
      
      // Convert to the Appointment format expected by the UI
      const appointmentsList = appointmentsWithData.map((item: any) => {
        if (item.patient && item.treatments && item.treatments.length > 0) {
          return new Appointment(
            item.id,
            item.treatments[0], // Use first treatment for compatibility
            item.patient,
            new Date(item.appointmentDate),
            item.appointmentNumber,
            item.status === 'completed',
            item.status === 'arrived',
            item.isActive,
            item.status || 'scheduled'
          );
        }
        return null;
      }).filter((appointment: any) => appointment !== null) as Appointment[];

      // Group appointments by date
      const groupedAppointments = this.groupAppointmentsByDate(appointmentsList);

      this.appointments = groupedAppointments;
      console.log('Data loaded successfully:', this.appointments);
      return this.appointments;
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  groupAppointmentsByDate(appointmentList: Appointment[]): Map<string, Appointment[]> {
    const groupedAppointments = new Map<string, Appointment[]>();

    appointmentList.forEach(appointment => {
      // Use local date formatting to avoid timezone issues
      const year = appointment.date.getFullYear();
      const month = String(appointment.date.getMonth() + 1).padStart(2, '0');
      const day = String(appointment.date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!groupedAppointments.has(dateKey)) {
        groupedAppointments.set(dateKey, []);
      }
      groupedAppointments.get(dateKey)!.push(appointment);
    });

    // Sort appointments within each date group
    groupedAppointments.forEach((appointments) => {
      appointments.sort((a, b) => {
        const dateComparison = a.date.getTime() - b.date.getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
        return a.appointmentNo - b.appointmentNo;
      });
    });

    return groupedAppointments;
  }

  async getUpcomingAppointments(): Promise<Map<string, Appointment[]>> {
    // First load all data
    const allAppointments = await this.loadData();
    
    // Get today's date in YYYY-MM-DD format using local time
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    // Filter to only show today and future appointments
    const upcomingAppointments = new Map<string, Appointment[]>();
    
    allAppointments.forEach((appointments, dateKey) => {
      if (dateKey >= todayStr) {
        upcomingAppointments.set(dateKey, appointments);
      }
    });
    
    console.log('Today\'s date:', todayStr);
    console.log('Filtered upcoming appointments:', upcomingAppointments);
    return upcomingAppointments;
  }

  async searchAppointmentsByDate(searchDate: string): Promise<Map<string, Appointment[]>> {
    try {
      console.log('Searching appointments for date:', searchDate);
      
      const appointmentsForDate = await this.firebaseService.getAppointmentsByDate(searchDate).toPromise();
      
      if (!appointmentsForDate || appointmentsForDate.length === 0) {
        return new Map();
      }

      // Get related data for these appointments
      const appointmentsWithData = await this.firebaseService.getAppointmentsWithRelatedData().toPromise();
      
      if (!appointmentsWithData) {
        console.warn('No appointments data received for search');
        return new Map();
      }
      
      // Filter to only the appointments for the searched date
      const filteredAppointments = appointmentsWithData.filter((item: any) => {
        const appointmentDate = new Date(item.appointmentDate);
        const year = appointmentDate.getFullYear();
        const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
        const day = String(appointmentDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        return dateKey === searchDate;
      });

      // Convert to Appointment format
      const appointmentsList = filteredAppointments.map((item: any) => {
        if (item.patient && item.treatments && item.treatments.length > 0) {
          return new Appointment(
            item.id,
            item.treatments[0],
            item.patient,
            new Date(item.appointmentDate),
            item.appointmentNumber,
            item.status === 'completed',
            item.status === 'arrived',
            item.isActive,
            item.status || 'scheduled'
          );
        }
        return null;
      }).filter((appointment: any) => appointment !== null) as Appointment[];

      const groupedAppointments = this.groupAppointmentsByDate(appointmentsList);

      console.log('Search results:', groupedAppointments);
      return groupedAppointments;
    } catch (error) {
      console.error('Error searching appointments:', error);
      return new Map();
    }
  }
}
