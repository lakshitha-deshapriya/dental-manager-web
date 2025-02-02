export class AppointmentModel {
  constructor(
    public id: string,
    public date: string,
    public numericDate: number,
    public patientId: string,
    public appointmentNumber: number,
    public treatmentId: string,
    public isDone: boolean,
    public visited: boolean
  ) {}

  static fromMap(data: any): AppointmentModel {
    return new AppointmentModel(
      data.id,
      data.date,
      data.numericDate,
      data.patientId,
      data.appointmentNumber,
      data.treatmentId,
      data.isDone,
      data.visited
    );
  }

  toMap(): any {
    return {
      id: this.id,
      date: this.date,
      numericDate: this.numericDate,
      patientId: this.patientId,
      appointmentNumber: this.appointmentNumber,
      treatmentId: this.treatmentId,
      isDone: this.isDone,
      visited: this.visited
    };
  }
}
