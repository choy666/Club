export type ReportGranularity = "weekly" | "monthly";

export type ReportFiltersInput = {
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  planId?: string | null;
  currency?: string | null;
};

export type ReportTrendMeta = {
  delta: number;
  direction: "up" | "down";
  comparisonLabel: string;
};

export type ReportBreakdownItem = {
  label: string;
  value: number;
  percentage?: number;
};

export type ReportBlock = {
  kpiId: string;
  label: string;
  value: number;
  unit?: string;
  description?: string;
  trend?: ReportTrendMeta;
  breakdown?: ReportBreakdownItem[];
};

export type ReportResponse = {
  filters: ReportFiltersInput;
  generatedAt: string;
  data: ReportBlock[];
};

export type ReportApiResponse = {
  data: ReportResponse;
};
