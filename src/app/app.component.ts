import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StartupService } from './services/startup.service';
import { Appointment } from './models/appointment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'dental-manager-web';
  private startupService: StartupService = inject(StartupService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  appointments: Map<string, Appointment[]> = new Map();
  loading: boolean = false;
  hasAppointments: boolean = false;

  ngOnInit(): void {
    this.loading = true;
    console.log('App component init');
    this.startupService.getUpcomingAppointments().then((appointmentMap) => {
      this.zone.run(() => {
        this.loading = false;
        this.hasAppointments = appointmentMap.size > 0;
        this.appointments = appointmentMap;
        console.log(this.appointments.size);
        this.cdr.detectChanges();
      });

    });
  }

}
