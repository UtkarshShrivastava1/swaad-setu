import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RootPage() {
  const [rid, setRid] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rid.trim()) {
      navigate(`/t/${rid.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-yellow-400/20">
          <div className="flex flex-col items-center mb-6">
            <img
              src="/logo.png"
              alt="Swaad Setu"
              className="h-24 w-auto mb-4"
            />

            <p className="text-lg text-gray-300 mt-2 italic">
              Your bridge to delicious food
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="rid"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Restaurant ID
              </label>
              <input
                id="rid"
                type="text"
                value={rid}
                onChange={(e) => setRid(e.target.value)}
                placeholder="Enter restaurant ID"
                className="w-full px-4 py-3 bg-black/50 text-white rounded-lg border border-yellow-400/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/80 placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-yellow-400 text-black font-bold text-lg shadow-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105"
            >
              Find Restaurant
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-white/70 mt-8">
          Enter the ID of the restaurant to view its menu and place an order.
        </p>
      </div>
    </div>
  );
}
