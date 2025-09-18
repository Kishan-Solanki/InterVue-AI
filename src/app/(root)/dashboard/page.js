'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FloatingDock } from '@/app/component/comps/FloatingDock ' // Make sure this path is correct
import {
  IconBrandGithub,
  IconHome,
  IconLogout,
  IconMicrophone,
  IconReportAnalytics,
  IconHistory,
} from "@tabler/icons-react";
import { BackgroundBeamsWithCollision } from '@/app/component/comps/BackgroundBeamsWithCollision '

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/get-data');
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error('Error fetching user:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'GET' });
      if (res.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // The links array is modified to include an onClick handler for logout
  const links = [
    {
      title: "Home",
      icon: <IconHome className="h-full w-full" />,
      href: "/",
    },
    {
      title: "GitHub",
      icon: <IconBrandGithub className="h-full w-full" />,
      href: "https://github.com/Kishan-Solanki/InterVue-AI",
    },
    {
      title: "Logout",
      icon: <IconLogout className="h-full w-full" />,
      onClick: handleLogout, // This now calls the logout function directly
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900 text-white">
        Loading...
      </div>
    );
  }

  // A simple greeting based on the time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative min-h-screen  text-neutral-200 p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">{getGreeting()}, {user.username}!</h1>
          <p className="text-neutral-400 mt-1">Ready to ace your next interview? Let's get started.</p>
        </header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop:blur-2xl p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center">
              <Image
                src={user.profileImageURL}
                alt={user.username}
                width={100}
                height={100}
                className="rounded-md object-cover border-4 border-slate-600"
              />
              <h2 className="mt-4 text-xl font-semibold text-white">{user.username}</h2>
              <p className="text-sm text-neutral-400">{user.email}</p>
              <span className={`mt-3 px-3 py-1 text-xs font-medium rounded-full ${user.isVerified
                ? 'bg-green-500/20 text-green-300'
                : 'bg-yellow-500/20 text-yellow-300'
                }`}
              >
                {user.isVerified ? 'Verified Account' : 'Not Verified'}
              </span>
            </div>
          </div>

          {/* Right Column: Actions & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Start Interview Card */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white">Ready for your next challenge?</h3>
              <p className="text-neutral-400 mt-1 mb-4 text-sm">Select an interview type and start practicing right away.</p>
              <Link
                href={{
                  pathname: '/interview',
                  query: {
                    userId: user.id,
                    username: user.username,
                    profileImageURL: user.profileImageURL,
                    start: '1',
                  },
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors duration-200"
              >
                <IconMicrophone size={20} />
                Start Call
              </Link>
            </div>

            {/* Stats Card */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white">Your Progress</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconReportAnalytics size={24} className="text-cyan-400" />
                    <p className="text-sm text-neutral-300">Average Score</p>
                  </div>
                  <p className="text-2xl font-bold mt-2">82%</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconHistory size={24} className="text-cyan-400" />
                    <p className="text-sm text-neutral-300">Interviews Completed</p>
                  </div>
                  <p className="text-2xl font-bold mt-2">14</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Dock */}
      <div className="absolute bottom-[2%] flex items-center justify-center w-full z-50 text-black">
        <FloatingDock items={links} />
      </div>

      <div className='absolute left-0 top-0 -z-10 h-screen w-full'>
        <BackgroundBeamsWithCollision>
          <h2 className="text-2xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-black dark:text-white font-sans tracking-tight">
            {/* What&apos;s cooler than Beams?{" "} */}
            {/* <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
              <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                <span className="">Exploding beams.</span>
              </div>
              <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
                <span className="">Exploding beams.</span>
              </div>
            </div> */}
          </h2>
        </BackgroundBeamsWithCollision>
      </div>
    </div>
  )
}

export default Dashboard;