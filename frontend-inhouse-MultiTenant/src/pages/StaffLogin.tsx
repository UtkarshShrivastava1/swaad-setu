// src/pages/StaffLogin.tsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loginAsStaff } from "../api/staff/staff.login";
import { useTenant } from "../context/TenantContext";

export default function StaffLogin() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { setRid } = useTenant();

  // Tenant RID ALWAYS comes from URL here (path: /t/:rid/staff-login)
  const rid = ridFromUrl!;
  const tokenKey = `staffToken_${rid}`;

  // PIN State
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const hasSubmittedRef = useRef(false);

  const pin = digits.join("");

  const focusInput = (i: number) => {
    inputsRef.current[i]?.focus();
    inputsRef.current[i]?.select();
  };

  const handleDigitChange = (idx: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, "");

    if (!cleaned) {
      setDigits((d) => {
        const c = [...d];
        c[idx] = "";
        return c;
      });
      return;
    }

    // Handle paste
    if (cleaned.length > 1) {
      const chars = cleaned.split("");
      setDigits((d) => {
        const c = [...d];
        for (let i = 0; i < chars.length && idx + i < 4; i++) {
          c[idx + i] = chars[i];
        }
        return c;
      });
      const next = Math.min(3, idx + cleaned.length);
      focusInput(next);
      return;
    }

    // Single digit
    setDigits((d) => {
      const c = [...d];
      c[idx] = cleaned;
      return c;
    });

    if (idx < 3) focusInput(idx + 1);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setDigits((d) => {
          const c = [...d];
          c[idx] = "";
          return c;
        });
      } else if (idx > 0) {
        focusInput(idx - 1);
        setDigits((d) => {
          const c = [...d];
          c[idx - 1] = "";
          return c;
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

  const doAutoLogin = async (currentPin: string) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    setIsLogging(true);
    setError(null);
    setSuccess(false);

    try {
      await new Promise((r) => setTimeout(r, 120));

      const res: any = await loginAsStaff(currentPin, rid);

      if (!res || !res.token) throw new Error("Invalid PIN");

      // Save token per tenant
      localStorage.setItem(tokenKey, res.token);
      setRid(rid);

      setSuccess(true);
      await new Promise((r) => setTimeout(r, 200));

      // Navigate to tenant dashboard
      navigate(`/t/${rid}/staff-dashboard`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid PIN");

      inputsRef.current.forEach((el) => {
        if (!el) return;
        el.classList.remove("animate-shake");
        el.offsetWidth;
        el.classList.add("animate-shake");
      });

      hasSubmittedRef.current = false;
    } finally {
      setIsLogging(false);
    }
  };

  // Auto-run login
  useEffect(() => {
    if (pin.length === 4 && !isLogging && !hasSubmittedRef.current) {
      doAutoLogin(pin);
    }
  }, [pin]);

  // Focus first empty
  useEffect(() => {
    const first = digits.findIndex((d) => d === "");
    focusInput(first === -1 ? 3 : first);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="bg-gray-800 rounded-2xl shadow-2xl ring-2 ring-gray-700">
          {/* Header */}
          <div className="px-6 py-4 relative border-b border-gray-700">
            <button
              onClick={() => navigate(`/t/${rid}`)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              ←
            </button>

            <div className="text-center text-xl font-extrabold text-gray-100">
              Staff Login
            </div>
          </div>

          {/* PIN Input */}
          <div className="px-8 py-10">
            <p className="text-center text-gray-400 mb-6">
              Enter your 4-digit PIN
            </p>

            <div className="flex items-center justify-center gap-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="password"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  disabled={isLogging}
                  className={`w-16 h-16 text-3xl text-center rounded-xl bg-gray-700 text-white border
                  ${error ? "border-red-500" : "border-gray-600"}`}
                />
              ))}
            </div>

            <div className="mt-6 text-center h-6">
              {isLogging ? (
                <span className="text-emerald-400">Signing in...</span>
              ) : error ? (
                <span className="text-red-400">{error}</span>
              ) : success ? (
                <span className="text-emerald-400">Success!</span>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-700/60 text-center border-t border-gray-700 text-xs text-gray-400">
            Trouble logging in? Contact your manager.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake .4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
