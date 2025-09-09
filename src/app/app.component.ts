import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StartupService } from './services/startup.service';
import { Appointment } from './models/appointment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'dental-manager-web';
  private startupService: StartupService = inject(StartupService);
  private firebaseService: FirebaseService = inject(FirebaseService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  // Navigation
  activeTab: 'home' | 'search' = 'home';

  // Home tab data
  appointments: Map<string, Appointment[]> = new Map();
  loading: boolean = false;
  hasAppointments: boolean = false;

  // Search tab data
  searchDate: string = '';
  searchResults: Map<string, Appointment[]> = new Map();
  searchLoading: boolean = false;
  hasSearchResults: boolean = false;
  searchPerformed: boolean = false;

  ngOnInit(): void {
    this.loading = true;
    console.log('App component init');
    
    // Load initial data
    this.startupService.loadData().then(() => {
      return this.startupService.getUpcomingAppointments();
    }).then((appointmentMap) => {
      this.zone.run(() => {
        this.loading = false;
        this.hasAppointments = appointmentMap.size > 0;
        this.appointments = appointmentMap;
        console.log(this.appointments.size);
        this.cdr.detectChanges();
      });
    }).catch((error) => {
      console.error('Error loading appointments:', error);
      this.zone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  // Navigation methods
  switchTab(tab: 'home' | 'search'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  // Search methods
  async searchAppointments(): Promise<void> {
    if (!this.searchDate) {
      return;
    }

    this.searchLoading = true;
    this.searchPerformed = true;
    this.cdr.detectChanges();

    try {
      const searchResults = await this.startupService.searchAppointmentsByDate(this.searchDate);
      this.zone.run(() => {
        this.searchLoading = false;
        this.hasSearchResults = searchResults.size > 0;
        this.searchResults = searchResults;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error searching appointments:', error);
      this.zone.run(() => {
        this.searchLoading = false;
        this.hasSearchResults = false;
        this.searchResults = new Map();
        this.cdr.detectChanges();
      });
    }
  }

  clearSearch(): void {
    this.searchDate = '';
    this.searchResults = new Map();
    this.hasSearchResults = false;
    this.searchPerformed = false;
    this.cdr.detectChanges();
  }

  getDateStatistics(date: string, appointmentMap: Map<string, Appointment[]>) {
    const appointments = appointmentMap.get(date) || [];
    
    return {
      total: appointments.length,
      ongoing: appointments.filter(apt => apt.status === 'inProgress' || apt.status === 'arrived').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length
    };
  }

  getSortedDates(appointmentMap: Map<string, Appointment[]>): string[] {
    return Array.from(appointmentMap.keys()).sort((a, b) => {
      // Convert date strings to Date objects for proper comparison
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
  }
}
