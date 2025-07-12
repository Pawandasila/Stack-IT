"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"

interface User {
  id: string
  username: string
  name: string
  avatar: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onMention?: (mentionedUsers: User[]) => void
}

// Mock users for demonstration
const mockUsers: User[] = [
  { id: "1", username: "john_doe", name: "John Doe", avatar: "/placeholder-user.jpg" },
  { id: "2", username: "sarah_j", name: "Sarah Johnson", avatar: "/placeholder-user.jpg" },
  { id: "3", username: "mike_chen", name: "Mike Chen", avatar: "/placeholder-user.jpg" },
  { id: "4", username: "alex_r", name: "Alex Rodriguez", avatar: "/placeholder-user.jpg" },
]

export function MentionInput({ value, onChange, placeholder, className, onMention }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionQuery, setMentionQuery] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart

    onChange(newValue)

    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const query = mentionMatch[1]
      const start = cursorPosition - mentionMatch[0].length

      setMentionStart(start)
      setMentionQuery(query)

      // Filter users based on query
      const filteredUsers = mockUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.name.toLowerCase().includes(query.toLowerCase()),
      )

      setSuggestions(filteredUsers)
      setShowSuggestions(filteredUsers.length > 0)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
      setMentionStart(-1)
      setMentionQuery("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case "Enter":
      case "Tab":
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  const insertMention = (user: User) => {
    if (mentionStart === -1) return

    const beforeMention = value.substring(0, mentionStart)
    const afterMention = value.substring(mentionStart + mentionQuery.length + 1)
    const newValue = beforeMention + `@${user.username} ` + afterMention

    onChange(newValue)
    setShowSuggestions(false)

    // Notify parent about the mention
    onMention?.([user])

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = mentionStart + user.username.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const getSuggestionPosition = () => {
    if (!textareaRef.current || mentionStart === -1) return { top: 0, left: 0 }

    const textarea = textareaRef.current
    const textBeforeMention = value.substring(0, mentionStart)
    const lines = textBeforeMention.split("\n")
    const currentLine = lines.length - 1
    const currentColumn = lines[lines.length - 1].length

    // Approximate position calculation
    const lineHeight = 20
    const charWidth = 8

    return {
      top: (currentLine + 1) * lineHeight + 40,
      left: currentColumn * charWidth + 10,
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
          style={getSuggestionPosition()}
        >
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? "bg-blue-50 border-l-2 border-blue-500" : ""
              }`}
              onClick={() => insertMention(user)}
            >
              <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-6 h-6 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">@{user.username}</div>
                <div className="text-xs text-gray-500 truncate">{user.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
