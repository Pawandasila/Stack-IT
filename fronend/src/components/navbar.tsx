"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/Auth-context"
import { Bell, MessageSquare, Trophy, Settings, User, LogOut } from "lucide-react"

export function Navbar() {
  const { userInfo, logout, isHydrated } = useAuth()

  // Don't render until hydration is complete to prevent hydration mismatches
  if (!isHydrated) {
    return (
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-orange-600">
                StackIt
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Questions
                </Link>
                <Link href="/tags" className="text-gray-600 hover:text-gray-900">
                  Tags
                </Link>
                <Link href="/users" className="text-gray-600 hover:text-gray-900">
                  Users
                </Link>
              </div>
            </div>
            {/* Empty space during hydration to maintain layout */}
            <div className="w-24 h-10"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-orange-600">
              StackIt
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Questions
              </Link>
              <Link href="/tags" className="text-gray-600 hover:text-gray-900">
                Tags
              </Link>
              <Link href="/users" className="text-gray-600 hover:text-gray-900">
                Users
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userInfo ? (
              // Authenticated user menu
              <div className="flex items-center space-x-4">
                <Link href="/ask">
                  <Button>Ask Question</Button>
                </Link>
                
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        3
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="p-2 text-sm font-semibold text-gray-700">Notifications</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <span className="text-xs">You received a new message</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span className="text-xs">Your answer was upvoted</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span className="text-xs">Badge earned: Enthusiast</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <span className="text-xs text-blue-600">View all notifications</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Profile with Reputation */}
                <div className="flex items-center space-x-2">
                  <div className="hidden md:flex items-center space-x-1 text-sm">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{userInfo.reputation || 0}</span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userInfo.avatar} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {userInfo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium">{userInfo.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{userInfo.role}</p>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center space-x-2 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userInfo.avatar} />
                          <AvatarFallback className="bg-blue-500 text-white">
                            {userInfo.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{userInfo.name}</p>
                          <p className="text-xs text-gray-500">{userInfo.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Activity</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="flex items-center space-x-2 text-red-600">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              // Guest user buttons
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
