export interface EconomicConfigDTO {
  id: string;
  slug: string;
  currencyCode: string;
  defaultMonthlyAmount: number;
  defaultMonthsToGenerate: number;
  dueDay: number;
  lateFeePercentage: number;
  createdAt: string;
  updatedAt: string;
}
