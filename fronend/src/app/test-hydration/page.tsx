"use client"

import { useAuth } from "@/context/Auth-context"

export default function TestHydrationPage() {
  const { userInfo, isHydrated } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Hydration Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold">Hydration Status:</h2>
          <p className={`${isHydrated ? 'text-green-600' : 'text-red-600'}`}>
            {isHydrated ? '✅ Hydrated' : '❌ Not Hydrated'}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold">User Status:</h2>
          {!isHydrated ? (
            <p className="text-gray-500">Loading...</p>
          ) : userInfo ? (
            <div className="text-green-600">
              <p>✅ Authenticated as {userInfo.name}</p>
              <p>Email: {userInfo.email}</p>
              <p>Role: {userInfo.role}</p>
              <p>Reputation: {userInfo.reputation}</p>
            </div>
          ) : (
            <p className="text-blue-600">👤 Guest User</p>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold">Test Login:</h2>
          <p className="text-sm text-gray-600 mb-2">
            Use email: test@example.com, password: password123
          </p>
          <a href="/login" className="text-blue-600 hover:underline">
            Go to Login Page
          </a>
        </div>
      </div>
    </div>
  )
}
