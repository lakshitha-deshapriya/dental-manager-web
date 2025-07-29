import { inject, Injectable } from '@angular/core';
import { AppointmentModel } from '../models/appointment.model';
import { TreatmentModel } from '../models/treatment.model';
import { PatientModel } from '../models/patient.model';
import { collection, collectionData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db: Firestore = inject(Firestore);

  getTreatments(collectionName: string): Observable<TreatmentModel[]> {
    const observable =  collectionData(collection(this.db, collectionName)).pipe(
      map((treatments) => treatments.map((treatment) => treatment as TreatmentModel))
    );
    return observable;
  }

  getPatients(collectionName: string): Observable<PatientModel[]> {
    const observable = collectionData(collection(this.db, collectionName)).pipe(
      map((treatments) => treatments.map((treatment) => treatment as PatientModel))
    );
    return observable;
  }

  getUpcomingAppointments(collectionName: string): Observable<AppointmentModel[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(this.db, collectionName),
      where('date', '>=', today.toISOString()) 
    );

    const appointmentsObservable = from(getDocs(q)).pipe( 
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AppointmentModel[]
      )
    );

    return appointmentsObservable;
  }

  getAppointmentsByDate(collectionName: string, targetDate: string): Observable<AppointmentModel[]> {
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const q = query(
      collection(this.db, collectionName),
      where('date', '>=', startDate.toISOString()),
      where('date', '<=', endDate.toISOString())
    );

    const appointmentsObservable = from(getDocs(q)).pipe( 
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AppointmentModel[]
      )
    );

    return appointmentsObservable;
  }
}
