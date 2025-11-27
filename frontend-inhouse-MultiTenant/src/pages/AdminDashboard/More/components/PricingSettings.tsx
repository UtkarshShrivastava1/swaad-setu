import { useEffect, useState } from "react";
import {
  
  createPricingConfig,
} from "../../../../api/admin/pricing.api";
import { useTenant } from "../../../../context/TenantContext";
import ErrorModal from "../../components/modals/ErrorModal";
import SuccessModal from "../../components/modals/SuccessModal";

interface PricingConfig {
  version: number;
  active: boolean;
  globalDiscountPercent: number;
  serviceChargePercent: number;
  taxes: { name: string; percent: number }[];
  createdAt: string;
}

export default function PricingSettings() {
  const { rid, admin, setAdmin } = useTenant();
  
  const [gstPercent, setGstPercent] = useState(0);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (admin) {
      const configs = admin.pricingConfigs || [];
      

      const activeConfig = configs.find((c: PricingConfig) => c.active);
      if (activeConfig) {
        setGstPercent(
          activeConfig.taxes.find((t) => t.name === "GST")?.percent || 0
        );
        setGlobalDiscountPercent(activeConfig.globalDiscountPercent);
        setServiceChargePercent(activeConfig.serviceChargePercent);
      }
    }
  }, [admin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid) return;

    const payload = {
      taxes: [
        { name: "GST", percent: gstPercent, code: "GST", inclusive: false },
        { name: "Service Tax", percent: 0, code: "SVCTAX", inclusive: false },
      ],
      globalDiscountPercent,
      serviceChargePercent,
      activate: true,
      reason: "Updated from admin dashboard",
      effectiveFrom: new Date().toISOString(),
    };

    try {
      setLoading(true);
      const updatedAdmin = (await createPricingConfig(
        rid,
        payload
      )) as any;
      if (updatedAdmin && updatedAdmin.admin) {
        setAdmin(updatedAdmin.admin);
        setSuccessMessage("New pricing configuration created and activated!");
        setIsSuccessModalOpen(true);
      } else {
        setErrorMessage("Failed to create pricing configuration.");
        setIsErrorModalOpen(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An unknown error occurred.");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-400">
      <SuccessModal
        isOpen={isSuccessModalOpen}
        message={successMessage}
        onClose={() => setIsSuccessModalOpen(false)}
      />
      <ErrorModal
        isOpen={isErrorModalOpen}
        message={errorMessage}
        onClose={() => setIsErrorModalOpen(false)}
      />
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 px-8 py-6">
        <h2 className="text-3xl font-bold text-white">Pricing Settings</h2>
      </div>

      <div className="p-8">
        <form onSubmit={handleSave} className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block mb-2 font-semibold">GST (%)</label>
              <input
                type="number"
                step="0.1"
                className="input input-neutral bg-white w-full rounded border-gray-300 p-2"
                value={gstPercent}
                onChange={(e) => setGstPercent(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">
                Global Discount (%)
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-neutral bg-white w-full rounded border-gray-300 p-2"
                value={globalDiscountPercent}
                onChange={(e) =>
                  setGlobalDiscountPercent(parseFloat(e.target.value))
                }
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">
                Service Charge (%)
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-neutral bg-white w-full rounded border-gray-300 p-2"
                value={serviceChargePercent}
                onChange={(e) =>
                  setServiceChargePercent(parseFloat(e.target.value))
                }
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save as New and Activate"}
          </button>
        </form>
      </div>
    </section>
  );
}
