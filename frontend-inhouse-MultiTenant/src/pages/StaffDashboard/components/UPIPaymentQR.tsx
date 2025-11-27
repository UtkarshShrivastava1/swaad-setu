import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import QRCode from "qrcode.react";
import { useState } from "react";

export default function UPIPaymentQR({
  amount,
  note = "Bill Payment",
}: {
  amount: number;
  note?: string;
}) {
  const [copied, setCopied] = useState(false);

  // 🔧 Fetch static details from env
  const upiId = import.meta.env.VITE_UPI_ID || "example@upi";
  const upiName = import.meta.env.VITE_UPI_NAME || "Restaurant";
  const currency = import.meta.env.VITE_UPI_CURRENCY || "INR";

  // 🧾 Build dynamic UPI URL
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
