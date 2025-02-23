"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import Footer from "@/components/Footer"

const multipleChoiceQuestions = [
  {
    id: 1,
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Mercury", "Earth", "Mars"],
    answer: "Mercury",
  },
  {
    id: 2,
    question: "Which data structure organizes items in a First-In, First-Out (FIFO) manner?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    answer: "Queue",
  },
  {
    id: 3,
    question: "Which of the following is primarily used for structuring web pages?",
    options: ["Python", "Java", "HTML", "C++"],
    answer: "HTML",
  },
  {
    id: 4,
    question: "Which chemical symbol stands for Gold?",
    options: ["Au", "Gd", "Ag", "Pt"],
    answer: "Au",
  },
  {
    id: 5,
    question: "Which of these processes is not typically involved in refining petroleum?",
    options: ["Fractional distillation", "Cracking", "Polymerization", "Filtration"],
    answer: "Filtration",
  },
]

const integerQuestions = [
  {
    id: 6,
    question: "What is the value of 12 + 28?",
    answer: 40,
  },
  {
    id: 7,
    question: "How many states are there in the United States?",
    answer: 50,
  },
  {
    id: 8,
    question: "In which year was the Declaration of Independence signed?",
    answer: 1776,
  },
  {
    id: 9,
    question: "What is the value of pi rounded to the nearest integer?",
    answer: 3,
  },
  {
    id: 10,
    question: "If a car travels at 60 mph for 2 hours, how many miles does it travel?",
    answer: 120,
  },
]

export default function QuizPage() {
  const router = useRouter()
  const { id } = useParams()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [quizEnded, setQuizEnded] = useState(false)
  const [userAnswers, setUserAnswers] = useState([])
  const [instructionsRead, setInstructionsRead] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)

  const { toast, showToast } = useToast()

  const allQuestions = id === "1" ? multipleChoiceQuestions : integerQuestions
  const currentQuestion = allQuestions[currentQuestionIndex]

  const saveQuizResult = useCallback(async () => {
    const result = {
      quizId: id,
      quizType: id === "1" ? "Multiple Choice Quiz" : "Integer Type Quiz",
      score: score,
      totalQuestions: allQuestions.length,
      date: new Date().toISOString(),
      userAnswers: userAnswers,
    };
  
    if ("indexedDB" in window) {
      try {
        const db = await openDatabase(); // Now correctly typed as IDBDatabase
        const transaction = db.transaction(["quizResults"], "readwrite");
        const store = transaction.objectStore("quizResults");
        store.add(result);
      } catch (error) {
        console.error("Failed to save quiz result:", error);
      }
    }
  
    router.push(`/scoreboard?score=${score}&total=${allQuestions.length}&quizId=${id}`);
  }, [id, score, allQuestions.length, userAnswers, router]);
  

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer("")
      setTimeLeft(30)
    } else {
      setQuizEnded(true)
      saveQuizResult()
    }
  }, [allQuestions.length, currentQuestionIndex, saveQuizResult])

  useEffect(() => {
    if (quizStarted) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 1) {
            handleNextQuestion()
            return 30
          }
          return prevTime - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quizStarted, handleNextQuestion])

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) {
      showToast({
        title: "Please select an answer",
        description: "You must choose an option or input an answer before submitting.",
        variant: "destructive",
      })
      return
    }

    const isCorrect = currentQuestion.options
      ? selectedAnswer === currentQuestion.answer
      : Number.parseInt(selectedAnswer) === currentQuestion.answer

    if (isCorrect) {
      setScore(score + 1)
    }

    setUserAnswers([
      ...userAnswers,
      {
        question: currentQuestion.question,
        userAnswer: selectedAnswer,
        correctAnswer: currentQuestion.answer,
        isCorrect,
      },
    ])

    handleNextQuestion()
  }



  if (quizEnded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz ended</h2>
          <p className="text-lg mb-4">Redirecting to scoreboard...</p>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-card rounded-2xl">
          <CardHeader>
            <CardTitle>Quiz Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>For multiple-choice questions, select the one best answer (A, B, C, or D).</li>
              <li>For integer-type questions, write your numerical answer clearly.</li>
              <li>No calculators unless specified.</li>
              <li>You have 30 seconds for each question.</li>
            </ol>
            <div className="flex items-center space-x-2">
              <Checkbox id="instructions" checked={instructionsRead} onCheckedChange={setInstructionsRead} />
              <label
                htmlFor="instructions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and understood the instructions
              </label>
            </div>
            <Button onClick={() => setQuizStarted(true)} disabled={!instructionsRead} className="w-full">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-card rounded-2xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>
            Question {currentQuestionIndex + 1} of {allQuestions.length}
          </CardTitle>
          <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center text-xl font-bold">
            {timeLeft}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <h2 className="text-xl mb-6 text-center">{currentQuestion.question}</h2>
          {currentQuestion.options ? (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-4 w-full max-w-md">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-4 rounded-lg border border-muted hover:bg-accent transition-colors"
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Input
              type="number"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="text-lg p-4 w-full max-w-md"
            />
          )}
          <Button onClick={handleAnswerSubmit} className="mt-6 w-full max-w-md text-lg py-6">
            Submit Answer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("QuizDatabase", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore("quizResults", { autoIncrement: true })
    }
  })
}

