import { inject, Injectable } from '@angular/core';
import { Appointment } from '../models/appointment';
import { PatientModel } from '../models/patient.model';
import { TreatmentModel } from '../models/treatment.model';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';
import { AppointmentModel } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class StartupService {
  appointments: Map<string, Appointment[]> = new Map();
  treatments: Map<string, TreatmentModel> = new Map();
  patients: Map<string, PatientModel> = new Map();

  private treatmentLoaded = false;
  private patientLoaded = false;
  private appointmentLoaded = false;

  private firebaseService: FirebaseService = inject(FirebaseService);

  loadData(): Promise<void> {
    console.log('Loading data...');

    return Promise.all([
      this.firebaseService.getTreatments(environment.collectionPaths.treatments),
      this.firebaseService.getPatients(environment.collectionPaths.patients),
      this.firebaseService.getUpcomingAppointments(environment.collectionPaths.appointments),
    ]).then(([treatmentsOb, patientsOb, appointmentOb]) => {
      
      treatmentsOb.subscribe((treatmentsArray) => {
        var list = treatmentsArray.forEach(treatment => this.treatments.set(treatment.id, treatment));
        this.treatmentLoaded = true;
        return list;
      });
      patientsOb.subscribe((patientsArray) => {
        var list = patientsArray.forEach(patient => this.patients.set(patient.patientId, patient));
        this.patientLoaded = true;
        return list;
      });
      var appointmentsList: AppointmentModel[] = [];
      appointmentOb.subscribe((appointmentsArray) => {
        this.appointmentLoaded = true;
        return appointmentsList = appointmentsArray;
      });

      const waitForDataLoad = new Promise<void>((resolve) => {
        const checkDataLoaded = () => {
          if (this.treatmentLoaded && this.patientLoaded && this.appointmentLoaded) {
            resolve();
          } else {
            setTimeout(checkDataLoaded, 100);
          }
        };
        checkDataLoaded();
      });

      waitForDataLoad.then(() => {
        const appointmentsArray = appointmentsList.map(appointmentModel => {
          const treatment = this.treatments.get(appointmentModel.treatmentId) as TreatmentModel;
          const patient = this.patients.get(appointmentModel.patientId) as PatientModel;
          
          if (treatment && patient) {
            return new Appointment(
              appointmentModel.id,
              treatment,
              patient,
              new Date(appointmentModel.date),
              appointmentModel.appointmentNumber,
              appointmentModel.isDone,
              appointmentModel.visited,
              true
            );
          } else {
            console.warn(`Missing treatment or patient for appointment ${appointmentModel.id}`);
            return null;
          }
        }).filter(appointment => appointment !== null) as Appointment[];

        appointmentsArray.sort((a, b) => {
          const dateComparison = a.date.getTime() - b.date.getTime();
          if (dateComparison !== 0) {
            return dateComparison;
          }
          return a.appointmentNo - b.appointmentNo;
        });

        this.appointments = this.groupAppointmentsByDate(appointmentsArray);
      });
      console.log('Data loaded successfully!');
    }).catch(error => {
      console.error('Error loading data:', error);
      throw error;
    });
  }

  groupAppointmentsByDate(appointmentList: Appointment[]): Map<string, Appointment[]> {
    const groupedAppointments = new Map<string, Appointment[]>();

    appointmentList.forEach(appointment => {
      const dateKey = appointment.date.toISOString().split('T')[0];
      if (!groupedAppointments.has(dateKey)) {
        groupedAppointments.set(dateKey, []);
      }
      groupedAppointments.get(dateKey)!.push(appointment);
    });

    return groupedAppointments;
  }

  async getUpcomingAppointments(): Promise<Map<string, Appointment[]>> {
    const waitForDataLoad = new Promise<void>((resolve) => {
      const checkDataLoaded = () => {
        if (this.treatmentLoaded && this.patientLoaded && this.appointmentLoaded) {
          resolve();
        } else {
          setTimeout(checkDataLoaded, 100);
        }
      };
      checkDataLoaded();
    });
    await waitForDataLoad;
    return this.appointments;
  }

  async searchAppointmentsByDate(searchDate: string): Promise<Map<string, Appointment[]>> {
    try {
      const appointmentOb = this.firebaseService.getAppointmentsByDate(environment.collectionPaths.appointments, searchDate);
      
      return new Promise((resolve, reject) => {
        appointmentOb.subscribe({
          next: (appointmentsArray) => {
            const appointmentsList = appointmentsArray.map(appointmentModel => {
              const treatment = this.treatments.get(appointmentModel.treatmentId) as TreatmentModel;
              const patient = this.patients.get(appointmentModel.patientId) as PatientModel;
              
              if (treatment && patient) {
                return new Appointment(
                  appointmentModel.id,
                  treatment,
                  patient,
                  new Date(appointmentModel.date),
                  appointmentModel.appointmentNumber,
                  appointmentModel.isDone,
                  appointmentModel.visited,
                  true
                );
              } else {
                console.warn(`Missing treatment or patient for appointment ${appointmentModel.id}`);
                return null;
              }
            }).filter(appointment => appointment !== null) as Appointment[];

            appointmentsList.sort((a, b) => {
              const dateComparison = a.date.getTime() - b.date.getTime();
              if (dateComparison !== 0) {
                return dateComparison;
              }
              return a.appointmentNo - b.appointmentNo;
            });

            const groupedAppointments = this.groupAppointmentsByDate(appointmentsList);
            resolve(groupedAppointments);
          },
          error: (error) => {
            console.error('Error searching appointments:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error in searchAppointmentsByDate:', error);
      throw error;
    }
  }
}
