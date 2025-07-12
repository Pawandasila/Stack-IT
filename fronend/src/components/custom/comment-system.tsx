"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Reply, MoreHorizontal } from "lucide-react"
import { MentionInput } from "./mention-input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    username: string
    avatar: string
    reputation: number
  }
  votes: number
  userVote?: "up" | "down" | null
  createdAt: string
  replies?: Comment[]
  mentions?: string[]
}

interface CommentSystemProps {
  questionId?: string
  answerId?: string
  comments: Comment[]
  onAddComment: (content: string, parentId?: string, mentions?: string[]) => void
  onVoteComment: (commentId: string, voteType: "up" | "down") => void
}

export function CommentSystem({ questionId, answerId, comments, onAddComment, onVoteComment }: CommentSystemProps) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState("")

  const handleSubmitComment = (parentId?: string) => {
    if (!commentContent.trim()) return

    // Extract mentions from content
    const mentionMatches = commentContent.match(/@(\w+)/g)
    const mentions = mentionMatches?.map((match) => match.substring(1)) || []

    onAddComment(commentContent, parentId, mentions)
    setCommentContent("")
    setShowCommentForm(false)
    setReplyingTo(null)
  }

  const handleMention = (mentionedUsers: any[]) => {
    // This would trigger notifications to mentioned users
    console.log("Users mentioned:", mentionedUsers)
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}`}>
      <div className="flex items-start gap-3 py-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-gray-500">@{comment.author.username}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{comment.createdAt}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{comment.author.reputation} rep</span>
          </div>

          <div className="text-sm text-gray-700 mb-2">{comment.content}</div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 ${comment.userVote === "up" ? "text-green-600" : "text-gray-500"}`}
                onClick={() => onVoteComment(comment.id, "up")}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <span className="text-xs text-gray-600">{comment.votes}</span>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 ${comment.userVote === "down" ? "text-red-600" : "text-gray-500"}`}
                onClick={() => onVoteComment(comment.id, "down")}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-500">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Report</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-11 mt-2">
          <MentionInput
            value={commentContent}
            onChange={setCommentContent}
            placeholder={`Reply to @${comment.author.username}...`}
            className="min-h-[80px]"
            onMention={handleMention}
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => handleSubmitComment(comment.id)} disabled={!commentContent.trim()}>
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingTo(null)
                setCommentContent("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Comments ({comments.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setShowCommentForm(!showCommentForm)}>
          Add Comment
        </Button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <MentionInput
            value={commentContent}
            onChange={setCommentContent}
            placeholder="Write a comment... Use @username to mention someone"
            className="min-h-[100px]"
            onMention={handleMention}
          />
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => handleSubmitComment()} disabled={!commentContent.trim()}>
              Post Comment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCommentForm(false)
                setCommentContent("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-1">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {comments.length === 0 && !showCommentForm && (
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}
