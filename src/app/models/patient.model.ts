export class PatientModel {
  constructor(
    public patientId: string,
    public mobileNumber: string,
    public patientName: string
  ) {}

  static fromMap(data: any): PatientModel {
    return new PatientModel(
      data.patientId,
      data.mobileNumber,
      data.patientName
    );
  }

  toMap(): any {
    return {
      patientId: this.patientId,
      mobileNumber: this.mobileNumber,
      patientName: this.patientName
    };
  }
}
