'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Link href="/login">
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
          Go To Login
        </button>
      </Link>
    </div>
  );
}
