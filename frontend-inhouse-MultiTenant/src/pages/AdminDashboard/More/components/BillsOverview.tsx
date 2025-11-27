
import { useState } from "react";

export default function BillsOverview() {
  const [billsSummary] = useState({
    activeBills: 3,
    paidToday: 12,
    revenueToday: 28540,
    avgBillValue: 359,
  });

  return (
    <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
      {[
        { label: "Active Bills", value: billsSummary.activeBills },
        { label: "Paid Today", value: billsSummary.paidToday },
        {
          label: "Revenue Today",
          value: `₹ ${billsSummary.revenueToday.toLocaleString()}`,
        },
        { label: "Avg Bill Value", value: `₹ ${billsSummary.avgBillValue}` },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white  rounded-xl shadow p-6 text-center"
        >
          <div className="text-3xl font-extrabold mb-2">{kpi.value}</div>
          <div className="text-gray-600 font-semibold">{kpi.label}</div>
        </div>
      ))}
    </section>
  );
}
