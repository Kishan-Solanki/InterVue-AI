"use client"

// import Agent from "@/components/Agent";
import { useSearchParams } from 'next/navigation'

const Page = () => {
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId')
  const username = searchParams.get('username')
  const profileImageURL = searchParams.get('profileImageURL')

  return (
    <>
      <h3>Interview generation</h3>

      {/* <Agent
        userName={username}
        userId={userId}
        profileImage={profileImageURL}
        type="generate"
      /> */}
    </>
  );
};

export default Page;
