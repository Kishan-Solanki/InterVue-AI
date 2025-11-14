// app/(root)/dashboard/page.jsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import "../../globals.css";
// Component Imports
import ProfileCard from './ProfileCard'
import DashboardSkeleton from './DashboardSkeleton'
import { FloatingDock } from '@/app/component/comps/FloatingDock '
import { BackgroundBeamsWithCollision } from '@/app/component/comps/BackgroundBeamsWithCollision '

// Custom Hook for Logic
import { useDashboardData } from './useDashboardData'

// Icon Imports
import {
  IconBrandGithub, IconHome, IconLogout, IconMicrophone,
  IconReportAnalytics, IconHistory,
} from "@tabler/icons-react";

const DashboardPage = () => {
  const { user, interviews, isLoading, error } = useDashboardData();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const links = [
    { title: "Home", icon: <IconHome className="h-full w-full" />, href: "/" },
    { title: "GitHub", icon: <IconBrandGithub className="h-full w-full" />, href: "https://github.com/Kishan-Solanki/InterVue-AI" },
    { title: "Logout", icon: <IconLogout className="h-full w-full" />, onClick: handleLogout },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
        <p className="text-red-400 mb-4">{error || 'Could not load user data.'}</p>
        <Link href="/login" className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-neutral-200 bg-neutral-950 overflow-hidden">
      <div className="relative h-screen z-10 max-w-7xl mx-auto pt-4 sm:p-6 lg:p-8 overflow-hidden"> {/* Added bottom padding for dock */}
        {/* Header */}
        <header className="">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{getGreeting()}, {user.username}!</h1>
          <p className="text-neutral-400 mt-1">Ready to ace your next interview? Let's get started.</p>
        </header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 overflow-hidden h-[90%]">

          {/* Left Column: Profile Card */}
          <aside className="lg:col-span-1 lg:sticky lg:top-8 mb-8 lg:mb-0 flex flex-col justify-between ">
            <ProfileCard user={user} />
            {/* <div className="absolute bottom-4 left-0 w-fit flex items-center justify-center text-center bg-red-400  z-50 text-black"> */}
              <FloatingDock items={links} />
            {/* </div> */}
          </aside>

          {/* Right Column: Actions & Stats - Now with max-height and overflow for scrolling */}
          <div className="no-scrollbar bg- lg:col-span-2 space-y-8 overflow-y-scroll ">
            {/* Start Interview Card */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white">Ready for your next challenge?</h3>
              <p className="text-neutral-400 mt-1 mb-4 text-sm">Select an interview type and start practicing right away.</p>

              <Link href={{ pathname: '/interview', query: { userId: user.id, username: user.username, profileImageURL: user.profileImageURL, start: '1' } }} className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors duration-200">
                <IconMicrophone size={20} />
                Start Call
              </Link>

              <div className="flex flex-wrap gap-3">
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
                <Link
                  href="/growth"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg border border-slate-600 hover:bg-slate-600 transition-colors duration-200"
                >
                  My Growth
                </Link>
              </div>
>>>>>>> c8fc539e9cd2278996fefea9c1e86ea5160d8780
            </div>

            {/* Stats Card */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white">Your Progress</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3"><IconReportAnalytics size={24} className="text-cyan-400" /><p className="text-sm text-neutral-300">Average Score</p></div>
                  <p className="text-2xl font-bold mt-2">82%</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3"><IconHistory size={24} className="text-cyan-400" /><p className="text-sm text-neutral-300">Interviews Completed</p></div>
                  <p className="text-2xl font-bold mt-2">{interviews.length}</p>
                </div>
              </div>
            </div>

            {/* Interviews History */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              {/* ... (rest of the interview history JSX is identical and correct) ... */}
              <h3 className="text-lg font-semibold text-white">Your Interviews</h3>
              {interviews.length === 0 ? (
                <p className="text-neutral-400 mt-4">No interviews yet. Start one to see it here.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {interviews.map((iv) => (
                    <div key={iv._id} className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">{iv.role || 'Interview'}</h4>
                        <span className="text-xs text-neutral-400">{new Date(iv.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 text-sm text-neutral-300">
                        <p>Level: <span className="text-neutral-200 font-medium">{iv.level || '—'}</span></p>
                        <p>Type: <span className="text-neutral-200 font-medium">{iv.type || '—'}</span></p>
                        <p>Score: <span className="text-neutral-200 font-medium">{iv?.feedback?.totalScore ?? 0}/100</span></p>
                      </div>
                      <div className="mt-3">
                        <Link href={`/interview/results/${iv._id}`} className="inline-block px-4 py-2 bg-cyan-500 text-black font-semibold rounded-md hover:bg-cyan-400 transition-colors">
                          View Results
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      

      {/* Background */}
      <div className='absolute left-0 top-0 -z-10 h-full w-full'>
        <BackgroundBeamsWithCollision />
      </div>
    </div>
  )
}

export default DashboardPage;