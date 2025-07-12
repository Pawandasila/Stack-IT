"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Eye, Clock, Check, Bookmark, Share2, Flag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RichTextEditor } from "@/components/custom/rich-text-editor"
import { CommentSystem } from "@/components/custom/comment-system"

// Mock data
const mockQuestion = {
  id: "1",
  title: "How to implement authentication in Next.js 14 with App Router?",
  content: `I'm trying to set up authentication in my Next.js 14 application using the new App Router. What are the best practices and recommended libraries?

Here's what I've tried so far:

\`\`\`javascript
// app/api/auth/route.js
export async function POST(request) {
  // My current implementation
}
\`\`\`

I'm specifically looking for:
1. Session management
2. Route protection
3. Integration with databases
4. Best security practices

Any help would be appreciated!`,
  author: {
    id: "2",
    name: "Sarah Johnson",
    username: "sarah_j",
    avatar: "/placeholder-user.jpg",
    reputation: 1250,
  },
  tags: ["Next.js", "Authentication", "React", "TypeScript"],
  votes: 15,
  userVote: null as "up" | "down" | null,
  views: 234,
  answers: 3,
  hasAcceptedAnswer: true,
  createdAt: "2 hours ago",
  isBookmarked: false,
}

const mockAnswers = [
  {
    id: "1",
    content: `For Next.js 14 with App Router, I recommend using **NextAuth.js** (now Auth.js). It provides excellent integration with the new app directory structure and supports multiple authentication providers.

Here's a basic setup:

\`\`\`javascript
// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
})

export { GET }
\`\`\`

This approach handles session management automatically and provides built-in CSRF protection.`,
    author: {
      id: "1",
      name: "John Doe",
      username: "john_doe",
      avatar: "/placeholder-user.jpg",
      reputation: 2100,
    },
    votes: 12,
    userVote: null as "up" | "down" | null,
    isAccepted: true,
    acceptedAt: "1 hour ago",
    createdAt: "1 hour ago",
  },
  {
    id: "2",
    content: `You can also consider using **Supabase Auth** which integrates well with Next.js and provides a complete authentication solution with built-in database integration.

\`\`\`javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default supabase
\`\`\`

The advantage is that it handles both authentication and database operations seamlessly.`,
    author: {
      id: "3",
      name: "Mike Chen",
      username: "mike_chen",
      avatar: "/placeholder-user.jpg",
      reputation: 890,
    },
    votes: 5,
    userVote: null as "up" | "down" | null,
    isAccepted: false,
    createdAt: "3 hours ago",
  },
]

const mockComments = [
  {
    id: "1",
    content: "Great question! I was wondering about this too. @john_doe your answer is very helpful!",
    author: {
      id: "4",
      name: "Alex Rodriguez",
      username: "alex_r",
      avatar: "/placeholder-user.jpg",
      reputation: 450,
    },
    votes: 2,
    userVote: null as "up" | "down" | null,
    createdAt: "30 minutes ago",
    mentions: ["john_doe"],
  },
]

const relatedQuestions = [
  {
    id: "2",
    title: "NextAuth.js vs Supabase Auth comparison",
    votes: 8,
    answers: 4,
  },
  {
    id: "3",
    title: "How to protect API routes in Next.js 14?",
    votes: 12,
    answers: 2,
  },
  {
    id: "4",
    title: "Session management best practices",
    votes: 6,
    answers: 3,
  },
]

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  const [question, setQuestion] = useState(mockQuestion)
  const [answers, setAnswers] = useState(mockAnswers)
  const [comments, setComments] = useState(mockComments)
  const [newAnswer, setNewAnswer] = useState("")
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)

  const handleVoteQuestion = (voteType: "up" | "down") => {
    setQuestion((prev) => ({
      ...prev,
      votes:
        prev.userVote === voteType
          ? prev.votes - (voteType === "up" ? 1 : -1)
          : prev.userVote
            ? prev.votes + (voteType === "up" ? 2 : -2)
            : prev.votes + (voteType === "up" ? 1 : -1),
      userVote: prev.userVote === voteType ? null : voteType,
    }))
  }

  const handleVoteAnswer = (answerId: string, voteType: "up" | "down") => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.id === answerId
          ? {
              ...answer,
              votes:
                answer.userVote === voteType
                  ? answer.votes - (voteType === "up" ? 1 : -1)
                  : answer.userVote
                    ? answer.votes + (voteType === "up" ? 2 : -2)
                    : answer.votes + (voteType === "up" ? 1 : -1),
              userVote: answer.userVote === voteType ? null : voteType,
            }
          : answer,
      ),
    )
  }

  const handleAcceptAnswer = (answerId: string) => {
    setAnswers((prev) =>
      prev.map((answer) => ({
        ...answer,
        isAccepted: answer.id === answerId ? !answer.isAccepted : false,
      })),
    )
  }

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) return

    setIsSubmittingAnswer(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const answer = {
      id: Date.now().toString(),
      content: newAnswer,
      author: {
        id: "current-user",
        name: "Current User",
        username: "current_user",
        avatar: "/placeholder-user.jpg",
        reputation: 100,
      },
      votes: 0,
      userVote: null as "up" | "down" | null,
      isAccepted: false,
      createdAt: "just now",
    }

    setAnswers((prev) => [...prev, answer])
    setNewAnswer("")
    setIsSubmittingAnswer(false)
  }

  const handleAddComment = (content: string, parentId?: string, mentions?: string[]) => {
    const newComment = {
      id: Date.now().toString(),
      content,
      author: {
        id: "current-user",
        name: "Current User",
        username: "current_user",
        avatar: "/placeholder-user.jpg",
        reputation: 100,
      },
      votes: 0,
      userVote: null as "up" | "down" | null,
      createdAt: "just now",
      mentions: mentions ?? [],
    }

    setComments((prev) => [...prev, newComment])

    // Simulate sending notifications for mentions
    if (mentions && mentions.length > 0) {
      console.log("Sending notifications to:", mentions)
    }
  }

  const handleVoteComment = (commentId: string, voteType: "up" | "down") => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              votes:
                comment.userVote === voteType
                  ? comment.votes - (voteType === "up" ? 1 : -1)
                  : comment.userVote
                    ? comment.votes + (voteType === "up" ? 2 : -2)
                    : comment.votes + (voteType === "up" ? 1 : -1),
              userVote: comment.userVote === voteType ? null : voteType,
            }
          : comment,
      ),
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Question */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Asked {question.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{question.views} views</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {/* Voting */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${question.userVote === "up" ? "text-green-600 bg-green-50" : "text-gray-500"}`}
                    onClick={() => handleVoteQuestion("up")}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </Button>
                  <span className="font-medium text-lg">{question.votes}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${question.userVote === "down" ? "text-red-600 bg-red-50" : "text-gray-500"}`}
                    onClick={() => handleVoteQuestion("down")}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="prose max-w-none mb-6">
                    <div dangerouslySetInnerHTML={{ __html: question.content.replace(/\n/g, "<br>") }} />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
                        <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/users/${question.author.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {question.author.name}
                        </Link>
                        <div className="text-sm text-gray-500">{question.author.reputation} reputation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments on Question */}
          <Card>
            <CardContent className="pt-6">
              <CommentSystem
                questionId={question.id}
                comments={comments}
                onAddComment={handleAddComment}
                onVoteComment={handleVoteComment}
              />
            </CardContent>
          </Card>

          {/* Answers Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {answers.length} Answer{answers.length !== 1 ? "s" : ""}
              </h2>
            </div>

            {answers.map((answer) => (
              <Card key={answer.id} className={answer.isAccepted ? "border-green-200 bg-green-50/30" : ""}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Voting */}
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 ${answer.userVote === "up" ? "text-green-600 bg-green-50" : "text-gray-500"}`}
                        onClick={() => handleVoteAnswer(answer.id, "up")}
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </Button>
                      <span className="font-medium text-lg">{answer.votes}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 ${answer.userVote === "down" ? "text-red-600 bg-red-50" : "text-gray-500"}`}
                        onClick={() => handleVoteAnswer(answer.id, "down")}
                      >
                        <ThumbsDown className="w-5 h-5" />
                      </Button>

                      {/* Accept Answer Button (only for question author) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 mt-2 ${answer.isAccepted ? "text-green-600 bg-green-100" : "text-gray-400"}`}
                        onClick={() => handleAcceptAnswer(answer.id)}
                        title={answer.isAccepted ? "Accepted answer" : "Accept this answer"}
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1">
                      {answer.isAccepted && (
                        <div className="flex items-center gap-2 mb-4 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Accepted Answer</span>
                        </div>
                      )}

                      <div className="prose max-w-none mb-6">
                        <div dangerouslySetInnerHTML={{ __html: answer.content.replace(/\n/g, "<br>") }} />
                      </div>

                      {/* Answer Author */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={answer.author.avatar || "/placeholder.svg"} alt={answer.author.name} />
                            <AvatarFallback>{answer.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/users/${answer.author.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              {answer.author.name}
                            </Link>
                            <div className="text-sm text-gray-500">{answer.author.reputation} reputation</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">answered {answer.createdAt}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Answer Form */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Your Answer</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RichTextEditor content={newAnswer} onChange={setNewAnswer} placeholder="Write your answer here..." />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitAnswer} disabled={!newAnswer.trim() || isSubmittingAnswer}>
                    {isSubmittingAnswer ? "Posting..." : "Post Your Answer"}
                  </Button>
                  <Button variant="outline">Save Draft</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Question Stats */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Question Stats</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Asked</span>
                <span>{question.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Viewed</span>
                <span>{question.views} times</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active</span>
                <span>1 hour ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Related Questions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Related Questions</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatedQuestions.map((relatedQ) => (
                  <div key={relatedQ.id}>
                    <Link
                      href={`/questions/${relatedQ.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm line-clamp-2"
                    >
                      {relatedQ.title}
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{relatedQ.votes} votes</span>
                      <span>{relatedQ.answers} answers</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hot Network Questions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Hot Network Questions</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm line-clamp-2">
                  How to handle async operations in React components?
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm line-clamp-2">
                  Best practices for API error handling in Next.js?
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm line-clamp-2">
                  TypeScript vs JavaScript: When to use which?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
