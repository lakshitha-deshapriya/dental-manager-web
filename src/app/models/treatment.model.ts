export class TreatmentModel {
  constructor(
    public id: string,
    public treatment: string,
    public estimateTime: number,
    public timeUnit: string,
    public minCost: number,
    public maxCost: number
  ) {}

  static fromMap(data: any): TreatmentModel {
    return new TreatmentModel(
      data.id,
      data.treatment,
      data.estimateTime,
      data.timeUnit,
      data.minCost,
      data.maxCost
    );
  }

  toMap(): any {
    return {
      id: this.id,
      treatment: this.treatment,
      estimateTime: this.estimateTime,
      timeUnit: this.timeUnit,
      minCost: this.minCost,
      maxCost: this.maxCost
    };
  }
}
