'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(() => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    return '';
  }, [email]);

  const otpError = useMemo(() => {
    if (!otp) return 'OTP is required';
    if (!/^\d{6}$/.test(otp)) return 'OTP must be 6 digits';
    return '';
  }, [otp]);

  const isFormValid = useMemo(() => {
    return !emailError && !otpError;
  }, [emailError, otpError]);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value.trim());
  }, []);

  const handleOtpChange = useCallback((e) => {
    const numericOnly = e.target.value.replace(/\D/g, '');
    setOtp(numericOnly);
  }, []);

  const handleVerify = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isFormValid) return;

      setLoading(true);
      try {
        const res = await axios.post('/api/auth/verify-email', { email, otp });

        if (res.data.success) {
          toast.success(res.data.message || 'Email verified!');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          toast.error(res.data.message || 'Verification failed');
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          toast.error(err.response?.data?.message || 'Server error');
        } else {
          toast.error('Unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    },
    [email, otp, isFormValid, router]
  );

  const handleResend = useCallback(async () => {
    if (!email) return toast.error('Please enter your email');
    if (emailError) return toast.error(emailError);

    try {
      await axios.post('/api/auth/resend-code', { email });
      toast.success('OTP has been resent to your email');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to resend code');
      } else {
        toast.error('Unexpected error occurred');
      }
    }
  }, [email, emailError]);

  const isButtonDisabled = useMemo(() => loading || !isFormValid, [loading, isFormValid]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Verify Your Email
        </h1>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                emailError ? 'border-red-500' : 'border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              autoComplete="email"
              required
            />
            {emailError && <p className="text-sm text-red-400 mt-1">{emailError}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">6-digit OTP</label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              maxLength={6}
              inputMode="numeric"
              pattern="\d{6}"
              className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                otpError ? 'border-red-500' : 'border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              autoComplete="one-time-code"
              required
            />
            {otpError && <p className="text-sm text-red-400 mt-1">{otpError}</p>}
          </div>

          <motion.button
            type="submit"
            whileHover={!isButtonDisabled ? { scale: 1.03 } : {}}
            whileTap={!isButtonDisabled ? { scale: 0.97 } : {}}
            disabled={isButtonDisabled}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </motion.button>
        </form>

        <button
          onClick={handleResend}
          className="text-sm text-blue-400 hover:underline mt-4 block mx-auto"
          type="button"
        >
          Resend Code
        </button>

        <p className="text-center text-sm text-white/70 mt-6">
          Already verified?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
