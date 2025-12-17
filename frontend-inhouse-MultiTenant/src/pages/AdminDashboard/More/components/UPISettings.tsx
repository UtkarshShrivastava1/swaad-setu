import { CreditCard, Eye, EyeOff, Loader2, Pencil, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { updateRestaurantConfig } from "../../../../api/admin/config.api";
import { getRestaurantByRid } from "../../../../api/restaurant.api";
import { useTenant } from "../../../../context/TenantContext";

export default function UPISettings() {
  const { rid } = useTenant();
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [initialUpiId, setInitialUpiId] = useState(""); // To store fetched value for reset
  const [initialUpiName, setInitialUpiName] = useState(""); // To store fetched value for reset
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false); // To control edit mode
  const [showUpiId, setShowUpiId] = useState(false); // To toggle visibility of UPI ID
  const [showUpiName, setShowUpiName] = useState(false); // To toggle visibility of UPI Name

  useEffect(() => {
    const fetchConfig = async () => {
      if (!rid) {
        setLoading(false);
        return;
      }
      try {
        const restaurant = await getRestaurantByRid(rid);
        if (restaurant.upiSettings) {
          setUpiId(restaurant.upiSettings.UPI_ID || "");
          setUpiName(restaurant.upiSettings.UPI_NAME || "");
          setInitialUpiId(restaurant.upiSettings.UPI_ID || "");
          setInitialUpiName(restaurant.upiSettings.UPI_NAME || "");
        }
      } catch (err) {
        setError("Failed to fetch UPI settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [rid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid) {
      setError("Restaurant ID not found.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const newConfig = {
      UPISettings: {
        UPI_ID: upiId,
        UPI_NAME: upiName,
      },
    };

    try {
      await updateRestaurantConfig(rid, newConfig);
      setSuccess("UPI settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update UPI settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-yellow-500/30 rounded-2xl shadow-[0_0_35px_rgba(250,204,21,0.15)] p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/15 text-yellow-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-400">
                UPI Payment Settings
              </h2>
              <p className="text-sm text-zinc-400">
                Configure your restaurant’s UPI receiving account
              </p>
            </div>
          </div>
          {!loading && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)] hover:bg-yellow-500 active:scale-[0.97] transition-all"
              aria-label="Edit UPI Settings"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex justify-center py-8 text-yellow-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* UPI ID */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-yellow-400" />
                UPI ID (VPA)
              </label>
              <div className="relative">
                <input
                  type={isEditing || showUpiId ? "text" : "password"}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="example@upi"
                  readOnly={!isEditing}
                  className="
                    w-full h-9 rounded-xl
                    bg-zinc-900 border border-yellow-500/30
                    text-yellow-400 placeholder-zinc-500
                    pl-3 pr-10
                    focus:outline-none focus:border-yellow-400
                    focus:ring-2 focus:ring-yellow-400/30
                    transition-all
                    read-only:opacity-70 read-only:cursor-not-allowed
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowUpiId(!showUpiId)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-yellow-400 transition-colors"
                  aria-label={showUpiId ? "Hide UPI ID" : "Show UPI ID"}
                >
                  {showUpiId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* UPI NAME */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-yellow-400" />
                UPI Registered Name
              </label>
              <div className="relative">
                <input
                  type={isEditing || showUpiName ? "text" : "password"}
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  placeholder="Restaurant or Owner Name"
                  readOnly={!isEditing}
                  className="
                    w-full h-9 rounded-xl
                    bg-zinc-900 border border-yellow-500/30
                    text-yellow-400 placeholder-zinc-500
                    pl-3 pr-10
                    focus:outline-none focus:border-yellow-400
                    focus:ring-2 focus:ring-yellow-400/30
                    transition-all
                    read-only:opacity-70 read-only:cursor-not-allowed
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowUpiName(!showUpiName)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-yellow-400 transition-colors"
                  aria-label={showUpiName ? "Hide UPI Name" : "Show UPI Name"}
                >
                  {showUpiName ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* SAVE BUTTON */}
            {isEditing && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUpiId(initialUpiId);
                    setUpiName(initialUpiName);
                    setIsEditing(false);
                    setShowUpiId(false);
                    setShowUpiName(false);
                  }}
                  className="
                    w-full h-9 rounded-xl
                    border border-zinc-700 text-zinc-400 font-bold
                    hover:bg-zinc-800 transition-colors
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full h-9 rounded-xl
                    bg-gradient-to-r from-yellow-400 to-yellow-500
                    text-black font-bold
                    shadow-[0_0_16px_rgba(250,204,21,0.4)]
                    hover:from-yellow-500 hover:to-yellow-400
                    active:scale-[0.97]
                    disabled:opacity-60
                  "
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save UPI Settings"
                  )}
                </button>
              </div>
            )}
          </form>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-5 bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mt-5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-sm rounded-lg px-3 py-2 text-center">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
