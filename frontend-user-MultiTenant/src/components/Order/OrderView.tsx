import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Download,
  HandPlatter,
  Loader,
  RefreshCw,
  ThumbsUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Order } from "../../api/order.api";
import { getOrderById } from "../../api/order.api";
import { useSocket } from "../../context/SocketContext";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";
import RefreshButton from "../common/RefreshButton";

export default function OrderView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  const { rid, tenant } = useTenant();

  const { tableId } = useTable();
  const sessionId = sessionStorage.getItem("resto_session_id");

  const handlePayment = () => {
    if (!tenant?.UPISettings?.UPI_ID || !order?.totalAmount) {
      alert("UPI payment details are not configured for this restaurant.");
      return;
    }
    const payeeAddress = tenant.UPISettings.UPI_ID;
    const payeeName = tenant.UPISettings.UPI_NAME;
    const amount = order.totalAmount.toFixed(2);
    const transactionNote = `Order #${order._id.slice(-6)}`;
    const upiUrl = `upi://pay?pa=${payeeAddress}&pn=${encodeURIComponent(
      payeeName
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    window.location.href = upiUrl;
  };

  const logoutAndRedirect = useCallback(() => {
    console.log("Order paid. Logging out session...");
    sessionStorage.removeItem("resto_session_id");
    // Clear customer info associated with this table
    if (tableId) { // Ensure tableId is available
      sessionStorage.removeItem(`customerInfo_${tableId}`);
    }
    navigate(`/t/${rid}`);
  }, [rid, navigate, tableId]);

  const fetchOrder = useCallback(async () => {
    if (!orderId || !rid) return;
    try {
      setLoading(true);
      const res = await getOrderById(rid, orderId, sessionId!);
      setOrder(res.order);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch order:", err);
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId, rid, sessionId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const socketService = useSocket();

  useEffect(() => {
    if (!socketService) return;

    const handleOrderUpdate = (updatedOrder: Order) => {
      console.log("Received order_update event:", updatedOrder);
      if (updatedOrder._id === orderId) {
        setOrder(updatedOrder);
      }
    };

    const handleAnnouncement = (data: { message: string }) => {
      alert(`Announcement: ${data.message}`);
    };

    const handleMenuUpdated = () => {
      alert("Menu has been updated. Please check the menu for new items.");
    };

    socketService.on("order_update", handleOrderUpdate);
    socketService.on("announcement", handleAnnouncement);
    socketService.on("menu_updated", handleMenuUpdated);

    return () => {
      socketService.off("order_update", handleOrderUpdate);
      socketService.off("announcement", handleAnnouncement);
      socketService.off("menu_updated", handleMenuUpdated);
    };
  }, [socketService, orderId]);

  // Effect to show Thank You modal when order is paid
  useEffect(() => {
    if (order?.paymentStatus === "paid") {
      setShowThankYou(true);
    }
  }, [order?.paymentStatus]);

  const handleDownloadPdf = async () => {
    const billElement = document.getElementById("bill-to-print");
    if (!billElement) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(billElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Aggressive cleanup to prevent any inherited styles from interfering.
          // This ensures that only the simple, inline styles of the 'bill-to-print' div are rendered.
          clonedDoc
            .querySelectorAll("style, link[rel='stylesheet']")
            .forEach((el) => el.remove());
          clonedDoc.querySelectorAll("svg").forEach((svg) => svg.remove());
          clonedDoc.querySelectorAll("*").forEach((el) => {
            const element = el as HTMLElement;
            element.style.color = "#000";
            element.style.background = "transparent";
            element.style.boxShadow = "none";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Bill-Order-${order?._id.slice(-6)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Sorry, we could not generate the PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen justify-center items-center bg-gray-900 text-gray-400">
        <div className="animate-spin mb-4">
          <RefreshCw size={32} className="text-yellow-500" />
        </div>
        <span className="text-lg">Loading your order...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col h-screen justify-center items-center bg-gray-900 text-gray-400 px-4">
        <h2 className="font-bold text-2xl text-white mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6 text-center">
          {error || "We couldn't find the order you're looking for."}
        </p>
        <button
          onClick={() => navigate(`/t/${rid}/menu`)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold rounded-xl px-8 py-3.5"
        >
          Back to Menu
        </button>
      </div>
    );
  }


  const servicePercent = order.appliedServiceChargePercent ?? 0;
  const discountPercent = order.appliedDiscountPercent ?? 0;

  const statusSteps = [
    { key: "placed", label: "Placed", icon: Clock },
    { key: "accepted", label: "Accepted", icon: ThumbsUp },
    { key: "preparing", label: "Preparing", icon: ChefHat },
    { key: "ready", label: "Ready", icon: HandPlatter },
    { key: "served", label: "Served", icon: CheckCircle2 },
  ];

  const currentStep =
    statusSteps.findIndex((s) => s.key === order.status) >= 0
      ? statusSteps.findIndex((s) => s.key === order.status)
      : 0;

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col pb-28 relative">
      <RefreshButton onRefresh={fetchOrder} positionClassName="top-6 right-4" />

      {/* ===== Main Content ===== */}
      <div className="max-w-2xl w-full mx-auto p-4 space-y-8">
        <div className="relative text-center">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <p className="text-gray-400 text-sm">Order ID</p>
            <p className="text-lg font-bold text-white">
              #{order._id.slice(-6).toUpperCase()}
            </p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Order Status
          </h2>
        </div>

        <div className="flex items-start justify-between gap-2 mt-2">
          {statusSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx <= currentStep;
            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center flex-1 relative"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${isActive ? "bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20" : "bg-gray-800 border-gray-700 text-gray-500"}`}
                >
                  <Icon size={22} />
                </div>
                <span
                  className={`text-xs mt-3 font-semibold ${isActive ? "text-yellow-400" : "text-gray-500"}`}
                >
                  {step.label}
                </span>
                {idx > 0 && (
                  <div
                    className={`absolute top-6 left-[-50%] w-full h-1 ${isActive ? "bg-yellow-500" : "bg-gray-700"}`}
                    style={{ zIndex: -1 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
          <h3 className="font-semibold text-white mb-3 text-lg">Your Items</h3>
          <ul className="divide-y divide-gray-700">
            {order.items.map((item) => (
              <li
                key={item._id}
                className="flex justify-between items-center py-3 text-sm sm:text-base"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-200">{item.name}</span>
                  <span className="text-gray-400 text-xs">
                    Qty: {item.quantity}
                  </span>
                </div>
                <span className="font-semibold text-gray-200">
                  ₹
                  {(
                    (item.priceAtOrder || item.price || 0) * item.quantity
                  ).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate(`/t/${rid}/menu`)}
            className="mt-5 w-full bg-gray-700/70 hover:bg-gray-700 text-yellow-400 font-semibold py-3 px-4 rounded-xl border-2 border-gray-600 hover:border-gray-500 transition-all"
          >
            + Add More Items
          </button>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-5 space-y-2 text-sm sm:text-base border border-gray-700">
          <div className="flex justify-between text-gray-300">
            <span>Subtotal</span>
            <span>₹{order.subtotal?.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount ({discountPercent}%)</span>
              <span>-₹{order.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          {order.appliedTaxes && order.appliedTaxes.length > 0 ? (
            order.appliedTaxes.map((tax, index) => (
              <div key={index} className="flex justify-between text-gray-400">
                <span>
                  {tax.name} ({tax.percent}%)
                </span>
                <span>+ ₹{tax.amount?.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between text-gray-400">
              <span>Tax</span>
              <span>+ ₹{order.taxAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-400">
            <span>Service Charge ({servicePercent}%)</span>
            <span>+ ₹{order.serviceChargeAmount?.toFixed(2)}</span>
          </div>
          <div className="!mt-4 border-t border-dashed border-gray-600"></div>
          <div className="flex justify-between items-center pt-3 font-semibold text-yellow-400 text-lg sm:text-xl">
            <span>Total Payable</span>
            <span>₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {order.paymentStatus !== "paid" && tenant?.UPISettings?.UPI_ID && (
          <div className="mt-4">
            <button
              onClick={handlePayment}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg"
            >
              Pay with UPI
            </button>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-2xl p-5 text-sm border border-gray-700">
          <h3 className="font-semibold text-white mb-3 text-lg">
            Customer Details
          </h3>
          <div className="space-y-1 text-gray-300">
            <p>
              <strong>Name:</strong> {order.customerName}
            </p>
            <p>
              <strong>Email:</strong> {order.customerEmail}
            </p>
            {order.customerContact && (
              <p>
                <strong>Contact:</strong> {order.customerContact}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== Thank You Modal ===== */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-800 text-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-white/10">
            <CheckCircle2 size={48} className="mx-auto text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-gray-400 mb-6">
              Your order is complete and paid for.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader className="animate-spin" />
                ) : (
                  <Download />
                )}
                {isDownloading ? "Downloading..." : "Download Bill"}
              </button>
              <button
                onClick={logoutAndRedirect}
                className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Bill - V2 (Table-based for robust layout) */}
      <div
        id="bill-to-print"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "300px", // Standard thermal printer width
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          color: "#000",
          background: "#fff",
          padding: "16px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
            {tenant?.restaurantName}
          </h2>
          <p style={{ margin: "4px 0 0" }}>Order #{order?._id.slice(-6)}</p>
          <p style={{ margin: "2px 0 0", fontSize: "10px" }}>
            {new Date().toLocaleString()}
          </p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "4px 0",
                  borderBottom: "1px dashed #000",
                }}
              >
                Item
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "4px 0",
                  borderBottom: "1px dashed #000",
                }}
              >
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {order?.items.map((item) => (
              <tr key={item._id}>
                <td style={{ padding: "4px 0" }}>
                  {item.name}
                  <br />
                  <span style={{ fontSize: "10px" }}>
                    ({item.quantity} x ₹
                    {(item.priceAtOrder || item.price || 0).toFixed(2)})
                  </span>
                </td>
                <td
                  style={{
                    textAlign: "right",
                    verticalAlign: "top",
                    padding: "4px 0",
                  }}
                >
                  ₹
                  {(
                    (item.priceAtOrder || (item.price as number)) *
                    item.quantity
                  ).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ padding: "2px 0" }}>Subtotal</td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                ₹{order?.subtotal?.toFixed(2)}
              </td>
            </tr>
            {order?.discountAmount && order.discountAmount > 0 && (
              <tr>
                <td style={{ padding: "2px 0" }}>Discount</td>
                <td style={{ textAlign: "right", padding: "2px 0" }}>
                  -₹{order.discountAmount.toFixed(2)}
                </td>
              </tr>
            )}
            {order?.appliedTaxes && order.appliedTaxes.length > 0 ? (
              order.appliedTaxes.map((tax, index) => (
                <tr key={index}>
                  <td style={{ padding: "2px 0" }}>
                    {tax.name} ({tax.percent}%)
                  </td>
                  <td style={{ textAlign: "right", padding: "2px 0" }}>
                    +₹{tax.amount?.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ padding: "2px 0" }}>Tax</td>
                <td style={{ textAlign: "right", padding: "2px 0" }}>
                  +₹{order?.taxAmount?.toFixed(2)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "2px 0" }}>Service Charge</td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                +₹{order?.serviceChargeAmount?.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        <table style={{ width: "100%" }}>
          <tbody>
            <tr style={{ fontWeight: "bold", fontSize: "14px" }}>
              <td style={{ padding: "4px 0" }}>Total</td>
              <td style={{ textAlign: "right", padding: "4px 0" }}>
                ₹{order?.totalAmount?.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <p
          style={{
            textAlign: "center",
            marginTop: "16px",
            borderTop: "1px dashed #000",
            paddingTop: "8px",
          }}
        >
          Thank you for your order!
        </p>
      </div>
    </div>
  );
}
