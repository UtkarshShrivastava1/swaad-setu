import { Loader2, Pencil, Percent, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  PricingConfigPayload,
  Tax,
} from "../../../../api/admin/pricing.api";
import {
  createPricingConfig,
  getActivePricingConfig,
} from "../../../../api/admin/pricing.api";
import { useTenant } from "../../../../context/TenantContext";

// Helper to ensure we only allow valid number-like strings in the input
const isNumericString = (value: string) => /^\d*\.?\d*$/.test(value);

export default function PricingSettings() {
  const { rid } = useTenant();

  // Use string state for inputs to allow flexible typing (e.g., "12.", "")
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState("0");
  const [serviceChargePercent, setServiceChargePercent] = useState("0");
  const [gstTax, setGstTax] = useState<Tax | null>(null);
  const [otherTaxes, setOtherTaxes] = useState<Tax[]>([]);

  // State to hold initial values for cancellation
  const [initialGlobalDiscountPercent, setInitialGlobalDiscountPercent] =
    useState("0");
  const [initialServiceChargePercent, setInitialServiceChargePercent] =
    useState("0");
  const [initialGstTax, setInitialGstTax] = useState<Tax | null>(null);
  const [initialOtherTaxes, setInitialOtherTaxes] = useState<Tax[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // State to trigger re-fetch
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchPricingConfig = async () => {
      if (!rid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const activeConfig = await getActivePricingConfig(rid);
        console.log("=== DEBUG: Fetched active config via new endpoint ===", activeConfig);

        if (activeConfig) {
          const allTaxes = activeConfig.taxes || [];
          const gst =
            allTaxes.find((t: any) => t.name?.toLowerCase() === "gst") || null;
          const others = allTaxes.filter(
            (t: any) => t.name?.toLowerCase() !== "gst"
          );

          const discount = String(activeConfig.globalDiscountPercent ?? 0);
          const serviceCharge = String(activeConfig.serviceChargePercent ?? 0);

          const normalizedGst = gst
            ? { ...gst, percent: String(gst.percent ?? 0) }
            : null;
          const normalizedOthers = others.map((t: any) => ({ ...t, percent: String(t.percent ?? 0) }));

          setGlobalDiscountPercent(discount);
          setServiceChargePercent(serviceCharge);
          setGstTax(normalizedGst);
          setOtherTaxes(normalizedOthers);

          setInitialGlobalDiscountPercent(discount);
          setInitialServiceChargePercent(serviceCharge);
          setInitialGstTax(normalizedGst);
          setInitialOtherTaxes(normalizedOthers);
        } else {
          console.log("No active config found, using defaults");
          setGlobalDiscountPercent("0");
          setServiceChargePercent("0");
          setGstTax(null);
          setOtherTaxes([]);
          setInitialGlobalDiscountPercent("0");
          setInitialServiceChargePercent("0");
          setInitialGstTax(null);
          setInitialOtherTaxes([]);
        }
      } catch (err) {
        console.error("Error fetching active pricing config:", err);
        setError("Failed to load pricing settings. Check console for details.");
      } finally {
        setLoading(false);
      }
    };
    fetchPricingConfig();
  }, [rid, refetchTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid) {
      setError("Restaurant ID not found.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payloadTaxes = [
      ...(gstTax ? [{ ...gstTax, percent: Number(gstTax.percent) || 0 }] : []),
      ...otherTaxes.map((t) => ({ ...t, percent: Number(t.percent) || 0 })),
    ].filter((t) => t.name && t.code && t.percent > 0);

    const newPayload: PricingConfigPayload = {
      globalDiscountPercent: Number(globalDiscountPercent) || 0,
      serviceChargePercent: Number(serviceChargePercent) || 0,
      taxes: payloadTaxes,
      activate: true,
      reason: "Updated from admin dashboard",
      effectiveFrom: new Date().toISOString(),
    };

    console.log("Submitting payload:", newPayload);

    try {
      await createPricingConfig(rid, newPayload);
      setSuccess("Pricing settings updated successfully!");
      setIsEditing(false);
      setRefetchTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error("Error updating pricing config:", err);
      setError(err.message || "Failed to update pricing settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleGstChange = (field: keyof Tax, value: any) => {
    setGstTax((prev) => {
      const newGst = prev
        ? { ...prev }
        : { name: "GST", code: "GST", percent: "0", inclusive: false };
      if (field === "percent") {
        if (isNumericString(value)) {
          // @ts-ignore
          newGst[field] = value;
        }
      } else {
        // @ts-ignore
        newGst[field] = value;
      }
      return newGst;
    });
  };

  const handleTaxChange = (index: number, field: keyof Tax, value: any) => {
    const newTaxes = [...otherTaxes];
    if (field === "percent") {
      if (isNumericString(value)) {
        newTaxes[index] = { ...newTaxes[index], [field]: value };
      }
    } else {
      newTaxes[index] = { ...newTaxes[index], [field]: value };
    }
    setOtherTaxes(newTaxes);
  };

  const addTax = () => {
    setOtherTaxes([
      ...otherTaxes,
      { name: "", percent: "0", code: "", inclusive: false },
    ]);
  };

  const removeTax = (index: number) => {
    const newTaxes = otherTaxes.filter((_, i) => i !== index);
    setOtherTaxes(newTaxes);
  };

  const handleCancel = () => {
    setGlobalDiscountPercent(initialGlobalDiscountPercent);
    setServiceChargePercent(initialServiceChargePercent);
    setGstTax(initialGstTax);
    setOtherTaxes(initialOtherTaxes);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-yellow-500/30 rounded-2xl shadow-[0_0_35px_rgba(250,204,21,0.15)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/15 text-yellow-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-400">
                Pricing Settings
              </h2>
              <p className="text-sm text-zinc-400">
                Configure discounts, charges, and taxes
              </p>
            </div>
          </div>
          {!loading && !isEditing && (
            <button
              onClick={() => {
                if (!gstTax) {
                  setGstTax({
                    name: "GST",
                    code: "GST",
                    percent: "0",
                    inclusive: false,
                  });
                }
                setIsEditing(true);
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)] hover:bg-yellow-500 active:scale-[0.97] transition-all"
              aria-label="Edit Pricing Settings"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading && !isEditing ? (
          <div className="flex justify-center py-8 text-yellow-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Percent className="w-3 h-3 text-yellow-400" /> Global Discount
                (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={globalDiscountPercent}
                onChange={(e) =>
                  isNumericString(e.target.value) &&
                  setGlobalDiscountPercent(e.target.value)
                }
                placeholder="0"
                readOnly={!isEditing}
                className="w-full h-9 rounded-xl bg-zinc-900 border border-yellow-500/30 text-yellow-400 placeholder-zinc-500 pl-3 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all read-only:opacity-70 read-only:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Percent className="w-3 h-3 text-yellow-400" /> Service Charge
                (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={serviceChargePercent}
                onChange={(e) =>
                  isNumericString(e.target.value) &&
                  setServiceChargePercent(e.target.value)
                }
                placeholder="0"
                readOnly={!isEditing}
                className="w-full h-9 rounded-xl bg-zinc-900 border border-yellow-500/30 text-yellow-400 placeholder-zinc-500 pl-3 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all read-only:opacity-70 read-only:cursor-not-allowed"
              />
            </div>

            {isEditing ? (
              <div className="space-y-2 p-3 border border-yellow-600 rounded-lg bg-yellow-900/20">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                  GST Configuration
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-yellow-400">Name</label>
                    <input
                      type="text"
                      value={gstTax?.name || "GST"}
                      disabled
                      className="w-full h-8 rounded-md bg-zinc-800 border border-yellow-500/30 text-yellow-300 px-2 text-sm opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-yellow-400">
                      Percent (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={gstTax?.percent || ""}
                      onChange={(e) =>
                        handleGstChange("percent", e.target.value)
                      }
                      className="w-full h-8 rounded-md bg-zinc-900 border border-yellow-500/30 text-yellow-400 px-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      checked={gstTax?.inclusive || false}
                      onChange={(e) =>
                        handleGstChange("inclusive", e.target.checked)
                      }
                      id="inclusive-gst"
                      className="h-4 w-4 text-yellow-400 bg-zinc-800 border-zinc-600 rounded focus:ring-yellow-500"
                    />
                    <label
                      htmlFor="inclusive-gst"
                      className="ml-2 text-sm text-zinc-400"
                    >
                      Inclusive
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              gstTax &&
              Number(gstTax.percent) > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-300">
                    GST
                  </label>
                  <div className="flex items-center justify-between bg-zinc-800 p-2 rounded-lg">
                    <p className="text-sm text-zinc-300">
                      {gstTax.name}
                    </p>
                    <p className="text-sm text-zinc-300">
                      {gstTax.percent}%{" "}
                      {gstTax.inclusive ? "(Inclusive)" : "(Exclusive)"}
                    </p>
                  </div>
                </div>
              )
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-200 pt-2 border-t border-zinc-800">
                Other Taxes
              </h3>
              {!isEditing ? (
                <div className="space-y-2">
                  {otherTaxes.length > 0 ? (
                    otherTaxes.map((tax, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-zinc-800 p-2 rounded-lg"
                      >
                        <p className="text-sm text-zinc-300">
                          {tax.name} ({tax.code})
                        </p>
                        <p className="text-sm text-zinc-300">
                          {tax.percent}%{" "}
                          {tax.inclusive ? "(Inclusive)" : "(Exclusive)"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-400">
                      No other taxes configured.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {otherTaxes.map((tax, index) => (
                    <div
                      key={index}
                      className="space-y-2 p-3 border border-zinc-700 rounded-lg bg-zinc-900/50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-zinc-400">
                          Tax #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTax(index)}
                          className="text-red-400 hover:text-red-500 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-zinc-400">Name</label>
                          <input
                            type="text"
                            value={tax.name}
                            onChange={(e) =>
                              handleTaxChange(index, "name", e.target.value)
                            }
                            className="w-full h-8 rounded-md bg-zinc-900 border border-yellow-500/30 text-yellow-400 px-2 text-sm"
                            placeholder="e.g., Service Tax"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400">Code</label>
                          <input
                            type="text"
                            value={tax.code}
                            onChange={(e) =>
                              handleTaxChange(index, "code", e.target.value)
                            }
                            className="w-full h-8 rounded-md bg-zinc-900 border border-yellow-500/30 text-yellow-400 px-2 text-sm"
                            placeholder="e.g., SRVC_TAX"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400">
                            Percent (%)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tax.percent}
                            onChange={(e) =>
                              handleTaxChange(index, "percent", e.target.value)
                            }
                            className="w-full h-8 rounded-md bg-zinc-900 border border-yellow-500/30 text-yellow-400 px-2 text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex items-center mt-4">
                          <input
                            type="checkbox"
                            checked={tax.inclusive}
                            onChange={(e) =>
                              handleTaxChange(
                                index,
                                "inclusive",
                                e.target.checked
                              )
                            }
                            id={`inclusive-${index}`}
                            className="h-4 w-4 text-yellow-400 bg-zinc-800 border-zinc-600 rounded focus:ring-yellow-500"
                          />
                          <label
                            htmlFor={`inclusive-${index}`}
                            className="ml-2 text-sm text-zinc-400"
                          >
                            Inclusive
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTax}
                    className="w-full h-9 rounded-xl border border-dashed border-yellow-500/50 text-yellow-400 font-bold hover:bg-yellow-500/10 transition-colors"
                  >
                    + Add Other Tax
                  </button>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full h-9 rounded-xl border border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold shadow-[0_0_16px_rgba(250,204,21,0.4)] hover:from-yellow-500 hover:to-yellow-400 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Pricing Settings"
                  )}
                </button>
              </div>
            )}
          </form>
        )}

        {error && (
          <div className="mt-5 bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-sm rounded-lg px-3 py-2 text-center">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
