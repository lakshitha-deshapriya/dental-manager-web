export enum AppointmentStatus {
  scheduled = 'scheduled',
  arrived = 'arrived',
  inProgress = 'inProgress',
  completed = 'completed',
  cancelled = 'cancelled',
  rescheduled = 'rescheduled'
}

export enum AppointmentType {
  consultation = 'consultation',
  treatment = 'treatment',
  followUp = 'followUp',
  checkup = 'checkup',
  emergency = 'emergency',
  cleaning = 'cleaning'
}

export class AppointmentModel {
  constructor(
    public id: string,
    public patientId: string,
    public organizationId: string,
    public doctorId: string | null,
    public title: string,
    public appointmentNumber: number,
    public appointmentDate: string, // ISO string format
    public status: AppointmentStatus,
    public type: AppointmentType,
    public treatmentIds: string[],
    public notes: string | null,
    public isActive: boolean,
    public createdAt?: number,
    public updatedAt?: number
  ) {}

  static fromMap(data: any): AppointmentModel {
    return new AppointmentModel(
      data.id,
      data.patientId,
      data.organizationId,
      data.doctorId || null,
      data.title,
      data.appointmentNumber,
      data.appointmentDate,
      data.status || AppointmentStatus.scheduled,
      data.type || AppointmentType.consultation,
      data.treatmentIds || [],
      data.notes || null,
      data.isActive !== undefined ? data.isActive : true,
      data.createdAt,
      data.updatedAt
    );
  }

  toMap(): any {
    return {
      id: this.id,
      patientId: this.patientId,
      organizationId: this.organizationId,
      doctorId: this.doctorId,
      title: this.title,
      appointmentNumber: this.appointmentNumber,
      appointmentDate: this.appointmentDate,
      status: this.status,
      type: this.type,
      treatmentIds: this.treatmentIds,
      notes: this.notes,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  get isToday(): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDateObj = new Date(this.appointmentDate);
    const appointment = new Date(appointmentDateObj.getFullYear(), appointmentDateObj.getMonth(), appointmentDateObj.getDate());
    return appointment.getTime() === today.getTime();
  }

  get isUpcoming(): boolean {
    return new Date(this.appointmentDate) > new Date();
  }

  get isPast(): boolean {
    return new Date(this.appointmentDate) < new Date();
  }

  get isInProgress(): boolean {
    return this.status === AppointmentStatus.inProgress;
  }

  get canBeCancelled(): boolean {
    return this.status === AppointmentStatus.scheduled || this.status === AppointmentStatus.arrived;
  }

  get canBeRescheduled(): boolean {
    return this.status === AppointmentStatus.scheduled || this.status === AppointmentStatus.arrived;
  }

  get statusDisplayName(): string {
    switch (this.status) {
      case AppointmentStatus.scheduled:
        return 'Scheduled';
      case AppointmentStatus.arrived:
        return 'Arrived';
      case AppointmentStatus.inProgress:
        return 'In Progress';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
    }
  }

  get typeDisplayName(): string {
    switch (this.type) {
      case AppointmentType.consultation:
        return 'Consultation';
      case AppointmentType.treatment:
        return 'Treatment';
      case AppointmentType.followUp:
        return 'Follow-up';
      case AppointmentType.checkup:
        return 'Check-up';
      case AppointmentType.emergency:
        return 'Emergency';
      case AppointmentType.cleaning:
        return 'Cleaning';
    }
  }
}
