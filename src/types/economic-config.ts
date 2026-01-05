export interface EconomicConfigDTO {
  id: string;
  slug: string;
  currencyCode: string;
  defaultMonthlyAmount: number;
  dueDay: number;
  lateFeePercentage: number;
  createdAt: string;
  updatedAt: string;
}
