"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, MessageCircle, Eye, Check, Clock } from 'lucide-react'

interface Question {
  id: string
  title: string
  content: string
  author: {
    name: string
    avatar: string
    reputation: number
  }
  tags: string[]
  votes: number
  answers: number
  views: number
  hasAcceptedAnswer: boolean
  createdAt: string
}

interface QuestionListProps {
  questions?: any[]
  isLoading?: boolean
}

// Mock questions data
const mockQuestions: Question[] = [
  {
    id: "1",
    title: "How to center a div with CSS Flexbox?",
    content:
      "I'm trying to center a div both horizontally and vertically using CSS Flexbox. I've tried several approaches but nothing seems to work properly...",
    author: {
      name: "Sarah Johnson",
      avatar: "",
      reputation: 1250,
    },
    tags: ["css", "flexbox", "html"],
    votes: 15,
    answers: 3,
    views: 234,
    hasAcceptedAnswer: true,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    title: "React useEffect not triggering on state change",
    content:
      "I have a useEffect hook that should trigger when my state changes, but it's not working as expected. Here's my code...",
    author: {
      name: "Mike Chen",
      avatar: "",
      reputation: 890,
    },
    tags: ["react", "javascript", "hooks"],
    votes: 8,
    answers: 2,
    views: 156,
    hasAcceptedAnswer: false,
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    title: "Best practices for handling errors in Node.js Express",
    content:
      "What are the best practices for error handling in Express.js applications? Should I use try-catch blocks everywhere?",
    author: {
      name: "Alex Rivera",
      avatar: "",
      reputation: 2100,
    },
    tags: ["nodejs", "express", "error-handling"],
    votes: 22,
    answers: 5,
    views: 445,
    hasAcceptedAnswer: true,
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    title: "TypeScript generic constraints not working",
    content:
      "I'm trying to create a generic function with constraints but TypeScript is throwing errors. How can I fix this?",
    author: {
      name: "Emma Davis",
      avatar: "",
      reputation: 675,
    },
    tags: ["typescript", "generics"],
    votes: 5,
    answers: 1,
    views: 89,
    hasAcceptedAnswer: false,
    createdAt: "2024-01-12T16:45:00Z",
  },
]

export function QuestionList({ questions: propQuestions, isLoading }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>(propQuestions || mockQuestions)

  useEffect(() => {
    if (propQuestions) {
      setQuestions(propQuestions)
    }
  }, [propQuestions])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link
                  href={`/questions/${question.id}`}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 line-clamp-2"
                >
                  {question.title}
                </Link>
                <p className="text-gray-600 mt-2 line-clamp-2">{question.content}</p>
              </div>
              {question.hasAcceptedAnswer && (
                <div className="flex items-center gap-1 text-green-600 ml-4">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Solved</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Stats and Author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{question.votes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{question.answers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{question.views}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{question.createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
                    <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">{question.author.name}</div>
                    <div className="text-gray-500">{question.author.reputation} rep</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
