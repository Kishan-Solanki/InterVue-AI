"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Agent from "@/components/Agent";

function InterviewContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const username = searchParams.get("username");
  const profileImageURL = searchParams.get("profileImageURL");

  return (
    <div>
      <h3>Interview Generation</h3>
      <p>User ID: {userId}</p>
      <p>Username: {username}</p>
      <p>Profile Image: {profileImageURL}</p>
      <Agent
        userName={username}
        userId={userId}
        profileImage={profileImageURL}
        type="generate"
      /> 
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading interview...</p>}>
      <InterviewContent />
    </Suspense>
  );
}
