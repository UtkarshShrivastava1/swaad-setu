import React, { useRef, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import ModalWrapper from "./ModalWrapper";
import { X, Copy, ExternalLink } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: { _id: string; tableNumber: string } | null;
  restaurantId: string | null;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  table,
  restaurantId,
}) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    if (isOpen) {
      const tenantInfo = localStorage.getItem("tenant");
      if (tenantInfo) {
        const parsedTenant = JSON.parse(tenantInfo);
        setRestaurantName(parsedTenant.name || "Restaurant");
      }
    }
  }, [isOpen]);

  if (!isOpen || !table || !restaurantId) {
    return null;
  }

  const userLink = import.meta.env.VITE_USER_LINK || "http://localhost:5174/";
  const qrCodeValue = `${userLink}t/${restaurantId}/table/${table._id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCodeValue);
    // You might want to add a toast notification here to indicate success
  };

  const goToLink = () => {
    window.open(qrCodeValue, "_blank");
  };

  const downloadQRCode = () => {
    const svg = qrCodeRef.current?.querySelector("svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngFile;
        a.download = `table-${table.tableNumber}-qrcode.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  };

  const printQRCode = () => {
    const svg = qrCodeRef.current?.querySelector("svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(`
        <html>
          <head>
            <title>Print QR Code - Table ${table.tableNumber}</title>
            <style>
              @media print {
                body {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100%;
                  margin: 0;
                  padding: 20px;
                  font-family: sans-serif;
                }
                .details {
                  text-align: center;
                  margin-bottom: 20px;
                }
                h1 {
                  font-size: 24px;
                  margin: 0;
                }
                p {
                  font-size: 18px;
                  margin: 5px 0 0;
                }
                svg {
                  width: 80%;
                  height: auto;
                  max-width: 400px;
                }
              }
            </style>
          </head>
          <body>
            <div class="details">
              <h1>${restaurantName}</h1>
              <p>Table: ${table.tableNumber}</p>
            </div>
            ${svgData}
            <script>
              window.onload = () => {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow?.document.close();
    }
  };

  return (
    <ModalWrapper
      title={`QR Code for Table ${table.tableNumber}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            Table {table.tableNumber}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div ref={qrCodeRef} className="p-4 border border-gray-200 rounded-lg bg-white">
            <QRCodeSVG value={qrCodeValue} size={256} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <p className="text-sm text-gray-600 break-all bg-gray-100 px-2 py-1 rounded">
              {qrCodeValue}
            </p>
            <button onClick={copyToClipboard} className="p-2 text-gray-500 hover:text-gray-800">
              <Copy size={18} />
            </button>
            <a href={qrCodeValue} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-gray-800">
              <ExternalLink size={18} />
            </a>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={downloadQRCode}
              className="px-4 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-black font-medium shadow transition"
            >
              Download
            </button>
            <button
              onClick={printQRCode}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium shadow transition"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default QRCodeModal;
