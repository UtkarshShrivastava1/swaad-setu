import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import ModalWrapper from "./ModalWrapper";
import { X } from "lucide-react";

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

  if (!isOpen || !table || !restaurantId) {
    return null;
  }

  const userLink = import.meta.env.VITE_USER_LINK || "http://localhost:5174/";
  const qrCodeValue = `${userLink}t/${restaurantId}/table/${table._id}`;

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
                  justify-content: center;
                  align-items: center;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                }
                svg {
                  width: 80%;
                  height: 80%;
                }
              }
            </style>
          </head>
          <body>
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
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            QR Code for Table {table.tableNumber}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div ref={qrCodeRef} className="p-4 border border-gray-200 rounded-lg">
            <QRCodeSVG value={qrCodeValue} size={256} />
          </div>
          <p className="text-sm text-gray-500 mt-2 break-all">{qrCodeValue}</p>
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
