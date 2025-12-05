import { Loader2, Pencil, Percent, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createPricingConfig,
} from "../../../../api/admin/pricing.api";
import type {
  PricingConfigPayload,
  Tax,
} from "../../../../api/admin/pricing.api";
import { useTenant } from "../../../../context/TenantContext";

export default function PricingSettings() {
  const { rid, admin } = useTenant();

  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [taxes, setTaxes] = useState<Tax[]>([]); // New state for taxes
  const [initialGlobalDiscountPercent, setInitialGlobalDiscountPercent] =
    useState(0);
  const [initialServiceChargePercent, setInitialServiceChargePercent] =
    useState(0);
  const [initialTaxes, setInitialTaxes] = useState<Tax[]>([]); // New state for initial taxes

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchPricingConfig = () => {
      if (!rid || !admin) {
        setLoading(false);
        return;
      }
      try {
        const activeConfig = admin.pricingConfigs?.find(
          (config) => config.active
        );
        if (activeConfig) {
          setGlobalDiscountPercent(activeConfig.globalDiscountPercent);
          setServiceChargePercent(activeConfig.serviceChargePercent);
          setTaxes(activeConfig.taxes || []); // Populate taxes state
          setInitialGlobalDiscountPercent(activeConfig.globalDiscountPercent);
          setInitialServiceChargePercent(activeConfig.serviceChargePercent);
          setInitialTaxes(activeConfig.taxes || []); // Populate initialTaxes state
        } else {
          // Initialize with default values if no active config
          setGlobalDiscountPercent(0);
          setServiceChargePercent(0);
          setTaxes([]);
          setInitialGlobalDiscountPercent(0);
          setInitialServiceChargePercent(0);
          setInitialTaxes([]);
        }
      } catch (err) {
        setError("Failed to load pricing settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchPricingConfig();
  }, [rid, admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid) {
      setError("Restaurant ID not found.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const newPayload: PricingConfigPayload = {
      globalDiscountPercent: globalDiscountPercent,
      serviceChargePercent: serviceChargePercent,
      taxes: taxes, // Now including taxes
      activate: true, // Activate immediately
      reason: "Updated from admin dashboard",
      effectiveFrom: new Date().toISOString(),
    };

    try {
      await createPricingConfig(rid, newPayload);
      setSuccess(
        "Pricing settings updated successfully (new version created)!"
      );
      setIsEditing(false); // Exit editing mode after successful save
    } catch (err: any) {
      setError(err.message || "Failed to update pricing settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleTaxChange = (index: number, field: keyof Tax, value: any) => {
    const newTaxes = [...taxes];
    newTaxes[index] = { ...newTaxes[index], [field]: value };
    setTaxes(newTaxes);
  };

  const addTax = () => {
    setTaxes([...taxes, { name: "", percent: 0, code: "", inclusive: false }]);
  };

  const removeTax = (index: number) => {
    const newTaxes = taxes.filter((_, i) => i !== index);
    setTaxes(newTaxes);
  };

  const handleCancel = () => {
    setGlobalDiscountPercent(initialGlobalDiscountPercent);
    setServiceChargePercent(initialServiceChargePercent);
    setTaxes(initialTaxes);
    setIsEditing(false);
  };

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-yellow-500/30 rounded-2xl shadow-[0_0_35px_rgba(250,204,21,0.15)] p-6">
        {/* HEADER */}
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
                Configure global discounts and service charges
              </p>
            </div>
          </div>
          {!loading && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full text-yellow-400 hover:bg-yellow-500/10 transition-colors"
              aria-label="Edit Pricing Settings"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex justify-center py-8 text-yellow-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GLOBAL DISCOUNT PERCENT */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Percent className="w-3 h-3 text-yellow-400" />
                Global Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={globalDiscountPercent}
                  onChange={(e) =>
                    setGlobalDiscountPercent(Number(e.target.value))
                  }
                  placeholder="0"
                  min="0"
                  max="100"
                  className="
                    w-full h-9 rounded-xl
                    bg-zinc-900 border border-yellow-500/30
                    text-yellow-400 placeholder-zinc-500
                    pl-3 pr-10
                    focus:outline-none focus:border-yellow-400
                    focus:ring-2 focus:ring-yellow-400/30
                    transition-all
                    read-only:opacity-70 read-only:cursor-not-allowed
                  "
                />
              </div>
            </div>

            {/* SERVICE CHARGE PERCENT */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Percent className="w-3 h-3 text-yellow-400" />
                Service Charge (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={serviceChargePercent}
                  onChange={(e) =>
                    setServiceChargePercent(Number(e.target.value))
                  }
                  placeholder="0"
                  min="0"
                  max="100"
                  className="
                    w-full h-9 rounded-xl
                    bg-zinc-900 border border-yellow-500/30
                    text-yellow-400 placeholder-zinc-500
                    pl-3 pr-10
                    focus:outline-none focus:border-yellow-400
                    focus:ring-2 focus:ring-yellow-400/30
                    transition-all
                    read-only:opacity-70 read-only:cursor-not-allowed
                  "
                />
              </div>
            </div>

            {/* TAX CONFIGURATIONS */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-200">
                Tax Configurations
              </h3>
              {!isEditing ? (
                // Read-only display of taxes
                <div className="space-y-2">
                  {taxes.length > 0 ? (
                    taxes.map((tax, index) => (
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
                      No taxes configured.
                    </p>
                  )}
                </div>
              ) : (
                // Editable tax display
                <div className="space-y-4">
                  {taxes.map((tax, index) => (
                    <div
                      key={index}
                      className="space-y-2 p-3 border border-zinc-700 rounded-lg"
                    >
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeTax(index)}
                          className="text-red-400 hover:text-red-500 text-sm"
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
                            className="w-full h-8 rounded-md bg-zinc-900 border border-yellow-500/30 text-yellow-400 px-2 text-sm focus:outline-none"
                            placeholder="e.g., GST"
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
                            className="w-full h-8 rounded-md bg-zinc-900 border border-yellow-500/30 text-yellow-400 px-2 text-sm focus:outline-none"
                            placeholder="e.g., GST_TAX"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400">
                            Percent (%)
                          </label>
                          <input
                            type="number"
                            value={tax.percent}
                            onChange={(e) =>
                              handleTaxChange(
                                index,
                                "percent",
                                Number(e.target.value)
                              )
                            }
                            className="w-full h-8 rounded-md bg-zinc-900 border border-yellow-500/30 text-yellow-400 px-2 text-sm focus:outline-none"
                            min="0"
                            max="100"
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
                            className="h-4 w-4 text-yellow-400 border-zinc-700 rounded focus:ring-yellow-500"
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
                    className="w-full h-9 rounded-xl border border-yellow-500/50 text-yellow-400 font-bold hover:bg-yellow-500/10 transition-colors"
                  >
                    Add Tax
                  </button>
                </div>
              )}
            </div>

            {/* SAVE BUTTONS */}
            {isEditing && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="
                    w-full h-9 rounded-xl
                    border border-zinc-700 text-zinc-400 font-bold
                    hover:bg-zinc-800 transition-colors
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full h-9 rounded-xl
                    bg-gradient-to-r from-yellow-400 to-yellow-500
                    text-black font-bold
                    shadow-[0_0_16px_rgba(250,204,21,0.4)]
                    hover:from-yellow-500 hover:to-yellow-400
                    active:scale-[0.97]
                    disabled:opacity-60
                  "
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

        {/* ERROR */}
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
