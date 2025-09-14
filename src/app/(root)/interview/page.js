"use client";

import { useSearchParams } from "next/navigation";
// import Agent from "@/components/Agent";

export default function Page() {
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const username = searchParams.get("username");
  const profileImageURL = searchParams.get("profileImageURL");

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold">Interview Generation</h3>

      <div className="mt-2">
        <p><strong>User ID:</strong> {userId}</p>
        <p><strong>Username:</strong> {username}</p>
        <p><strong>Profile Image:</strong> {profileImageURL}</p>
      </div>

      {/* If Agent is a client component, uncomment this */}
      {/* 
      <Agent
        userName={username}
        userId={userId}
        profileImage={profileImageURL}
        type="generate"
      /> 
      */}
    </div>
  );
}
