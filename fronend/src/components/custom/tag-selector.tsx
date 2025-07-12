"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
}

const popularTags = [
  "React",
  "JavaScript",
  "TypeScript",
  "Next.js",
  "Node.js",
  "Python",
  "CSS",
  "HTML",
  "API",
  "Database",
  "Authentication",
  "Redux",
  "Tailwind",
  "MongoDB",
  "PostgreSQL",
  "Express",
]

export function TagSelector({ selectedTags, onTagsChange, maxTags = 5 }: TagSelectorProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, trimmedTag])
      setInputValue("")
      setSuggestions([])
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove))
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (value.trim()) {
      const filtered = popularTags
        .filter((tag) => tag.toLowerCase().includes(value.toLowerCase()) && !selectedTags.includes(tag))
        .slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedTags.length < maxTags ? "Add tags (press Enter or comma to add)" : `Maximum ${maxTags} tags allowed`
          }
          disabled={selectedTags.length >= maxTags}
        />

        {inputValue && (
          <Button
            type="button"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2"
            onClick={() => addTag(inputValue)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <Button key={tag} type="button" variant="outline" size="sm" onClick={() => addTag(tag)} className="text-xs">
              + {tag}
            </Button>
          ))}
        </div>
      )}

      {/* Popular Tags */}
      {!inputValue && selectedTags.length < maxTags && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Popular tags:</p>
          <div className="flex flex-wrap gap-2">
            {popularTags
              .filter((tag) => !selectedTags.includes(tag))
              .slice(0, 8)
              .map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  className="text-xs"
                >
                  + {tag}
                </Button>
              ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {selectedTags.length}/{maxTags} tags selected
      </p>
    </div>
  )
}
