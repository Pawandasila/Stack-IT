"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/custom/rich-text-editor"
import { TagSelector } from "@/components/custom/tag-selector"
import { HelpCircle } from "lucide-react"

export function QuestionForm() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Question submitted:", { title, content, tags: selectedTags, type: "question" })
    setIsSubmitting(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Question Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., How to implement authentication in Next.js?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Be specific and imagine you're asking a question to another person
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Description *</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Provide details about your question. Include what you've tried and what specific help you need..."
                />
                <p className="text-sm text-gray-500">
                  Include all the information someone would need to answer your question
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags *</Label>
                <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
                <p className="text-sm text-gray-500">Add up to 5 tags to describe what your question is about</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!title || !content || selectedTags.length === 0 || isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? "Publishing..." : "Publish Question"}
            </Button>
            <Button type="button" variant="outline">
              Save Draft
            </Button>
          </div>
        </form>
      </div>

      {/* Sidebar with tips */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Writing Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Good titles are:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Specific and descriptive</li>
                <li>• Clear and concise</li>
                <li>• Free of spelling errors</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Good descriptions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Explain the problem clearly</li>
                <li>• Show what you've tried</li>
                <li>• Include relevant code/examples</li>
                <li>• Specify your environment</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
