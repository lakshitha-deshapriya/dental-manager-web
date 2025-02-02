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
        public existingPatient: boolean
    ) {}
}