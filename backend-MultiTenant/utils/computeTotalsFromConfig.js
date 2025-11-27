/**
 * utils/computeTotalsFromConfig.js
 * --------------------------------
 * Canonical billing logic for Indian restaurant systems.
 *
 * Billing order of operations:
 *   1️⃣ Subtotal = sum of item prices × qty
 *   2️⃣ Discount = applied on subtotal
 *   3️⃣ Service Charge = applied on discounted subtotal
 *   4️⃣ GST (taxes) = applied on (after discount + service charge)
 *   5️⃣ Extras & More Discounts (fixed) = applied after GST
 *
 * Extras (positive) are added to final total.
 * More Discounts (negative) are subtracted from final total.
 */

const Admin = require("../models/admin.model");

/** Safe rounding helper */
function moneyRound(x) {
  return Number((Math.round(Number(x || 0) * 100) / 100).toFixed(2));
}

module.exports = async function computeTotalsFromConfig(
  rid,
  items = [],
  extras = [],
  pricingConfigVersion = null,
  options = {}
) {
  if (!rid) throw new Error("restaurantId (rid) is required");

  /* ---------------------------
     1️⃣ Load Pricing Config
  --------------------------- */
  const admin = await Admin.findOne({ restaurantId: rid }).lean();
  if (!admin) throw new Error(`Admin not found for restaurantId: ${rid}`);

  let config = null;

  if (pricingConfigVersion) {
    config = admin.pricingConfigs?.find(
      (c) => Number(c.version) === Number(pricingConfigVersion)
    );
  }
  if (!config) {
    config = admin.pricingConfigs
      ?.filter((c) => c.active)
      ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }
  if (!config)
    throw new Error(
      `[computeTotalsFromConfig] No pricing config found for restaurant ${rid}`
    );

  /* ---------------------------
     2️⃣ Normalize Inputs
  --------------------------- */
  const normalizedItems = (items || []).map((it) => ({
    quantity: Number(it.quantity ?? it.qty ?? 1),
    priceAtOrder: Number(it.priceAtOrder ?? it.price ?? 0),
  }));

  const lineTotal = normalizedItems.reduce(
    (acc, it) => acc + it.priceAtOrder * it.quantity,
    0
  );

  // Extras can contain both additions and deductions (negative amounts)
  const extrasTotalRaw = (extras || []).reduce(
    (acc, e) => acc + Number(e.amount ?? e.price ?? 0),
    0
  );

  const subtotal = moneyRound(lineTotal);

  /* ---------------------------
     3️⃣ Determine Percentages
  --------------------------- */
  const discountPercent =
    Number(options.discountPercent ?? config.globalDiscountPercent ?? 0) || 0;
  const serviceChargePercent =
    Number(
      options.serviceChargePercent ??
        config.serviceChargePercent ??
        config.serviceCharge ??
        0
    ) || 0;

  const additionalDiscountAmount =
    Number(options.additionalDiscountAmount ?? 0) || 0;

  /* ---------------------------
     4️⃣ Core Calculation
  --------------------------- */
  // Step 1: Discount
  const discountAmount = moneyRound((subtotal * discountPercent) / 100);

  // Step 2: Subtotal after discount
  const afterDiscount = Math.max(
    0,
    subtotal - discountAmount - additionalDiscountAmount
  );

  // Step 3: Service Charge on discounted subtotal
  const serviceChargeAmount = moneyRound(
    (afterDiscount * serviceChargePercent) / 100
  );

  // Step 4: Taxable value before GST
  const taxableValue = moneyRound(afterDiscount + serviceChargeAmount);

  /* ---------------------------
     5️⃣ Apply Taxes
  --------------------------- */
  const taxBreakdown = [];
  let totalTax = 0;

  const taxesFromConfig = Array.isArray(config?.taxes) ? config.taxes : [];
  for (const t of taxesFromConfig) {
    const rate = Number(t.percent ?? t.rate ?? 0) || 0;
    const amount = moneyRound((taxableValue * rate) / 100);
    totalTax += amount;
    taxBreakdown.push({
      name: t.name || "GST",
      rate,
      code:
        t.code ||
        (t.name ? String(t.name).toUpperCase().replace(/\s+/g, "_") : ""),
      amount,
    });
  }

  totalTax = moneyRound(totalTax);

  /* ---------------------------
     6️⃣ Apply Extras & Fixed More Discounts
  --------------------------- */
  // Extras can include both additions (positive) and deductions (negative)
  const extrasPositive = extras.filter((e) => Number(e.amount) > 0);
  const extrasNegative = extras.filter((e) => Number(e.amount) < 0);

  const extrasTotal = moneyRound(
    extrasPositive.reduce((s, e) => s + Number(e.amount), 0)
  );
  const moreDiscountsTotal = moneyRound(
    Math.abs(extrasNegative.reduce((s, e) => s + Number(e.amount), 0))
  );

  /* ---------------------------
     7️⃣ Final Total
  --------------------------- */
  const total = moneyRound(
    taxableValue + totalTax + extrasTotal - moreDiscountsTotal
  );

  /* ---------------------------
     🧾 Debug Log (safe)
  --------------------------- */
  try {
    console.info(
      "[computeTotalsFromConfig] breakdown",
      JSON.stringify(
        {
          rid,
          version: config.version,
          subtotal,
          discountPercent,
          discountAmount,
          afterDiscount,
          serviceChargePercent,
          serviceChargeAmount,
          taxableValue,
          taxBreakdown,
          taxAmount: totalTax,
          extrasTotal,
          moreDiscountsTotal,
          total,
        },
        null,
        2
      )
    );
  } catch (_) {}

  /* ---------------------------
     ✅ Return Object
  --------------------------- */
  return {
    version: config.version,
    subtotal,
    discountPercent,
    discountAmount,
    afterDiscount,
    serviceChargePercent,
    serviceChargeAmount,
    taxableValue,
    taxBreakdown,
    taxAmount: totalTax,
    extrasTotal,
    moreDiscountsTotal,
    total,
  };
};
