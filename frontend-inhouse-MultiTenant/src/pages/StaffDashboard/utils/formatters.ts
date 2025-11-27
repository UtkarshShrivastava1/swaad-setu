export const formatINR = (amount: number | undefined | null): string => {
  const val = Number(amount || 0);
  return val.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
};
