import React, { useState } from 'react';
import {  Briefcase } from 'lucide-react';
import axios from "axios";
import { staffLogin } from '../../api/staff.login';
import { useTenant } from '../../context/TenantContext';

export default function PinLogin() {
  const [userType, setUserType] = useState<'customer' | 'staff'>('customer');
  const [pin, setPin] = useState('');
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const { rid } = useTenant();

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  // const handleLogin = () => {
  //   if (pin.length === 4) {
  //     alert(`Logging in as ${userType} with PIN: ${pin}`);
  //     // Add your login logic here
  //   }
  // };

const handleLogin = async () => {
  if (pin.length !== 4) return;
  if (!rid) return;

  try {
    const res = await staffLogin(pin, userType, rid);

    alert("Login Successful!");
    console.log(res.token);

    if (res.token) {
      localStorage.setItem("staffToken", res.token);
    }
  } catch (err) {
    alert("Login failed");
  }
};

 const handleForgotPin = async () => {
  if (phoneNumber.length < 10) return;

  try {
    await axios.post("http://localhost:5000/auth/staff-forgot-password", {
      phone: phoneNumber,
    });

    alert("Reset link sent to your phone!");
    setShowForgotPin(false);
    setPhoneNumber("");
  } catch (err: any) {
    alert(err.response?.data?.message || "Something went wrong");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-emerald-100 text-sm">Enter your PIN to continue</p>
        </div>

        <div className="p-8">
          {!showForgotPin ? (
            <>
              {/* User Type Toggle */}
              <div className="flex gap-3 mb-8">
              
                <button
                  onClick={() => setUserType('staff')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    userType === 'staff'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Briefcase size={20} />
                  Staff
                </button>
              </div>

              {/* PIN Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  className="w-full text-center text-3xl tracking-[1.5em] font-bold border-2 border-emerald-300 rounded-xl py-4 px-6 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  placeholder="••••"
                />
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={pin.length !== 4}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  pin.length === 4
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Login
              </button>

              {/* Forgot PIN */}
              <button
                onClick={() => setShowForgotPin(true)}
                className="w-full mt-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                Forgot PIN?
              </button>
            </>
          ) : (
            <>
              {/* Forgot PIN Form */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Reset PIN</h3>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Enter your registered phone number
                </p>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-xl border-2 border-emerald-300 rounded-xl py-4 px-6 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  placeholder="Phone Number"
                />
              </div>

              <button
                onClick={handleForgotPin}
                disabled={phoneNumber.length < 10}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-3 ${
                  phoneNumber.length >= 10
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Send Reset Link
              </button>

              <button
                onClick={() => {
                  setShowForgotPin(false);
                  setPhoneNumber('');
                }}
                className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Back to Login
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <button className="text-emerald-600 font-semibold hover:text-emerald-700">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}