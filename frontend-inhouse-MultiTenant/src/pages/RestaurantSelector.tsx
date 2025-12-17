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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="bg-gray-900 p-8 rounded-2xl max-w-md w-full shadow-2xl border border-yellow-500/30">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center tracking-wider">
          Select Your Restaurant
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="rid" className="text-yellow-400/80 text-sm font-medium mb-2 block">Restaurant ID</label>
            <input
              id="rid"
              type="text"
              placeholder="e.g., dominos-sector14"
              value={ridInput}
              onChange={(e) => setRidInput(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 border border-gray-700 focus:border-transparent transition-all duration-300"
            />
          </div>

          {error && <div className="text-red-500 text-sm px-1 font-medium">{error}</div>}

          <button
            type="submit"
            className="w-full bg-yellow-500 text-gray-900 py-3 rounded-lg hover:bg-yellow-600 transition-all duration-300 font-bold text-lg tracking-wide transform hover:scale-105"
          >
            Continue
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/register-restaurant"
            className="text-yellow-400 text-sm hover:underline transition-colors duration-300"
          >
            Don't have a restaurant ID? Register here.
          </a>
        </div>
      </div>
    </div>
  );
}
