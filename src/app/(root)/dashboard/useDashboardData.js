// app/(root)/dashboard/useDashboardData.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useDashboardData() {
    const [user, setUser] = useState(null);
    const [interviews, setInterviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch user data first
                const userRes = await fetch('/api/user/get-data');
                if (!userRes.ok) {
                    // If user is not authenticated, redirect to login
                    router.push('/login');
                    return;
                }
                const userData = await userRes.json();
                setUser(userData);

                // Then fetch the user's interviews
                const interviewsRes = await fetch(`/api/user/get-interview-data?userid=${userData.id}`);
                if (interviewsRes.ok) {
                    const interviewsData = await interviewsRes.json();
                    setInterviews(Array.isArray(interviewsData.data) ? interviewsData.data : []);
                } else {
                    console.error('Failed to fetch interviews');
                }
            } catch (err) {
                console.error('An error occurred while fetching dashboard data:', err);
                setError('Failed to load dashboard. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    return { user, interviews, isLoading, error };
}