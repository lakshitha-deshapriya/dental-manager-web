import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Appointment } from './models/appointment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, AppointmentWithRelatedData } from './services/data.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'dental-manager-web';
  private dataService: DataService = inject(DataService);
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
    // UI loads immediately, data loads in background (non-blocking)
    this.loading = true;
    console.log('App component init - loading upcoming appointments in background');
    
    // Load upcoming appointments (non-blocking Observable)
    this.dataService.getUpcomingAppointments().subscribe({
      next: (appointmentsWithData) => {
        this.zone.run(() => {
          // Convert to legacy Appointment format and group by date
          const appointmentMap = this.convertAndGroupAppointments(appointmentsWithData);
          this.appointments = appointmentMap;
          this.hasAppointments = appointmentMap.size > 0;
          this.loading = false;
          console.log(`Loaded ${appointmentMap.size} days with appointments`);
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error loading upcoming appointments:', error);
        this.zone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
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

    // Use DataService to search by date (non-blocking)
    this.dataService.getAppointmentsForDate(this.searchDate).subscribe({
      next: (appointmentsWithData) => {
        this.zone.run(() => {
          const searchResults = this.convertAndGroupAppointments(appointmentsWithData);
          this.searchLoading = false;
          this.hasSearchResults = searchResults.size > 0;
          this.searchResults = searchResults;
          console.log(`Found ${searchResults.size} days with appointments for ${this.searchDate}`);
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error searching appointments:', error);
        this.zone.run(() => {
          this.searchLoading = false;
          this.hasSearchResults = false;
          this.searchResults = new Map();
          this.cdr.detectChanges();
        });
      }
    });
  }

  /**
   * Convert AppointmentWithRelatedData to legacy Appointment format and group by date
   */
  private convertAndGroupAppointments(appointmentsWithData: AppointmentWithRelatedData[]): Map<string, Appointment[]> {
    const appointments: Appointment[] = [];

    for (const item of appointmentsWithData) {
      // Skip if missing critical data
      if (!item.patient || !item.treatments || item.treatments.length === 0) {
        console.warn('Skipping appointment with missing data:', item.appointment.id);
        continue;
      }

      // Convert to legacy Appointment format (uses first treatment for compatibility)
      const appointment = new Appointment(
        item.appointment.id,
        item.treatments[0],
        item.patient,
        new Date(item.appointment.appointmentDate),
        item.appointment.appointmentNumber,
        item.appointment.status === 'completed',
        item.appointment.status === 'arrived',
        item.appointment.isActive,
        item.appointment.status || 'scheduled'
      );

      appointments.push(appointment);
    }

    // Group by date
    return this.groupAppointmentsByDate(appointments);
  }

  /**
   * Group appointments by date key (YYYY-MM-DD)
   */
  private groupAppointmentsByDate(appointments: Appointment[]): Map<string, Appointment[]> {
    const groupedAppointments = new Map<string, Appointment[]>();

    appointments.forEach(appointment => {
      const dateKey = this.dataService.formatDateForGrouping(appointment.date);
      
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
