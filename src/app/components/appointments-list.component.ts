import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../services/firebase.service';
import { AppointmentModel, AppointmentStatus } from '../models/appointment.model';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="appointments-container">
      <h2>Appointments for Organization: {{ organizationId }}</h2>
      
      <div class="filter-buttons">
        <button (click)="loadAllAppointments()" [class.active]="currentFilter === 'all'">
          All Appointments
        </button>
        <button (click)="loadTodaysAppointments()" [class.active]="currentFilter === 'today'">
          Today's Appointments
        </button>
        <button (click)="loadUpcomingAppointments()" [class.active]="currentFilter === 'upcoming'">
          Upcoming
        </button>
        <button (click)="loadAppointmentsByStatus('scheduled')" [class.active]="currentFilter === 'scheduled'">
          Scheduled
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        Loading appointments...
      </div>

      <div *ngIf="error" class="error">
        Error loading appointments: {{ error }}
      </div>

      <div *ngIf="!loading && !error" class="appointments-list">
        <div class="appointments-count">
          Found {{ appointmentsWithData.length }} appointment(s)
        </div>

        <div *ngFor="let appointment of appointmentsWithData" class="appointment-card">
          <div class="appointment-header">
            <h3>{{ appointment.title }}</h3>
            <span class="status-badge" [class]="'status-' + appointment.status">
              {{ appointment.statusDisplayName }}
            </span>
          </div>
          
          <div class="appointment-details">
            <p><strong>Date:</strong> {{ formatDate(appointment.appointmentDate) }}</p>
            <p><strong>Appointment #:</strong> {{ appointment.appointmentNumber }}</p>
            <p><strong>Type:</strong> {{ appointment.typeDisplayName }}</p>
            <p><strong>Active:</strong> {{ appointment.isActive ? 'Yes' : 'No' }}</p>
            
            <div *ngIf="appointment.notes" class="notes">
              <strong>Notes:</strong> {{ appointment.notes }}
            </div>
          </div>

          <div *ngIf="appointment.patient" class="patient-info">
            <h4>Patient Information</h4>
            <p><strong>Name:</strong> {{ appointment.patient.fullName }}</p>
            <p><strong>Phone:</strong> {{ appointment.patient.phone || 'Not provided' }}</p>
            <p><strong>Email:</strong> {{ appointment.patient.email || 'Not provided' }}</p>
            <div *ngIf="appointment.patient.age" class="patient-age">
              <strong>Age:</strong> {{ appointment.patient.age }} years
            </div>
          </div>

          <div *ngIf="appointment.treatments && appointment.treatments.length > 0" class="treatments-info">
            <h4>Treatments ({{ appointment.treatments.length }})</h4>
            <ul>
              <li *ngFor="let treatment of appointment.treatments" class="treatment-item">
                <div class="treatment-main">
                  <strong>{{ treatment.name }}</strong>
                  <span class="treatment-desc">{{ treatment.description }}</span>
                </div>
                <div class="treatment-details">
                  <span *ngIf="treatment.hasTimeInfo" class="time-info">
                    ⏱️ {{ treatment.estimatedTimeDisplay }}
                  </span>
                  <span *ngIf="treatment.hasCostInfo" class="cost-info">
                    💰 {{ treatment.costRange }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div class="appointment-actions">
            <button *ngIf="appointment.canBeCancelled" class="btn btn-warning" 
                    (click)="cancelAppointment(appointment)">
              Cancel
            </button>
            <button *ngIf="appointment.canBeRescheduled" class="btn btn-info" 
                    (click)="rescheduleAppointment(appointment)">
              Reschedule
            </button>
            <button class="btn btn-primary" (click)="viewAppointmentDetails(appointment)">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .filter-buttons {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-buttons button {
      padding: 8px 16px;
      border: 2px solid #ddd;
      background: white;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s;
    }

    .filter-buttons button:hover {
      background: #f0f0f0;
    }

    .filter-buttons button.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .appointments-count {
      margin-bottom: 16px;
      font-weight: bold;
      color: #666;
    }

    .appointment-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background-color: #f9f9f9;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .appointment-header h3 {
      margin: 0;
      color: #333;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .status-scheduled { background: #e3f2fd; color: #1976d2; }
    .status-arrived { background: #f3e5f5; color: #7b1fa2; }
    .status-inProgress { background: #fff3e0; color: #f57c00; }
    .status-completed { background: #e8f5e8; color: #388e3c; }
    .status-cancelled { background: #ffebee; color: #d32f2f; }
    .status-rescheduled { background: #fce4ec; color: #c2185b; }

    .appointment-details,
    .patient-info,
    .treatments-info {
      margin-top: 12px;
    }

    .patient-info h4,
    .treatments-info h4 {
      margin-bottom: 8px;
      color: #555;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }

    .notes {
      background-color: #e9f4ff;
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
    }

    .treatment-item {
      margin-bottom: 8px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      border-left: 3px solid #007bff;
    }

    .treatment-main {
      margin-bottom: 4px;
    }

    .treatment-desc {
      display: block;
      font-size: 14px;
      color: #666;
      margin-top: 2px;
    }

    .treatment-details {
      display: flex;
      gap: 16px;
      font-size: 12px;
    }

    .time-info, .cost-info {
      color: #666;
    }

    .appointment-actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-warning { background: #ffc107; color: black; }
    .btn-info { background: #17a2b8; color: white; }

    .btn:hover {
      opacity: 0.8;
    }

    .loading {
      text-align: center;
      padding: 20px;
      font-size: 18px;
    }

    .error {
      color: red;
      text-align: center;
      padding: 20px;
      background-color: #ffe6e6;
      border-radius: 4px;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    @media (max-width: 768px) {
      .appointment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .filter-buttons {
        flex-direction: column;
      }
      
      .appointment-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AppointmentsListComponent implements OnInit {
  appointmentsWithData: any[] = [];
  loading = true;
  error: string | null = null;
  organizationId = '44fad3c4-54e2-461d-b10d-4336a5980746';
  currentFilter = 'all';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.loadAllAppointments();
  }

  loadAllAppointments() {
    this.currentFilter = 'all';
    this.loading = true;
    this.error = null;

    this.firebaseService.getAppointmentsWithRelatedData().subscribe({
      next: (data) => {
        this.appointmentsWithData = data;
        this.loading = false;
        console.log('Loaded appointments with related data:', data);
      },
      error: (err) => {
        this.error = err.message || 'Failed to load appointments';
        this.loading = false;
        console.error('Error loading appointments:', err);
      }
    });
  }

  loadTodaysAppointments() {
    this.currentFilter = 'today';
    this.loading = true;
    this.error = null;

    this.firebaseService.getTodaysAppointmentsWithRelatedData().subscribe({
      next: (data) => {
        this.appointmentsWithData = data;
        this.loading = false;
        console.log('Today\'s appointments with related data:', data);
      },
      error: (err) => {
        this.error = err.message || 'Failed to load today\'s appointments';
        this.loading = false;
        console.error('Error loading today\'s appointments:', err);
      }
    });
  }

  loadUpcomingAppointments() {
    this.currentFilter = 'upcoming';
    this.loading = true;
    this.error = null;

    this.firebaseService.getUpcomingAppointmentsWithRelatedData().subscribe({
      next: (data) => {
        this.appointmentsWithData = data;
        this.loading = false;
        console.log('Upcoming appointments with related data:', data);
      },
      error: (err) => {
        this.error = err.message || 'Failed to load upcoming appointments';
        this.loading = false;
        console.error('Error loading upcoming appointments:', err);
      }
    });
  }

  loadAppointmentsByStatus(status: string) {
    this.currentFilter = status;
    this.loading = true;
    this.error = null;

    this.firebaseService.getAppointmentsByStatusWithRelatedData(status as AppointmentStatus).subscribe({
      next: (data) => {
        this.appointmentsWithData = data;
        this.loading = false;
        console.log(`Appointments with status ${status} and related data:`, data);
      },
      error: (err) => {
        this.error = err.message || `Failed to load ${status} appointments`;
        this.loading = false;
        console.error(`Error loading ${status} appointments:`, err);
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  }

  cancelAppointment(appointment: AppointmentModel) {
    console.log('Cancel appointment:', appointment);
    // Implement cancellation logic
  }

  rescheduleAppointment(appointment: AppointmentModel) {
    console.log('Reschedule appointment:', appointment);
    // Implement rescheduling logic
  }

  viewAppointmentDetails(appointment: AppointmentModel) {
    console.log('View appointment details:', appointment);
    // Implement details view logic
  }
}
