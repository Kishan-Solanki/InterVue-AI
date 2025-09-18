"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Agent from "@/components/Agent";

function InterviewContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const username = searchParams.get("username");
  const profileImageURL = searchParams.get("profileImageURL");
  const autoStart = searchParams.get("start") === "1";

  return (
    <div className="w-full min-h-screen mx-auto px-4 py-8 bg-black">
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-white">Live Interview</h3>
        {/* <p className="text-neutral-400 mt-1">AI on the left, you on the right. Good luck!</p> */}
      </div>
      <Agent
        userName={username}
        userId={userId}
        profileImage={profileImageURL}
        type="generate"
        layout="split"
        autoStart={autoStart}
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
