// src/components/Navbar.js
"use client";
import React, { useState, useEffect } from "react";
import ShinyText from "./comps/ShinyText";
import GooeyNav from "./comps/GooeyNav";
import { IconLogout } from "@tabler/icons-react";

export default function Navbar() {
    // State for authentication status and loading status
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Start in a loading state

    // useEffect runs once after the initial render, similar to componentDidMount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Fetch user data to check for an active session
                const res = await fetch('/api/user/get-data', { credentials: 'include' });
                setIsAuthenticated(res.ok); // Set auth state based on response
            } catch (error) {
                console.error("Authentication check failed:", error);
                setIsAuthenticated(false);
            } finally {
                // IMPORTANT: Set loading to false after the check is complete
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []); // Empty dependency array means this effect runs only once

    // Handle logout
    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'GET' });
            if (res.ok) {
                setIsAuthenticated(false);
                window.location.href = '/login';
            } else {
                console.error('Logout failed');
            }
        } catch (err) {
            console.error('Error during logout:', err);
        }
    };

    // Define navigation items based on auth state
    const navItems = isAuthenticated
        ? [
            { label: "Home", href: "/" },
            { label: "About", href: "#" },
            { label: "Dashboard", href: "/dashboard" },
        ]
        : [
            { label: "Home", href: "/" },
            { label: "About", href: "#" },
        ];

    return (
        <div className="w-full flex items-center justify-center bg-transparent h-[10vh] z-10 top-0 overflow-visible">
            <div className="w-1/2 pl-10 h-full flex items-center text-3xl font-semibold text-white">
                InterVue
            </div>
            <div className="w-1/2 flex items-center justify-end h-full gap-3 pr-10">
                <GooeyNav
                    items={navItems}
                    particleCount={15}
                    particleDistances={[90, 10]}
                    particleR={100}
                    initialActiveIndex={0}
                    animationTime={500}
                    timeVariance={300}
                    colors={[1, 2, 3, 1, 2, 3, 1, 4]}
                />

                {/* Conditional rendering based on the loading state */}
                {isLoading ? (
                    // While loading, you can show a placeholder or nothing
                    <div className="w-[180px] h-[38px]"></div> // A placeholder to prevent layout shift
                ) : !isAuthenticated ? (
                    // If not loading and not authenticated, show Login/Register
                    <>
                        <a href="/login" className="block">
                            <ShinyText
                                text="Login"
                                className="border-2 rounded-xl px-3 py-2 text-white hover:cursor-pointer"
                            />
                        </a>
                        <a href="/register" className="block">
                            <ShinyText
                                text="Register"
                                className="border-2 rounded-xl px-3 py-2 text-white hover:cursor-pointer"
                            />
                        </a>
                    </>
                ) : (
                    // If not loading and authenticated, show logout button
                    <button
                        onClick={handleLogout}
                        className="flex items-center hover:bg-white hover:text-black gap-2 border-2 rounded-xl px-3 py-2 text-white transition-colors duration-200"
                        title="Logout"
                    >
                        <IconLogout stroke={2} size={20} />
                        <span>Logout</span>
                    </button>
                )}
            </div>
        </div>
    );
}