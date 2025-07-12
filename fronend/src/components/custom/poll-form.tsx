"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/custom/rich-text-editor"
import { TagSelector } from "@/components/custom/tag-selector"
import { BarChart3, Plus, X, Calendar } from "lucide-react"

interface PollOption {
  id: string
  text: string
}

export function PollForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [showResults, setShowResults] = useState(true)
  const [hasExpiration, setHasExpiration] = useState(false)
  const [expirationDate, setExpirationDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { id: Date.now().toString(), text: "" }])
    }
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((option) => option.id !== id))
    }
  }

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((option) => (option.id === id ? { ...option, text } : option)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const pollData = {
      title,
      description,
      options: options.filter((opt) => opt.text.trim()),
      tags: selectedTags,
      type: "poll",
      settings: {
        allowMultiple,
        showResults,
        expiresAt: hasExpiration ? expirationDate : null,
      },
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Poll submitted:", pollData)
    setIsSubmitting(false)
  }

  const validOptions = options.filter((opt) => opt.text.trim()).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Poll Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="poll-title">Poll Title *</Label>
                <Input
                  id="poll-title"
                  placeholder="e.g., What's your favorite JavaScript framework?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="poll-description">Description (Optional)</Label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Provide additional context for your poll..."
                />
              </div>

              {/* Poll Options */}
              <div className="space-y-2">
                <Label>Poll Options *</Label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        required
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(option.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </Button>
                )}
                <p className="text-sm text-gray-500">Add 2-10 options for your poll</p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags *</Label>
                <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
              </div>
            </CardContent>
          </Card>

          {/* Poll Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow multiple choices</Label>
                  <p className="text-sm text-gray-500">Users can select more than one option</p>
                </div>
                <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show results before voting</Label>
                  <p className="text-sm text-gray-500">Display current results to users</p>
                </div>
                <Switch checked={showResults} onCheckedChange={setShowResults} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="expiration"
                    checked={hasExpiration}
                    onCheckedChange={(checked) => setHasExpiration(checked === true)}
                  />
                  <Label htmlFor="expiration">Set expiration date</Label>
                </div>

                {hasExpiration && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <Input
                      type="datetime-local"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!title || validOptions < 2 || selectedTags.length === 0 || isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? "Creating Poll..." : "Create Poll"}
            </Button>
            <Button type="button" variant="outline">
              Save Draft
            </Button>
          </div>
        </form>
      </div>

      {/* Sidebar with preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Poll Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {title ? (
              <div className="space-y-4">
                <h3 className="font-medium">{title}</h3>
                {description && (
                  <div
                    className="text-sm text-gray-600"
                    dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, "<br>") }}
                  />
                )}
                <div className="space-y-2">
                  {options
                    .filter((opt) => opt.text.trim())
                    .map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
                        <input
                          type={allowMultiple ? "checkbox" : "radio"}
                          name="poll-preview"
                          disabled
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option.text}</span>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500">
                  {allowMultiple ? "Multiple choices allowed" : "Single choice only"}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Enter a title to see preview</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Poll Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Good polls have:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Clear, unbiased questions</li>
                <li>• Comprehensive options</li>
                <li>• Relevant context</li>
                <li>• Appropriate tags</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
