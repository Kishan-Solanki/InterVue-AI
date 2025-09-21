'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) payload.append(key, value);
    });

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/sign-up', payload);

      if (res.data.success) {
        toast.success(res.data.message || 'Registered successfully!');
        if (res.data.warning) toast.warning(res.data.warning);

        setTimeout(() => {
          router.push('/verifyemail');
        }, 2000);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Something went wrong. Please try again.';
        toast.error(message);
      } else {
        toast.error('Unexpected error. Please try again.');
      }
    } finally {
      setLoading(false);
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
          Create an Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                errors.username ? 'border-red-500' : 'border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50`}
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                errors.email ? 'border-red-500' : 'border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50`}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                errors.password ? 'border-red-500' : 'border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50`}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg bg-black/60 text-white border ${
                errors.confirmPassword ? 'border-red-500' : 'border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50`}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Profile Image */}
          <div>
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-black/60 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{
              scale: !loading ? 1.05 : 1,
            }}
            whileTap={{
              scale: !loading ? 0.95 : 1,
            }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 py-3 rounded-xl font-semibold text-white shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Registering...
              </>
            ) : (
              'Register'
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-white/70 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
