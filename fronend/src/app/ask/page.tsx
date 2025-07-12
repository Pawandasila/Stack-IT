"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, HelpCircle, BarChart3 } from "lucide-react"
import Link from "next/link"
import { QuestionForm } from "@/components/custom/question-form"
import { PollForm } from "@/components/custom/poll-form"

export default function AskPage() {
  const [activeTab, setActiveTab] = useState("question")

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Ask the Community</h1>
        <p className="text-gray-600 mt-2">Get help from the community by asking a question or creating a poll</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="question" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Ask Question
          </TabsTrigger>
          <TabsTrigger value="poll" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Create Poll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="question">
          <QuestionForm />
        </TabsContent>

        <TabsContent value="poll">
          <PollForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
