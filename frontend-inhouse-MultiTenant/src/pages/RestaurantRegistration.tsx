// src/pages/RestaurantRegistration.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "../api/client";
import { useTenant } from "../context/TenantContext";

interface RegistrationResponse {
  rid: string;
  adminPin: string;
  staffPin: string;
  loginUrl: string;
  plan: string;
}

export default function RestaurantRegistration() {
  const [form, setForm] = useState({
    restaurantName: "",
    address: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setRid } = useTenant();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        adminPin: "1111", // <-- DEFAULT ADMIN PIN
        staffPin: "2222", // <-- DEFAULT STAFF PIN
      };

      const res = await client.post<RegistrationResponse>(
        "/api/tenants/register",
        payload
      );

      setResult(res.data || res);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed. Try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success screen stays same...
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full shadow-lg space-y-6">
          <h1 className="text-2xl font-bold text-emerald-400">
            🎉 Registration Successful!
          </h1>

          <div className="space-y-3">
            <Field label="Restaurant ID" value={result.rid} />
            <Field label="Admin PIN" value={result.adminPin} />
            <Field label="Staff PIN" value={result.staffPin} />
            <Field label="Subscription Plan" value={result.plan} />
          </div>

          <div className="bg-amber-900/20 border border-amber-600 p-3 rounded">
            <p className="text-amber-200 text-sm">
              ⚠ Save these credentials — you'll need them to login.
            </p>
          </div>

          <button
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-semibold"
            onClick={() => {
              setRid(result.rid);
              navigate(`/t/${result.rid}`);
            }}
          >
            Continue to Restaurant
          </button>
        </div>
      </div>
    );
  }

  // FORM UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl max-w-md w/full shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6">
          Register Your Restaurant
        </h1>

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Restaurant Name"
            value={form.restaurantName}
            required
            onChange={(e) =>
              setForm({ ...form, restaurantName: e.target.value })
            }
          />

          <Input
            label="Address"
            value={form.address}
            required
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            required
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          {error && (
            <div className="bg-red-900/20 border border-red-600 p-3 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/select-restaurant")}
            className="text-emerald-400 text-sm hover:underline"
          >
            Back to Restaurant Selector
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-gray-300 text-sm mb-1 block">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <label className="text-gray-400 text-sm">{label}</label>
      <div className="text-white font-mono text-lg">{value}</div>
    </div>
  );
}
