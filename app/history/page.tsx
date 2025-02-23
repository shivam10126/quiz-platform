"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface QuizResult {
  quizId: string
  quizType: string
  score: number
  totalQuestions: number
  date: string
  userAnswers: Array<{
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
}

export default function HistoryPage() {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])

  useEffect(() => {
    const fetchQuizResults = async () => {
      if ("indexedDB" in window) {
        const db = await openDatabase()
        const transaction = db.transaction(["quizResults"], "readonly")
        const store = transaction.objectStore("quizResults")
        const request = store.getAll()

        request.onsuccess = () => {
          setQuizResults(request.result)
        }
      }
    }

    fetchQuizResults()
  }, [])

  const quizTypes = [...new Set(quizResults.map((result) => result.quizType))]
  const chartData = quizTypes.map((quizType) => {
    const typeResults = quizResults.filter((result) => result.quizType === quizType)
    return {
      name: quizType,
      data: typeResults.map((result, index) => ({
        attempt: index + 1,
        score: (result.score / result.totalQuestions) * 100,
      })),
    }
  })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-8">Quiz History</h1>
      <Card className="shadow-card rounded-2xl">
        <CardHeader>
          <CardTitle>Score Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempt" type="number" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartData.map((quizType, index) => (
                <Line
                  key={quizType.name}
                  type="monotone"
                  data={quizType.data}
                  dataKey="score"
                  name={quizType.name}
                  stroke={`hsl(${index * 60}, 70%, 50%)`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {quizResults.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-4">
          {quizResults.map((result, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="bg-card hover:bg-accent rounded-lg p-4">
                <div className="flex justify-between items-center w-full">
                  <span>{result.quizType}</span>
                  <span>
                    Score: {result.score}/{result.totalQuestions}
                  </span>
                  <span>{new Date(result.date).toLocaleDateString()}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-background p-4 rounded-lg mt-2">
                <h3 className="font-semibold mb-2">Questions and Answers:</h3>
                <ul className="space-y-2">
                  {result.userAnswers.map((answer, answerIndex) => (
                    <li
                      key={answerIndex}
                      className={`p-2 rounded ${answer.isCorrect ? "bg-success/10" : "bg-destructive/10"}`}
                    >
                      <p className="font-medium">{answer.question}</p>
                      <p>Your answer: {answer.userAnswer}</p>
                      <p>{answer.isCorrect ? "Correct" : "Incorrect"}</p>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-muted-foreground">No quiz history available.</p>
      )}
      <div className="mt-8">
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}

async function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("QuizDatabase", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore("quizResults", { autoIncrement: true })
    }
  })
}

