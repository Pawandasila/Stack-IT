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
      setSelectedTags(prev => [...prev, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter((t) => t !== tag))
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
        },{
    id: "5",
    title: "React useEffect cleanup function not being called on unmount",
    content: "My useEffect cleanup function isn't executing when the component unmounts. The API calls are still running in the background causing memory leaks. What am I missing?",
    author: {
      name: "Alex Chen",
      avatar: "",
      reputation: 1243,
    },
    tags: ["react", "hooks", "memory-leaks"],
    votes: 12,
    answers: 3,
    views: 156,
    hasAcceptedAnswer: true,
    createdAt: "2024-01-12T18:22:00Z",
  },
  {
    id: "6",
    title: "CSS Grid item won't span full width despite grid-column: 1 / -1",
    content: "I'm trying to make a grid item span the full width of its container but it's not working. I've used grid-column: 1 / -1 but the item is still constrained. Help!",
    author: {
      name: "Sarah Mitchell",
      avatar: "",
      reputation: 892,
    },
    tags: ["css", "css-grid", "layout"],
    votes: 8,
    answers: 2,
    views: 203,
    hasAcceptedAnswer: false,
    createdAt: "2024-01-12T14:15:00Z",
  },
  {
    id: "7",
    title: "Python asyncio gathering tasks with different return types",
    content: "How can I use asyncio.gather() with functions that return different types? I need to handle both string and dict returns from my async functions.",
    author: {
      name: "Michael Rodriguez",
      avatar: "",
      reputation: 2156,
    },
    tags: ["python", "asyncio", "async-await"],
    votes: 15,
    answers: 4,
    views: 334,
    hasAcceptedAnswer: true,
    createdAt: "2024-01-12T11:30:00Z",
  },
  {
    id: "8",
    title: "Docker container can't connect to PostgreSQL on host machine",
    content: "My Docker container cannot connect to PostgreSQL running on the host. I've tried localhost, 127.0.0.1, and host.docker.internal but none work. Connection refused error.",
    author: {
      name: "Jennifer Park",
      avatar: "",
      reputation: 445,
    },
    tags: ["docker", "postgresql", "networking"],
    votes: 6,
    answers: 1,
    views: 78,
    hasAcceptedAnswer: false,
    createdAt: "2024-01-12T20:45:00Z",
  },
  {
    id: "9",
    title: "Git merge conflict in binary files - how to resolve?",
    content: "I have merge conflicts in binary files (images, PDFs) and git is showing 'binary files differ'. How do I resolve these conflicts and choose which version to keep?",
    author: {
      name: "David Thompson",
      avatar: "",
      reputation: 1567,
    },
    tags: ["git", "merge-conflict", "binary-files"],
    votes: 9,
    answers: 2,
    views: 145,
    hasAcceptedAnswer: true,
    createdAt: "2024-01-12T13:20:00Z",
  },
  {
    id: "10",
    title: "Vue 3 Composition API reactive object losing reactivity after destructuring",
    content: "When I destructure a reactive object in Vue 3 Composition API, the destructured properties lose reactivity. How can I maintain reactivity while destructuring?",
    author: {
      name: "Lisa Wang",
      avatar: "",
      reputation: 723,
    },
    tags: ["vue.js", "composition-api", "reactivity"],
    votes: 11,
    answers: 3,
    views: 267,
    hasAcceptedAnswer: false,
    createdAt: "2024-01-12T16:10:00Z",
  },
  {
    id: "11",
    title: "Node.js stream pipe not working with custom transform stream",
    content: "I created a custom transform stream but when I pipe it with other streams, data isn't flowing through. The _transform method seems to be called but nothing outputs.",
    author: {
      name: "Kevin O'Connor",
      avatar: "",
      reputation: 1089,
    },
    tags: ["node.js", "streams", "transform"],
    votes: 7,
    answers: 1,
    views: 92,
    hasAcceptedAnswer: false,
    createdAt: "2024-01-12T19:35:00Z",
  },
  {
    id: "12",
    title: "MongoDB aggregation pipeline $lookup with nested array not matching",
    content: "My $lookup stage isn't matching documents when the foreign field is inside a nested array. The join works fine for top-level fields but fails for nested structures.",
    author: {
      name: "Amanda Foster",
      avatar: "",
      reputation: 934,
    },
    tags: ["mongodb", "aggregation", "lookup"],
    votes: 13,
    answers: 2,
    views: 178,
    hasAcceptedAnswer: true,
    createdAt: "2024-01-12T12:45:00Z",
  },
  {
    id: "13",
    title: "Webpack 5 Module Federation shared dependencies causing runtime errors",
    content: "After setting up Module Federation, shared dependencies are causing runtime errors. Different versions of React are being loaded causing 'Multiple copies of React' error.",
    author: {
      name: "Robert Kim",
      avatar: "",
      reputation: 1445,
    },
    tags: ["webpack", "module-federation", "react"],
    votes: 14,
    answers: 3,
    views: 298,
    hasAcceptedAnswer: false,
    createdAt: "2024-01-12T15:50:00Z",
  },
  {
    id: "14",
    title: "Swift optional chaining with nil-coalescing operator precedence issue",
    content: "I'm having trouble with operator precedence when combining optional chaining and nil-coalescing. The expression evaluates differently than expected. What's the correct syntax?",
    author: {
      name: "Rachel Green",
      avatar: "",
      reputation: 612,
    },
    tags: ["swift", "optional-chaining", "operators"],
    votes: 10,
    answers: 2,
    views: 134,
    hasAcceptedAnswer: true,
    createdAt: "2024-01-12T17:25:00Z",
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTags([])}
              className="text-xs text-gray-500 hover:text-red-500 h-auto p-1"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1 py-1">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="ml-1 hover:bg-red-100 hover:text-red-600 rounded-full p-1 transition-all duration-200 flex items-center justify-center"
                  aria-label={`Remove ${tag} filter`}
                  title={`Remove ${tag} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}