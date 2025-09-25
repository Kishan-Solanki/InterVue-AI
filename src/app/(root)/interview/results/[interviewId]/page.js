"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"

export default function InterviewResultsById({ params }) {
  const router = useRouter()
  const { interviewId } = use(params) || {} // ✅ unwrap params safely

  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchInterview = async () => {
      if (!interviewId) {
        setError("Missing interview id")
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/interview/get-interview?id=${interviewId}`)
        if (!res.ok) throw new Error("Failed to fetch interview")
        const data = await res.json()
        setInterview(data.interview)
      } catch (e) {
        console.error(e)
        setError("Failed to load interview results")
      } finally {
        setLoading(false)
      }
    }

    fetchInterview()
  }, [interviewId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading interview results...</p>
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">{error || "Interview not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const scoreColor =
    interview.feedback?.totalScore >= 80
      ? "text-green-500"
      : interview.feedback?.totalScore >= 60
        ? "text-yellow-500"
        : "text-destructive"

  return (
    <main className="min-h-screen bg-background text-foreground py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card rounded-xl shadow-lg p-8 md:p-10">
          {/* Header */}
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Interview Results</h1>
            <p className="text-muted-foreground text-lg">
              {interview.role} • {interview.level} • {interview.type}
            </p>
            <div className={`text-7xl font-extrabold ${scoreColor} mt-6`}>
              {interview.feedback?.totalScore || 0}/100
            </div>
          </header>

          {/* Feedback Sections */}
          <section className="space-y-8">
            {/* Overall Assessment */}
            <div className="bg-muted/20 p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Overall Assessment</h2>
              {interview.feedback?.finalAssessment ? (
                <p className="text-muted-foreground leading-relaxed">{interview.feedback.finalAssessment}</p>
              ) : (
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span>Assessment is being generated. Please refresh the page in a few moments.</span>
                </div>
              )}
            </div>

            {/* Strengths */}
            {interview.feedback?.strengths?.length > 0 && (
              <div className="bg-muted/20 p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Strengths</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  {interview.feedback.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {interview.feedback?.improvements?.length > 0 && (
              <div className="bg-muted/20 p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Areas for Improvement</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  {interview.feedback.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {interview.feedback?.recommendations?.length > 0 && (
              <div className="bg-muted/20 p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Recommendations</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  {interview.feedback.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Q&A Section */}
            <div className="bg-muted/20 p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Your Answers</h2>
              <div className="space-y-6">
                {interview.question_answers?.length > 0 ? (
                  interview.question_answers.map((qa, index) => (
                    <div key={index} className="border-l-4 border-accent pl-4 py-2">
                      <h3 className="font-semibold text-foreground mb-2 text-lg">
                        Q{index + 1}: {qa.question}
                      </h3>
                      <p className="text-muted-foreground bg-muted p-3 rounded-md">
                        {qa.answer || "No answer provided"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">No questions and answers recorded yet.</p>
                )}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-12">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Refresh Results
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
