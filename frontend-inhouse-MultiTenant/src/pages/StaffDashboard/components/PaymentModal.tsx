import {
  CheckCircle2,
  Copy,
  ExternalLink,
  IndianRupee,
  Receipt,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  markBillPaid as apiMarkBillPaid,
  resetTable,
} from "../../../api/staff/staff.operations.api";
import { useTenant } from "../../../context/TenantContext";
import { getRestaurantByRid } from "../../../api/restaurant.api";

type PaymentModalProps = {
  bill: any;
  onClose: () => void;
  staffToken?: string;
  onPaid: (updatedBill: any) => void;
  formatINR?: (n?: number | null) => string;
  staffAlias?: string;
};

export default function PaymentModal({
  bill,
  onClose,
  staffToken,
  onPaid,
  formatINR,
  staffAlias,
}: PaymentModalProps) {
  const { rid, tenant, admin, setTenant } = useTenant();
  const [method, setMethod] = useState<string>("CASH");
  const [txId, setTxId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSmall, setIsSmall] = useState<boolean>(false);

  const qrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onResize = () =>
      setIsSmall(window.innerWidth < 420 || window.innerHeight < 600);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const fetchTenantData = async () => {
      if (rid) {
        try {
          const latestTenant = await getRestaurantByRid(rid);
          setTenant(latestTenant);
        } catch (error) {
          console.error("Failed to fetch latest tenant data:", error);
        }
      }
    };
    fetchTenantData();
  }, [rid, setTenant]);

  const safeFormatINR = useMemo(() => {
    if (typeof formatINR === "function") return formatINR;
    return (n?: number | null) =>
      `₹${(n ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }, [formatINR]);

  const totalAmount = bill?.totalAmount ?? 0;
  const subtotal = bill?.subtotal ?? 0;
  const discountAmount = bill?.discountAmount ?? 0;
  const taxAmount = bill?.taxAmount ?? 0;
  const serviceChargeAmount = bill?.serviceChargeAmount ?? 0;

  // UPI config
  const upiSettings = tenant?.upiSettings || admin?.upiSettings;
  const upiId = upiSettings?.UPI_ID || "restaurant@upi";
  const upiName = upiSettings?.UPI_NAME || "Restaurant";
  const upiCurrency = upiSettings?.UPI_CURRENCY || "INR";
  const upiNote = `Bill Payment ${bill?._id?.slice(-5) ?? ""}`;

  const upiUrl = `upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodeURIComponent(
    upiName
  )}&am=${totalAmount}&cu=${upiCurrency}&tn=${encodeURIComponent(upiNote)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copy the UPI link manually: " + upiUrl);
    }
  };

  const handleMethodChange = (value: string) => {
    setMethod(value);
    if (value === "UPI") {
      setTimeout(() => {
        qrRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!rid) {
        throw new Error("Restaurant ID not found");
      }

      // Use the real API function with proper parameters
      const updatedBill = await apiMarkBillPaid(
        rid,
        bill._id,
        staffAlias || "Unknown Staff",
        undefined // paymentNote
      );

      onPaid(updatedBill);
      setSuccessMsg("Payment successful");

      if (rid && bill?.tableId) {
        resetTable(rid, bill.tableId)
          .then(() => {
            console.log(
              `[PaymentModal] Table ${bill.tableId} reset successfully.`
            );
            // Optionally dispatch an event to refresh tables UI if needed
            window.dispatchEvent(new CustomEvent("staff:refreshTables"));
          })
          .catch((err) => {
            console.error(
              `[PaymentModal] Failed to reset table ${bill.tableId}:`,
              err
            );
          });
      }

      setTimeout(() => {
        onClose();
        window.dispatchEvent(new CustomEvent("staff:gotoTablesTab"));
      }, 800);
    } catch (err: any) {
      console.error("Payment failed:", err);
      setErrorMsg(err?.message || "Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full z-30 cursor-pointer active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CONTENT */}
        <div className="max-h-[88vh] overflow-y-auto p-5 sm:p-7">
          {/* HEADER */}
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-amber-400 text-black p-3 rounded-2xl shadow-md">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider">
                Confirm Payment
              </h2>
              <p className="text-gray-400 text-sm">Swaad Setu POS</p>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm mb-6 text-lg font-semibold text-white">
            <div className="flex justify-between pb-1 text-gray-300">
              <span>Subtotal</span>
              <span>{safeFormatINR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between pb-1 text-green-500">
                <span>Discount</span>
                <span>-{safeFormatINR(discountAmount)}</span>
              </div>
            )}

            {serviceChargeAmount > 0 && (
              <div className="flex justify-between pb-1 text-gray-300">
                <span>Service Charge</span>
                <span>{safeFormatINR(serviceChargeAmount)}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between pb-1 text-gray-300">
                <span>Tax</span>
                <span>{safeFormatINR(taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between mt-3 pt-3 border-t-2 border-gray-700 text-2xl font-extrabold text-white">
              <span>Total</span>
              <span className="text-amber-400">
                {safeFormatINR(totalAmount)}
              </span>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="mb-6">
            <label className="block mb-2 font-bold text-gray-300 text-lg uppercase tracking-wide">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="p-4 w-full border-2 border-gray-600 rounded-xl text-lg font-bold bg-gray-800 text-white shadow-sm cursor-pointer transition-all"
            >
              <option value="CASH">₹ Cash</option>
              <option value="CARD">💳 Card</option>
              <option value="UPI">📱 UPI</option>
              <option value="WALLET">🪙 Wallet</option>
            </select>
          </div>

          {/* TX ID */}
          {method !== "UPI" && (
            <div className="mb-6">
              <label className="block mb-2 font-bold text-gray-300 text-lg uppercase tracking-wide">
                Transaction ID
              </label>
              <input
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                className="p-4 w-full border-2 border-gray-600 rounded-xl text-lg font-bold bg-gray-800 text-white shadow-sm transition-all"
                placeholder="Enter Tx ID (optional)"
              />
            </div>
          )}

          {/* UPI QR */}
          {method === "UPI" && (
            <div
              ref={qrRef}
              className="bg-gray-800 p-5 rounded-xl border-2 border-gray-700 shadow-md mb-6 text-center"
            >
              <h3 className="text-xl font-bold mb-3 text-white">Scan to Pay</h3>

              <div className="flex justify-center mb-3">
                <div
                  className={`p-3 bg-white border-2 border-gray-300 rounded-xl transition-all ${
                    isSmall ? "scale-90" : "hover:scale-[1.03]"
                  } cursor-pointer`}
                >
                  <QRCodeCanvas
                    value={upiUrl}
                    size={isSmall ? 140 : 200}
                    includeMargin
                  />
                </div>
              </div>

              <p className="text-lg font-semibold text-gray-300 mb-3">
                Pay{" "}
                <span className="text-amber-400">
                  {safeFormatINR(totalAmount)}
                </span>{" "}
                to {upiName}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleCopy}
                  className="px-4 py-3 bg-gray-700 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-600 cursor-pointer active:scale-95 transition-all"
                  type="button"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-400" />{" "}
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-6 h-6" /> Copy Link
                    </>
                  )}
                </button>

                <a
                  href={upiUrl}
                  target="_blank"
                  className="px-4 py-3 bg-green-600 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 cursor-pointer active:scale-95 transition-all"
                >
                  <ExternalLink className="w-6 h-6" /> Open UPI App
                </a>
              </div>

              <div className="text-sm text-gray-500 mt-3">Payee: {upiId}</div>
            </div>
          )}

          {/* MESSAGES */}
          {errorMsg && (
            <div className="bg-red-700/80 text-white text-lg font-bold p-4 rounded-xl mb-4 uppercase tracking-wide shadow-md">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-700/80 text-white text-lg font-bold p-4 rounded-xl mb-4 uppercase tracking-wide shadow-md">
              {successMsg}
            </div>
          )}
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="sticky bottom-0 bg-gray-900/80 backdrop-blur-sm p-5 flex gap-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xl font-extrabold py-4 rounded-xl shadow-lg cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="flex-1 bg-amber-400 hover:bg-amber-500 text-black text-xl font-extrabold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <IndianRupee className="w-7 h-7" /> Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
