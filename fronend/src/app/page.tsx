'use client'
import { Suspense, useState } from "react"
import { QuestionList } from "@/components/custom/question-list"
import { SearchAndFilter } from "@/components/custom/search-and-filter"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/context/Auth-context"

export default function HomePage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { userInfo } = useAuth()

  const handleFiltersChange = (filteredQuestions: any[]) => {
    setQuestions(filteredQuestions)
  }

  const handleAskQuestion = () => {
    if (!userInfo) {
      // Redirect to login with return URL
      window.location.href = '/login?from=/ask'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Questions</h1>
            <p className="text-gray-600 mt-2">Ask questions, get answers, share knowledge</p>
          </div>
          {userInfo ? (
            <Link href="/ask">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ask Question
              </Button>
            </Link>
          ) : (
            <Button 
              className="flex items-center gap-2"
              onClick={handleAskQuestion}
            >
              <Plus className="w-4 h-4" />
              Ask Question
            </Button>
          )}
        </div>

      <SearchAndFilter onFiltersChange={handleFiltersChange} />

      <Suspense fallback={<div>Loading questions...</div>}>
        <QuestionList questions={questions.length > 0 ? questions : undefined} isLoading={isLoading} />
      </Suspense>
    </div>
  )
}
