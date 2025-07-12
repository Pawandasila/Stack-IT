"use client"

import { useAuth } from "@/context/Auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardPage() {
  const { userInfo, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={userInfo?.avatar} />
                  <AvatarFallback>
                    {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{userInfo?.name || "User"}</p>
                  <p className="text-gray-600">{userInfo?.email}</p>
                  <p className="text-sm text-gray-500 capitalize">Role: {userInfo?.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Reputation: <span className="font-medium">{userInfo?.reputation || 0}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Member since: <span className="font-medium">Recently</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>StackIt Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Ask Questions</h3>
                <p className="text-sm text-gray-600">
                  Get help from the community by asking detailed questions.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Share Knowledge</h3>
                <p className="text-sm text-gray-600">
                  Answer questions and help others learn.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Build Reputation</h3>
                <p className="text-sm text-gray-600">
                  Earn reputation points by contributing quality content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
