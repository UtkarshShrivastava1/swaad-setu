import React from "react";

// MenuLayout.jsx
// import Header from "../AdminDashboard/components/Layout/Header";

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
    
      <main>{children}</main>
    </>
  );
}
