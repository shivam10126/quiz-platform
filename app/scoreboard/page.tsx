"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

export default function ScoreboardPage() {
  const searchParams = useSearchParams()
  const score = searchParams.get("score")
  const total = searchParams.get("total")
  const quizId = searchParams.get("quizId")

  const percentage = score && total ? ((Number.parseInt(score) / Number.parseInt(total)) * 100).toFixed(2) : "0.00"

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Quiz {quizId} Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary mb-2">
              {score} / {total}
            </p>
            <p className="text-xl text-muted-foreground">Your Score: {percentage}%</p>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Question Summary:</h3>
            <div className="space-y-2">
              {score &&
                total &&
                [...Array(Number.parseInt(total))].map((_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {index < Number.parseInt(score) ? (
                      <CheckCircle className="text-success" />
                    ) : (
                      <XCircle className="text-destructive" />
                    )}
                    <span>Question {index + 1}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Link href={`/quiz/${quizId}`}>
              <Button variant="outline">Retake Quiz</Button>
            </Link>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

