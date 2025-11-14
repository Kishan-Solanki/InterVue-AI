// app/(root)/dashboard/DashboardSkeleton.jsx
import React from 'react';

const DashboardSkeleton = () => {
    return (
        <div className="relative min-h-screen bg-neutral-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto animate-pulse">
                {/* Header Skeleton */}
                <header className="mb-8">
                    <div className="h-8 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                </header>

                {/* Main Content Grid Skeleton */}
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column Skeleton */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col items-center">
                            <div className="h-24 w-24 bg-slate-700 rounded-md"></div>
                            <div className="h-6 bg-slate-700 rounded w-1/2 mt-4"></div>
                            <div className="h-4 bg-slate-700 rounded w-3/4 mt-2"></div>
                            <div className="h-6 bg-slate-700 rounded-full w-28 mt-3"></div>
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-36"></div>
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-48"></div>
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-64"></div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardSkeleton;