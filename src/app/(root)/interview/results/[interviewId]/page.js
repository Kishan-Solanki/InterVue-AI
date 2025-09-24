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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading interview results...</p>
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Interview not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const scoreColor =
    interview.feedback?.totalScore >= 80
      ? "text-green-600"
      : interview.feedback?.totalScore >= 60
        ? "text-yellow-600"
        : "text-red-600"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Results</h1>
            <p className="text-gray-600">
              {interview.role} • {interview.level} • {interview.type}
            </p>
            <div className={`text-6xl font-bold ${scoreColor} mt-4`}>{interview.feedback?.totalScore || 0}/100</div>
          </div>

          {/* Feedback */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Overall Assessment</h2>
              {interview.feedback?.finalAssessment ? (
                <p className="text-gray-700 leading-relaxed">{interview.feedback.finalAssessment}</p>
              ) : (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Assessment is being generated. Please refresh the page in a few moments.</span>
                </div>
              )}
            </div>

            {/* Strengths */}
            {interview.feedback?.strengths?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Strengths</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {interview.feedback.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {interview.feedback?.improvements?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Areas for Improvement</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {interview.feedback.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {interview.feedback?.recommendations?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Recommendations</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {interview.feedback.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Q&A Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Your Answers</h2>
              <div className="space-y-4">
                {interview.question_answers?.length > 0 ? (
                  interview.question_answers.map((qa, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Q{index + 1}: {qa.question}
                      </h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{qa.answer || "No answer provided"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No questions and answers recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Refresh Results
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
