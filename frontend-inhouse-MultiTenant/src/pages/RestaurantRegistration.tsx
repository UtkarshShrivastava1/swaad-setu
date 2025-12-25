import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/Select";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "../api/client";
import { useTenant } from "../context/TenantContext";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// Define the expected response shape from the registration API
interface RegistrationResponse {
  rid: string;
  loginUrl: string;
}

// A simple checkmark icon for the success screen
const CheckCircle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// FormField component for consistent styling and animation
const FormField = ({
  id,
  label,
  as: Component = Input,
  children,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="space-y-2"
  >
    <Label
      htmlFor={id}
      className="font-semibold text-gray-700 dark:text-gray-300"
    >
      {label}
    </Label>
    <Component
      id={id}
      {...props}
      className="bg-white dark:bg-white text-black border-gray-300 dark:border-gray-700/50 focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-blue-500/70 transition-shadow duration-300"
    >
      {children}
    </Component>
  </motion.div>
);

export default function RestaurantRegistration() {
  const [form, setForm] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    fssaiNumber: "",
    gstNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
    },
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setRid } = useTenant();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/[^0-9]/g, "");
      if (numericValue.length <= 10) {
        setForm((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    if (name === "fssaiNumber") {
      const numericValue = value.replace(/[^0-9]/g, "");
      if (numericValue.length <= 14) {
        setForm((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    if (name === "gstNumber") {
      const numericValue = value.replace(/[^0-9]/g, "");
      if (numericValue.length <= 15) {
        setForm((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    if (name in form.address) {
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        restaurantName: form.restaurantName,
        ownerName: form.ownerName,
        phone: form.phone,
        email: form.email,
        fssaiNumber: form.fssaiNumber,
        gstNumber: form.gstNumber,
        address: form.address,
        adminPin: "1111", // Default admin PIN
        staffPin: "2222", // Default staff PIN
      };

      const res = await client.post<RegistrationResponse>(
        "/api/tenants/register",
        payload
      );

      setResult(res.data || res);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please check your details and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center"
        >
          <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
          <h1 className="text-4xl font-bold mt-6 text-gray-800 dark:text-gray-100">
            Registration Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your restaurant is ready for setup.
          </p>
          <div className="mt-8 text-center">
            <Label className="text-sm text-gray-500">Your Restaurant ID</Label>
            <p className="text-3xl font-mono bg-gray-100 dark:bg-gray-800 rounded-lg py-3 mt-2 text-gray-800 dark:text-gray-200 tracking-wider">
              {result.rid}
            </p>
          </div>
          <div className="mt-6 text-center text-sm text-amber-600 dark:text-amber-400 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            Please save this ID securely. You will need it to log in.
          </div>
          <Button
            className="w-full mt-8 text-lg py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg"
            onClick={() => {
              setRid(result.rid);
              navigate(`/t/${result.rid}`);
            }}
          >
            Continue to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl bg-white dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
              Register Your Restaurant
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Join Swaad Setu and start managing your restaurant with ease.
            </p>
          </div>
          <form onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Core Details
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Basic information about your restaurant and ownership.
                  </p>
                </div>
                <FormField
                  id="restaurantName"
                  label="Restaurant Name"
                  name="restaurantName"
                  value={form.restaurantName}
                  onChange={handleChange}
                  required
                />
                <FormField
                  id="ownerName"
                  label="Owner Name"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  required
                />
                <FormField
                  id="email"
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <FormField
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  title="Phone number must be 10 digits"
                />
                <FormField
                  id="fssaiNumber"
                  label="FSSAI Number"
                  name="fssaiNumber"
                  type="text"
                  value={form.fssaiNumber}
                  onChange={handleChange}
                  maxLength={14}
                  pattern="\d{14}"
                  title="FSSAI Number must be 14 digits"
                />
                <FormField
                  id="gstNumber"
                  label="GST Number"
                  name="gstNumber"
                  type="text"
                  value={form.gstNumber}
                  onChange={handleChange}
                  maxLength={15}
                  pattern="\d{15}"
                  title="GST Number must be 15 digits"
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Business Address
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Where your business is located.
                  </p>
                </div>
                <FormField
                  id="street"
                  label="Street"
                  name="street"
                  value={form.address.street}
                  onChange={handleChange}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    id="city"
                    label="City"
                    name="city"
                    value={form.address.city}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    as={Select}
                    id="state"
                    label="State / Province"
                    name="state"
                    value={form.address.state}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select a state
                    </option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    id="zip"
                    label="ZIP / Postal Code"
                    name="zip"
                    value={form.address.zip}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    id="country"
                    label="Country"
                    name="country"
                    value={form.address.country}
                    onChange={handleChange}
                    required
                    disabled
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="mt-10 pt-8 border-t dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                onClick={() => navigate("/select-restaurant")}
                className="w-full sm:w-auto text-lg py-3 px-8 rounded-lg bg-gray-700 text-white hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto text-lg py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300"
              >
                {loading ? "Registering..." : "Create Restaurant"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
// --- IGNORE ---
// vim: set ts=2 sw=2 sts=2 et:
