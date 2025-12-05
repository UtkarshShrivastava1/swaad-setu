import { Loader2, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { updateAdminPin } from "../../../../../api/admin/pin.api";
import { useTenant } from "../../../../../context/TenantContext";

export default function AdminPinSettings() {
  const { rid } = useTenant();

  const [currentPin, setCurrentPin] = useState(["", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", ""]);

  const currentRefs = useRef<HTMLInputElement[]>([]);
  const newRefs = useRef<HTMLInputElement[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ===== PIN INPUT HANDLING =====
  const handlePinInput = (
    e: React.FormEvent<HTMLInputElement>,
    index: number,
    pin: string[],
    setPin: Function,
    refs: React.MutableRefObject<HTMLInputElement[]>
  ) => {
    const value = e.currentTarget.value.replace(/\D/g, "").slice(-1);

    const newArr = [...pin];
    newArr[index] = value;
    setPin(newArr);

    if (value && index < 3) {
      requestAnimationFrame(() => {
        refs.current[index + 1]?.focus();
      });
    }
  };

  const handleBackspace = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    pin: string[],
    setPin: Function,
    refs: React.MutableRefObject<HTMLInputElement[]>
  ) => {
    if (e.key === "Backspace") {
      if (pin[index]) {
        const newArr = [...pin];
        newArr[index] = "";
        setPin(newArr);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    setPin: Function,
    refs: React.MutableRefObject<HTMLInputElement[]>
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (pasted.length === 4) {
      const arr = pasted.split("");
      setPin(arr);
      requestAnimationFrame(() => refs.current[3]?.focus());
    }
  };

  const getPinValue = (pin: string[]) => pin.join("");

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    const current = getPinValue(currentPin);
    const next = getPinValue(newPin);

    if (!rid) return setError("Restaurant ID not found.");
    if (current.length !== 4 || next.length !== 4)
      return setError("Enter all 4 digits.");

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateAdminPin(rid, current, next);
      setSuccess("Admin PIN updated successfully!");
      setCurrentPin(["", "", "", ""]);
      setNewPin(["", "", "", ""]);
      currentRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to update PIN.");
    } finally {
      setLoading(false);
    }
  };

  // ===== PIN BOX UI =====
  const PinBox = ({
    pin,
    setPin,
    refs,
    label,
  }: {
    pin: string[];
    setPin: Function;
    refs: React.MutableRefObject<HTMLInputElement[]>;
    label: string;
  }) => (
    <div className="space-y-2">
      <p className="text-sm text-zinc-300 font-medium">{label}</p>

      <div className="flex gap-3">
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el!)}
            value={digit}
            onInput={(e) => handlePinInput(e, i, pin, setPin, refs)}
            onKeyDown={(e) => handleBackspace(e, i, pin, setPin, refs)}
            onPaste={(e) => handlePaste(e, setPin, refs)}
            type="password"
            maxLength={1}
            inputMode="numeric"
            className="
              w-10 h-10
              rounded-xl
              bg-zinc-900
              border-2 border-yellow-500/40
              text-yellow-400
              text-lg font-bold
              text-center
              focus:outline-none
              focus:border-yellow-400
              focus:ring-2 focus:ring-yellow-400/30
              transition-all
            "
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-yellow-500/30 shadow-[0_0_35px_rgba(250,204,21,0.15)] p-8">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-yellow-500/15 text-yellow-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-yellow-400">
              Admin Security
            </h2>
            <p className="text-sm text-zinc-400">
              Enter your 4-digit secure PIN
            </p>
          </div>
        </div>

        <PinBox
          pin={currentPin}
          setPin={setCurrentPin}
          refs={currentRefs}
          label="Current PIN"
        />

        <div className="mt-4">
          <PinBox
            pin={newPin}
            setPin={setNewPin}
            refs={newRefs}
            label="New PIN"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="
            mt-4 w-full h-9 rounded-xl
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
              Updating...
            </span>
          ) : (
            "Update PIN"
          )}
        </button>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-2 py-1 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-sm rounded-lg px-2 py-1 text-center">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
