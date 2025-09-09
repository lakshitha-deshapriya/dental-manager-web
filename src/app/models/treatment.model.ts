export class TreatmentModel {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public organizationId: string,
    public icon?: string | null,
    public iconColor?: string | null, // Hex color code for the icon
    public parentTreatmentId?: string | null, // For sub-treatments
    public subTreatmentIds: string[] = [],
    public estimatedTimeMinutes?: number | null, // Time in minutes for flexibility
    public minimumCost?: number | null,
    public maximumCost?: number | null,
    public isActive: boolean = true,
    public createdAt?: number,
    public updatedAt?: number
  ) {}

  static fromMap(data: any): TreatmentModel {
    return new TreatmentModel(
      data.id,
      data.name,
      data.description,
      data.organizationId,
      data.icon,
      data.iconColor,
      data.parentTreatmentId,
      data.subTreatmentIds || [],
      data.estimatedTimeMinutes,
      data.minimumCost,
      data.maximumCost,
      data.isActive !== undefined ? data.isActive : true,
      data.createdAt,
      data.updatedAt
    );
  }

  toMap(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      organizationId: this.organizationId,
      icon: this.icon,
      iconColor: this.iconColor,
      parentTreatmentId: this.parentTreatmentId,
      subTreatmentIds: this.subTreatmentIds,
      estimatedTimeMinutes: this.estimatedTimeMinutes,
      minimumCost: this.minimumCost,
      maximumCost: this.maximumCost,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  get hasSubTreatments(): boolean {
    return this.subTreatmentIds.length > 0;
  }

  get isSubTreatment(): boolean {
    return !!this.parentTreatmentId;
  }

  get estimatedTimeDisplay(): string {
    if (!this.estimatedTimeMinutes) return 'Not specified';
    
    if (this.estimatedTimeMinutes < 60) {
      return `${this.estimatedTimeMinutes} min`;
    } else {
      const hours = Math.floor(this.estimatedTimeMinutes / 60);
      const minutes = this.estimatedTimeMinutes % 60;
      if (minutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${minutes} min`;
      }
    }
  }

  get costRange(): string {
    if (!this.minimumCost && !this.maximumCost) return 'Not specified';
    if (!this.maximumCost) return `From $${this.minimumCost}`;
    if (!this.minimumCost) return `Up to $${this.maximumCost}`;
    if (this.minimumCost === this.maximumCost) return `$${this.minimumCost}`;
    return `$${this.minimumCost} - $${this.maximumCost}`;
  }

  get hasCostInfo(): boolean {
    return !!(this.minimumCost || this.maximumCost);
  }

  get hasTimeInfo(): boolean {
    return !!this.estimatedTimeMinutes;
  }
}
