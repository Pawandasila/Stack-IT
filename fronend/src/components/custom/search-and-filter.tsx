"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from 'lucide-react'

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
]

interface SearchAndFilterProps {
  onFiltersChange?: (questions: any[]) => void
}

export function SearchAndFilter({ onFiltersChange }: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [isLoading, setIsLoading] = useState(false)

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const handleFilterChange = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Mock questions data for filtering
      const mockQuestions = [
        {
          id: "1",
          title: "How to center a div with CSS Flexbox?",
          content: "I'm trying to center a div both horizontally and vertically using CSS Flexbox. I've tried several approaches but nothing seems to work properly...",
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
          content: "I have a useEffect hook that should trigger when my state changes, but it's not working as expected. Here's my code...",
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
          content: "What are the best practices for error handling in Express.js applications? Should I use try-catch blocks everywhere?",
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
          content: "I'm trying to create a generic function with constraints but TypeScript is throwing errors. How can I fix this?",
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
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Filter questions based on search and tags (mock filtering)
      let filteredQuestions = mockQuestions;

      if (searchQuery) {
        filteredQuestions = filteredQuestions.filter(q =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedTags.length > 0) {
        filteredQuestions = filteredQuestions.filter(q =>
          selectedTags.some(tag => q.tags.includes(tag.toLowerCase()))
        );
      }

      // Sort questions
      if (sortBy === 'newest') {
        filteredQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === 'votes') {
        filteredQuestions.sort((a, b) => b.votes - a.votes);
      } else if (sortBy === 'answers') {
        filteredQuestions.sort((a, b) => b.answers - a.answers);
      }

      onFiltersChange?.(filteredQuestions);
    } catch (error) {
      console.error('Failed to filter questions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedTags, sortBy, onFiltersChange])

  useEffect(() => {
    // Only trigger filtering if there's actual search input or filters applied
    if (searchQuery || selectedTags.length > 0 || sortBy !== 'newest') {
      const debounceTimer = setTimeout(() => {
        handleFilterChange()
      }, 300)
      
      return () => clearTimeout(debounceTimer)
    }
  }, [handleFilterChange, searchQuery, selectedTags, sortBy])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search questions by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="most-votes">Most Votes</SelectItem>
            <SelectItem value="most-answers">Most Answers</SelectItem>
            <SelectItem value="unanswered">Unanswered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Popular Tags */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => (selectedTags.includes(tag) ? removeTag(tag) : addTag(tag))}
              className="text-xs"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
