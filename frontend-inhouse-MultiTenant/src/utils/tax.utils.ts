interface TaxEntry {
  name?: string;
  rate?: number;
  amount?: number;
}

export function getGSTEntry(taxes: TaxEntry[] = []): TaxEntry | null {
  return taxes.find((tax) => tax?.name?.toLowerCase().includes("gst")) ?? null;
}

export function getTaxes(bill: any) {
  if (!bill?.taxes) return [];
  return (bill.taxes || []).filter(
    (tax: any) => tax?.name && typeof tax?.rate === "number"
  );
}

export function getTaxTotal(bill: any) {
  // Use server's taxAmount if available
  if (typeof bill?.taxAmount === "number") {
    return bill.taxAmount;
  }
  // Fall back to summing individual tax amounts
  return (bill?.taxes || []).reduce(
    (sum: number, tax: any) => sum + (Number(tax.amount) || 0),
    0
  );
}

export const getGSTRate = (
  taxes: Array<{ name?: string; rate?: number }> = []
): number => {
  const gstTax = taxes.find((tax) => tax.name?.toLowerCase().includes("gst"));
  return Number(gstTax?.rate) || 18; // Fallback to 18% if not found
};

export const filterServiceTax = (
  taxes: Array<{ name?: string; rate?: number }> = []
) => {
  return taxes.filter((tax) => !tax.name?.toLowerCase().includes("service"));
};
