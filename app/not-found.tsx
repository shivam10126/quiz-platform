import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="text-center space-y-6">
      <AlertTriangle className="mx-auto h-24 w-24 text-destructive" />
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-muted-foreground text-lg">Sorry, the page you are looking for does not exist.</p>
      <Link href="/">
        <Button size="lg">Go back to Home</Button>
      </Link>
    </div>
  )
}

