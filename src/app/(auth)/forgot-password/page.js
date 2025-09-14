'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!isValidEmail) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/send-resetPasswordLink', { email });

      if (response.status === 200 && response.data.success) {
        toast.success('Reset link successfully sent!');
        setSubmitted(true);
      } else {
        toast.error(response.data.message || 'Failed to send reset link');
      }
    } catch (error) {
      const err = error.response ? error : {};

      if (err.status === 404) {
        toast.error('Email not found');
      } else {
        toast.error(err.data?.message || 'Something went wrong. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="absolute inset-0 -z-10 bg-black/70" />

      <motion.div
        className="bg-[#1a1a1a] p-8 rounded-2xl shadow-xl w-full max-w-md backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Forgot Password
          </span>
        </h1>

        {!submitted ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg bg-black/70 text-white border transition
                  ${email.length === 0
                    ? 'border-white/20'
                    : isValidEmail
                      ? 'border-green-500'
                      : 'border-red-500'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {!isValidEmail && email.length > 0 && (
                <p className="text-sm text-red-400 mt-1">Please enter a valid email address.</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={!isValidEmail || isLoading}
              whileHover={{ scale: !isValidEmail || isLoading ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-md transition-all
                ${!isValidEmail || isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:brightness-110'}`}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </form>
        ) : (
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-semibold text-green-400">Email Sent!</h2>
            <p className="text-white/70">
              We sent a password reset link to <strong>{email}</strong>. Please check your inbox.
            </p>
          </motion.div>
        )}

        <p className="text-center text-sm text-white/70 mt-6">
          Back to{' '}
          <Link href="/login" className="text-green-400 hover:text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
