import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const quizzes = [
  {
    id: 1,
    title: "Multiple Choice Quiz",
    questions: multipleChoiceQuestions,
  },
  {
    id: 2,
    title: "Integer Type Quiz",
    questions: integerQuestions,
  },
]

export default function Home() {
  // This function would normally fetch data from IndexedDB
  // For demonstration, we'll use placeholder data
  const getUserStats = () => {
    return {
      totalAttempts: 24,
      highestScore: { score: 95, quizName: "Multiple Choice Quiz" },
    }
  }

  const userStats = getUserStats()

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Interactive Quiz Platform</h1>
        <p className="text-muted-foreground text-lg mb-8">Test your knowledge with our exciting quizzes!</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="shadow-card rounded-2xl">
            <CardHeader>
              <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Number of questions: {quiz.questions.length}</p>
              <p>Total time: {quiz.questions.length * 30} seconds</p>
              <p>Negative marking: No</p>
              <Link href={`/quiz/${quiz.id}`}>
                <Button className="w-full">Start Quiz</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-center">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-center text-primary">{userStats.totalAttempts}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-center">Highest Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-success">{userStats.highestScore.score}%</p>
              <p className="text-sm text-muted-foreground">{userStats.highestScore.quizName}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

