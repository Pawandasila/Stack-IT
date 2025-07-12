"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, MessageCircle, ThumbsUp, AtSign, Check, BarChart3 } from "lucide-react"

interface Notification {
  id: string
  type: "answer" | "vote" | "mention" | "accept" | "comment" | "poll_vote"
  title: string
  message: string
  time: string
  read: boolean
  relatedId?: string
  senderName?: string
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "answer",
      title: "New Answer",
      message: "Someone answered your question about React hooks",
      time: "2 hours ago",
      read: false,
      senderName: "John Doe",
    },
    {
      id: "2",
      type: "vote",
      title: "Answer Upvoted",
      message: "Your answer received 5 upvotes",
      time: "4 hours ago",
      read: false,
    },
    {
      id: "3",
      type: "mention",
      title: "You were mentioned",
      message: "@sarah mentioned you in a comment",
      time: "1 day ago",
      read: true,
      senderName: "Sarah Johnson",
    },
    {
      id: "4",
      type: "accept",
      title: "Answer Accepted",
      message: "Your answer was marked as accepted",
      time: "2 days ago",
      read: true,
    },
    {
      id: "5",
      type: "poll_vote",
      title: "Poll Vote",
      message: "Someone voted on your poll about JavaScript frameworks",
      time: "3 hours ago",
      read: false,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "answer":
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case "vote":
        return <ThumbsUp className="w-4 h-4 text-green-500" />
      case "mention":
        return <AtSign className="w-4 h-4 text-purple-500" />
      case "accept":
        return <Check className="w-4 h-4 text-green-600" />
      case "comment":
        return <MessageCircle className="w-4 h-4 text-orange-500" />
      case "poll_vote":
        return <BarChart3 className="w-4 h-4 text-indigo-500" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate receiving a new notification
      if (Math.random() > 0.95) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: "mention",
          title: "New Mention",
          message: "@user mentioned you in a comment",
          time: "just now",
          read: false,
          senderName: "Random User",
        }
        setNotifications((prev) => [newNotification, ...prev])
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications yet</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3 w-full">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-600"}`}>
                        {notification.title}
                      </p>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className={`text-sm ${!notification.read ? "text-gray-700" : "text-gray-500"} mt-1`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">{notification.time}</p>
                      {notification.senderName && <p className="text-xs text-blue-600">{notification.senderName}</p>}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {notifications.length > 10 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
