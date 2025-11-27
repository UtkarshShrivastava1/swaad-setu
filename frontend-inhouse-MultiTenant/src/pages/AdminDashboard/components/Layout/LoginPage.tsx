
// const LonginPage = () => {
//   return (
//      <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-6">
//         {/* Header */}
//         <div className="text-center mb-4">
//           <h3 className="text-2xl font-bold text-yellow-500">🍛 Swad Setu Admin Access.</h3>
//         </div>

//         {/* Subheading */}
//         <div className="text-center mb-6">
//           <h4 className="text-gray-500 font-normal">
//             Enter Admin PIN to continue
//           </h4>
//         </div>

//         {/* Form */}
//         <form id="pinAuthForm" className="flex flex-col items-center">
//           <label
//             htmlFor="adminPin"
//             className="text-gray-700 text-sm mb-2 self-start font-medium"
//           >
//             Admin PIN
//           </label>

//           {/* Input Field */}
//           <input
//             type="password"
//             id="adminPin"
//             placeholder="Enter 4-digit PIN"
//             maxLength={4}
//             required
//             inputMode="numeric"
//             pattern="[0-9]*"
//             className="w-full text-center text-lg tracking-widest border-2 border-yellow-500 bg-yellow-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none rounded-lg py-3 mb-4 text-black"
//           />

//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="w-48 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow"
//           >
//             Access Dashboard
//           </button>

//           {/* Info */}
//           <p className="text-xs text-gray-500 mt-4">Default PIN: 1111</p>
//         </form>
//       </div>
//     </div>
  
//   )
// }

// export default LonginPage

  
import React, { useState } from "react";
// Import your API helper
import { adminLogin } from "../api/admin.login"; // Update this path as required

const LoginPage = ({ rid, onSuccess }) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call your API (userType always "staff" as per your contract)
      await adminLogin(pin, "admin", rid);
      setPin("");
      if (typeof onSuccess === "function") onSuccess();
      // Proceed to dashboard; you can redirect here as needed
    } catch (err) {
      setError(
        err?.message ||
        err?.error ||
        "The PIN you entered is incorrect or there was a network error."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-6 transition-all">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-yellow-500">🍛 Swad Setu Admin Access.</h3>
        </div>
        {/* Subheading */}
        <div className="text-center mb-6">
          <h4 className="text-gray-500 font-normal">
            Enter Admin PIN to continue
          </h4>
        </div>
        {/* Error message */}
        {error && (
          <div className="text-sm bg-red-50 border border-red-200 text-red-600 py-2 px-3 rounded mb-3 text-center">
            {error}
          </div>
        )}
        {/* Form */}
        <form id="pinAuthForm" className="flex flex-col items-center" onSubmit={handleLogin} autoComplete="off">
          <label
            htmlFor="adminPin"
            className="text-gray-700 text-sm mb-2 self-start font-medium"
          >
            Admin PIN
          </label>
          {/* Input Field */}
          <input
            type="password"
            id="adminPin"
            placeholder="Enter 4-digit PIN"
            maxLength={4}
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            className="w-full text-center text-lg tracking-widest border-2 border-yellow-500 bg-yellow-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none rounded-lg py-3 mb-4 text-black"
          />
          {/* Submit Button */}
          <button
            type="submit"
            className="w-48 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow"
            disabled={loading || !pin}
          >
            {loading ? "Checking..." : "Access Dashboard"}
          </button>
          {/* Info */}
          <p className="text-xs text-gray-500 mt-4">Default PIN: 1111</p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
