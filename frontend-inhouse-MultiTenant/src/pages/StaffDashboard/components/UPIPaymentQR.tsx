import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import QRCode from "qrcode.react";
import { useEffect, useState } from "react";
import { useTenant } from "../../../context/TenantContext";
import { getRestaurantByRid } from "../../../api/restaurant.api";

export default function UPIPaymentQR({
  amount,
  note = "Bill Payment",
}: {
  amount: number;
  note?: string;
}) {
  const { rid } = useTenant();
  const [copied, setCopied] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpiDetails = async () => {
      if (!rid) {
        setError("Restaurant context not found.");
        setLoading(false);
        return;
      }
      try {
        const restaurant = await getRestaurantByRid(rid);
        if (restaurant.UPISettings && restaurant.UPISettings.UPI_ID) {
          setUpiId(restaurant.UPISettings.UPI_ID);
          setUpiName(restaurant.UPISettings.UPI_NAME || "Restaurant");
          setCurrency(restaurant.UPISettings.UPI_CURRENCY || "INR");
        } else {
          setError("UPI details not configured for this restaurant.");
        }
      } catch (err) {
        setError("Failed to load UPI information.");
      } finally {
        setLoading(false);
      }
    };

    fetchUpiDetails();
  }, [rid]);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodeURIComponent(
    upiName
  )}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      alert("Failed to copy UPI link");
    }
  };

  if (loading) {
    return <p className="text-center text-slate-500">Loading QR Code...</p>;
  }

  if (error || !upiId) {
    return (
      <p className="text-center text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
        {error || "UPI payments are not set up for this restaurant."}
      </p>
    );
  }

  return (
    <div className="mt-4 p-4 border rounded-lg bg-slate-50 text-center">
      <div className="flex justify-center mb-3">
        <QRCode value={upiUrl} size={180} includeMargin />
      </div>

      <p className="text-sm text-slate-600">
        Scan this QR to pay <strong>₹{amount.toFixed(2)}</strong> to{" "}
        <strong>{upiName}</strong>
      </p>

      <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1 text-xs bg-slate-200 px-3 py-1.5 rounded hover:bg-slate-300"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy UPI Link
            </>
          )}
        </button>

        <a
          href={upiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in UPI App
        </a>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Payee: {upiId} ({currency})
      </div>
    </div>
  );
}
