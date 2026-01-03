export function formatCurrency(
  amount: number,
  {
    locale = "es-AR",
    currency = "ARS",
    minimumFractionDigits = 0,
  }: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
  } = {}
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
}
