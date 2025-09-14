'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

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
  const [serverError, setServerError] = useState('');
  const [warning, setWarning] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setWarning('');
    if (!validate()) return;

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        payload.append(key, value);
      }
    });

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/sign-up', payload);

      if (res.data.success) {
        setSuccessMessage(res.data.message || 'Registered successfully!');
        if (res.data.warning) {
          setWarning(res.data.warning);
        }
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
        setServerError(message);
      } else {
        setServerError('Unexpected error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(''), 4000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-green-800 p-6">
      <div className="bg-black bg-opacity-40 p-8 rounded-xl shadow-xl w-full max-w-md text-white">
        <h1 className="text-3xl font-bold text-center mb-6">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full p-3 rounded bg-gray-800 text-white"
            onChange={handleInputChange}
          />
          {errors.username && <p className="text-red-400">{errors.username}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-3 rounded bg-gray-800 text-white"
            onChange={handleInputChange}
          />
          {errors.email && <p className="text-red-400">{errors.email}</p>}

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-3 rounded bg-gray-800 text-white"
            onChange={handleInputChange}
          />
          {errors.password && <p className="text-red-400">{errors.password}</p>}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="w-full p-3 rounded bg-gray-800 text-white"
            onChange={handleInputChange}
          />
          {errors.confirmPassword && (
            <p className="text-red-400">{errors.confirmPassword}</p>
          )}

          <input
            type="file"
            name="profileImage"
            accept="image/*"
            className="w-full p-3 rounded bg-gray-800 text-white"
            onChange={handleInputChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded bg-green-600 hover:bg-green-700 transition"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {serverError && <p className="text-red-400 mt-4 text-center">{serverError}</p>}
        {warning && <p className="text-yellow-400 mt-4 text-center">{warning}</p>}
        {successMessage && (
          <p className="text-green-400 mt-4 text-center">{successMessage}</p>
        )}

        <p className="mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-300 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
}
