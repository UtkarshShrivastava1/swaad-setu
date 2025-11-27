// src/pages/AdminLogin.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loginAsAdmin } from "../api/admin/admin.login";
import { useTenant } from "../context/TenantContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { setRid, setAdmin } = useTenant();

  const rid = ridFromUrl!; // always defined inside /t/:rid/ routes
  const tokenKey = `adminToken_${rid}`;

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const hasSubmittedRef = useRef(false);

  const pin = digits.join("");

  // Focus helper
  const focusInput = (idx: number) => {
    inputsRef.current[idx]?.focus();
    inputsRef.current[idx]?.select();
  };

  // Handle digit change
  const handleDigitChange = (idx: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, "");

    if (!cleaned) {
      setDigits((d) => {
        const copy = [...d];
        copy[idx] = "";
        return copy;
      });
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.split("");
      setDigits((d) => {
        const copy = [...d];
        for (let i = 0; i < chars.length && idx + i < 4; i++) {
          copy[idx + i] = chars[i];
        }
        return copy;
      });

      const nextIdx = Math.min(3, idx + cleaned.length);
      focusInput(nextIdx);
      return;
    }

    setDigits((d) => {
      const copy = [...d];
      copy[idx] = cleaned;
      return copy;
    });

    if (idx < 3) focusInput(idx + 1);
  };

  // Handle keys
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setDigits((d) => {
          const copy = [...d];
          copy[idx] = "";
          return copy;
        });
      } else if (idx > 0) {
        focusInput(idx - 1);
        setDigits((d) => {
          const copy = [...d];
          copy[idx - 1] = "";
          return copy;
        });
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      focusInput(idx - 1);
    } else if (e.key === "ArrowRight" && idx < 3) {
      e.preventDefault();
      focusInput(idx + 1);
    }
  };

  // ↓↓↓ The REAL login logic ↓↓↓
  const doAutoLogin = async (currentPin: string) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    setIsLogging(true);
    setError(null);
    setSuccess(false);

    try {
      await new Promise((r) => setTimeout(r, 120));

      const res = await loginAsAdmin(rid, currentPin);

      // Valid response?
      if (!res || !res.token) throw new Error("Invalid PIN");

      // Save per-tenant token
      localStorage.setItem(tokenKey, res.token);

      // Sync tenant in context
      setRid(rid);
      if (res.admin) {
        setAdmin(res.admin);
      }

      setSuccess(true);

      await new Promise((r) => setTimeout(r, 200));

      // Correct redirect
      navigate(`/t/${rid}/admin-dashboard`, { replace: true });
    } catch (err: any) {
      console.warn("AdminLogin failed:", err);

      setError(err?.message || "Invalid PIN");

      // shake animation
      inputsRef.current.forEach((el) => {
        if (!el) return;
        el.classList.remove("animate-shake");
        el.offsetWidth;
        el.classList.add("animate-shake");
      });

      hasSubmittedRef.current = false;
      setSuccess(false);
    } finally {
      setIsLogging(false);
    }
  };

  // Auto-submit when all digits are entered
  useEffect(() => {
    if (pin.length === 4 && !isLogging && !hasSubmittedRef.current) {
      doAutoLogin(pin);
    }
  }, [pin]);

  // Auto-focus first empty field
  useEffect(() => {
    const idx = digits.findIndex((d) => d === "");
    focusInput(idx === -1 ? 3 : idx);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="bg-gray-800 rounded-2xl shadow-2xl ring-2 ring-gray-700 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 sm:px-8 sm:py-6 relative border-b border-gray-700">
            <button
              onClick={() => navigate(`/t/${rid}`)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              ←
            </button>

            <div className="text-center text-xl font-extrabold text-gray-100">
              Admin Login
            </div>
          </div>

          {/* PIN INPUTS */}
          <div className="px-8 py-8 sm:px-12 sm:py-12">
            <p className="text-center text-gray-400 mb-6">
              Enter your 4-digit Admin PIN
            </p>

            <div className="flex items-center justify-center gap-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="password"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  disabled={isLogging}
                  className={`
                    w-16 h-16 text-3xl text-center rounded-xl
                    bg-gray-700 text-white border
                    ${error ? "border-red-500" : "border-gray-600"}
                  `}
                />
              ))}
            </div>

            {/* Status */}
            <div className="mt-8 text-center h-6">
              {isLogging ? (
                <div className="text-emerald-400">Signing in...</div>
              ) : error ? (
                <div className="text-red-400">{error}</div>
              ) : success ? (
                <div className="text-emerald-400">Success!</div>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-700/60 text-center border-t border-gray-700">
            <div className="text-xs text-gray-400">
              Trouble logging in? Contact your restaurant owner.
            </div>
          </div>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
