'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

function LoginPageContent() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const emailValid = /^\S+@\S+\.\S+$/.test(email);
    const passwordValid = password.length >= 6;
    setIsFormValid(emailValid && passwordValid);
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading || cooldown) return;

    setLoading(true);
    setCooldown(true);

    try {
      const res = await axios.post('/api/auth/sign-in', { email, password });

      toast.success(res.data?.message || 'Login successful!');
      router.push('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Something went wrong. Please try again.';

        if (status === 403 && err.response?.data?.redirectTo === '/verifyemail') {
          toast.error('Please verify your email before logging in.');
          router.push('/verifyemail');
        } else {
          toast.error(message);
        }
      } else {
        toast.error('Unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setCooldown(false), 3000); // prevent spamming
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-black/90 text-white px-4">
      <div className="absolute inset-0 -z-10 bg-black/70" />

      <motion.div
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          Login to InterVue
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                email && !/^\S+@\S+\.\S+$/.test(email)
                  ? 'border-red-500'
                  : 'border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50`}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                  password && password.length < 6
                    ? 'border-red-500'
                    : 'border-white/20'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-10 disabled:opacity-50`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                className="absolute inset-y-0 right-3 flex items-center text-white/60 hover:text-white/80 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link
              href="/forgot-password"
              className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
            >
              Forgot password?
            </Link>
          </div>

          <motion.button
            type="submit"
            whileHover={{
              scale: isFormValid && !loading && !cooldown ? 1.05 : 1,
            }}
            whileTap={{
              scale: isFormValid && !loading && !cooldown ? 0.95 : 1,
            }}
            disabled={!isFormValid || loading || cooldown}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 py-3 rounded-xl font-semibold text-white shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Logging in...
              </>
            ) : cooldown ? (
              'Please wait...'
            ) : (
              'Login'
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-white/70 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-cyan-400 hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen flex items-center justify-center bg-black/90 text-white px-4">
          <div className="text-white text-center">Loading...</div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
