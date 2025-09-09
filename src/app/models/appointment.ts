import { PatientModel } from "./patient.model";
import { TreatmentModel } from "./treatment.model";

export class Appointment {
    constructor(
        public appointmentId: string,
        public treatment: TreatmentModel,
        public patient: PatientModel,
        public date: Date,
        public appointmentNo: number,
        public isDone: boolean,
        public visited: boolean,
        public existingPatient: boolean,
        public status: string = 'scheduled'
    ) {}

    get statusDisplay(): string {
        switch (this.status) {
            case 'scheduled':
                return 'Scheduled';
            case 'arrived':
                return 'Arrived';
            case 'inProgress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            case 'rescheduled':
                return 'Rescheduled';
            default:
                return 'Unknown';
        }
    }

    get statusClass(): string {
        switch (this.status) {
            case 'scheduled':
                return 'status-scheduled';
            case 'arrived':
                return 'status-arrived';
            case 'inProgress':
                return 'status-in-progress';
            case 'completed':
                return 'status-completed';
            case 'cancelled':
                return 'status-cancelled';
            case 'rescheduled':
                return 'status-rescheduled';
            default:
                return 'status-unknown';
        }
    }
}