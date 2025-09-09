export class PatientModel {
  constructor(
    public id: string,
    public title: string, // Title field - mandatory
    public firstName: string,
    public lastName: string,
    public organizationId: string,
    public email?: string | null,
    public phone?: string | null,
    public address?: string | null,
    public emergencyContact?: string | null,
    public emergencyContactPhone?: string | null,
    public medicalHistory?: string | null,
    public allergies?: string | null,
    public notes?: string | null,
    public dateOfBirth?: string | null, // ISO string format
    public gender?: string | null,
    public isActive: boolean = true,
    public createdAt?: number,
    public updatedAt?: number
  ) {}

  // Static list of common titles
  static readonly commonTitles = [
    'Mr',
    'Mrs',
    'Ms',
    'Dr',
    'Prof',
    'Master',
    'Miss',
  ];

  static fromMap(data: any): PatientModel {
    return new PatientModel(
      data.id,
      data.title,
      data.firstName,
      data.lastName,
      data.organizationId,
      data.email,
      data.phone,
      data.address,
      data.emergencyContact,
      data.emergencyContactPhone,
      data.medicalHistory,
      data.allergies,
      data.notes,
      data.dateOfBirth,
      data.gender,
      data.isActive !== undefined ? data.isActive : true,
      data.createdAt,
      data.updatedAt
    );
  }

  toMap(): any {
    return {
      id: this.id,
      title: this.title,
      firstName: this.firstName,
      lastName: this.lastName,
      organizationId: this.organizationId,
      email: this.email,
      phone: this.phone,
      address: this.address,
      emergencyContact: this.emergencyContact,
      emergencyContactPhone: this.emergencyContactPhone,
      medicalHistory: this.medicalHistory,
      allergies: this.allergies,
      notes: this.notes,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  get fullName(): string {
    return `${this.title} ${this.firstName} ${this.lastName}`.trim();
  }

  get displayName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get age(): number | null {
    if (!this.dateOfBirth) return null;
    
    const birthDate = new Date(this.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  get hasContactInfo(): boolean {
    return !!(this.phone || this.email);
  }

  get hasEmergencyContact(): boolean {
    return !!(this.emergencyContact && this.emergencyContactPhone);
  }

  get hasMedicalInfo(): boolean {
    return !!(this.medicalHistory || this.allergies);
  }
}
