// src/pages/RestaurantSelector.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";
import { isValidRid } from "../utils/tenant.utils";

export default function RestaurantSelector() {
  const [ridInput, setRidInput] = useState("");
  const [error, setError] = useState("");
  const { setRid } = useTenant();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanRid = ridInput.trim().toLowerCase();

    if (!isValidRid(cleanRid)) {
      setError("Invalid restaurant ID.");
      return;
    }

    // Optional — check if restaurant exists using health endpoint
    try {
      const res = await fetch(`/api/${cleanRid}/health`);
      if (!res.ok) {
        setError("Restaurant not found.");
        return;
      }
    } catch {
      setError("Network error. Try again.");
      return;
    }

    // Save tenant globally
    setRid(cleanRid);

    // Redirect to tenant homepage
    navigate(`/t/${cleanRid}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6">
          Select Your Restaurant
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter restaurant ID (e.g., dominos-sector14)"
            value={ridInput}
            onChange={(e) => setRidInput(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {error && <div className="text-red-400 text-sm px-1">{error}</div>}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-semibold"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/register-restaurant"
            className="text-emerald-400 text-sm hover:underline"
          >
            Register New Restaurant
          </a>
        </div>
      </div>
    </div>
  );
}
