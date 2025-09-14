'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/get-data')
        if (!res.ok) {
          throw new Error('Unauthorized')
        }
        const data = await res.json()
        setUser(data)
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/login')
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'GET',
      })

      if (res.ok) {
        router.push('/login')
      } else {
        console.error('Logout failed')
      }
    } catch (err) {
      console.error('Error during logout:', err)
    }
  }

  if (!user) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}</h1>
      <div className="flex items-center gap-4 mb-6">
        <Image
          src={user.profileImageURL}
          alt={user.username}
          width={80}
          height={80}
          className="rounded-full object-cover"
        />
        <div>
          <p className="text-lg">Email: {user.email}</p>
          <p>Status: {user.isVerified ? 'Verified ✅' : 'Not Verified ❌'}</p>
        </div>
      </div>

      <Link
        href={{
          pathname: '/interview',
          query: {
            userId: user.id,
            username: user.username,
            profileImageURL: user.profileImageURL,
          },
        }}
        className="text-cyan-400 hover:underline"
      >
        Interview
      </Link>

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-4"
      >
        Logout
      </button>
    </div>
  )
}

export default Dashboard
