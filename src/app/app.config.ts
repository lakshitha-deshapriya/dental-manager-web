import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { StartupService } from './services/startup.service';
import { FirebaseService } from './services/firebase.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: FIREBASE_OPTIONS, useValue: environment.firebaseConfig },
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    FirebaseService,
    StartupService,
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const startupService = inject(StartupService);
        return () => startupService.loadData();
      },
      multi: true,
    },
  ]
};
