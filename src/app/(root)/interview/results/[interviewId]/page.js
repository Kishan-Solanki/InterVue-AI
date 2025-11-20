"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, TrendingUp, Lightbulb, MessageSquare, RefreshCw, LayoutDashboard, Play } from "lucide-react"

export default function InterviewResultsById({ params }) {
  const router = useRouter()
  const { interviewId } = use(params) ?? {}

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
        const res = await fetch(`/api/interview/get-interview?id=${encodeURIComponent(interviewId)}`)
        if (!res.ok) {
          const errorPayload = await res.json().catch(() => ({}))
          throw new Error(errorPayload.error || "Failed to fetch interview")
        }
        const data = await res.json()
        setInterview(data.interview)
      } catch (e) {
        console.error(e)
        setError(e.message || "Failed to load interview results")
      } finally {
        setLoading(false)
      }
    }

    fetchInterview()
  }, [interviewId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg text-neutral-400">Loading interview results...</p>
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
        <div className="text-center p-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-neutral-400 mb-6">{error || "Interview not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const score = interview.feedback?.totalScore || 0
  const scoreColor =
    score >= 80
      ? "from-cyan-500 to-emerald-500"
      : score >= 60
        ? "from-amber-500 to-orange-500"
        : "from-rose-500 to-red-500"

  const scoreTextColor = score >= 80 ? "text-cyan-400" : score >= 60 ? "text-amber-400" : "text-rose-400"

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Card with Score */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 md:p-12 mb-8 relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-full blur-3xl -z-10"></div>

          <div className="text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-balance">Interview Results</h1>
            <div className="flex items-center justify-center gap-3 text-neutral-300 text-lg mb-8 flex-wrap">
              <span className="px-4 py-1.5 bg-slate-700/50 rounded-full">{interview.role}</span>
              <span className="px-4 py-1.5 bg-slate-700/50 rounded-full">{interview.level}</span>
              <span className="px-4 py-1.5 bg-slate-700/50 rounded-full">{interview.type}</span>
            </div>

            {/* Score Display */}
            <div className="relative inline-block">
              <div className={`absolute inset-0 bg-gradient-to-r ${scoreColor} opacity-20 blur-2xl rounded-full`}></div>
              <div className="relative">
                <div className={`text-8xl md:text-9xl font-black ${scoreTextColor} mb-2`}>{score}</div>
                <div className="text-2xl text-neutral-400 font-medium">out of 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6">
          {/* Overall Assessment */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 md:p-8 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Overall Assessment</h2>
            </div>
            {interview.feedback?.finalAssessment ? (
              <p className="text-neutral-300 leading-relaxed text-lg">{interview.feedback.finalAssessment}</p>
            ) : (
              <div className="flex items-center space-x-3 text-neutral-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                <span>Assessment is being generated. Please refresh the page in a few moments.</span>
              </div>
            )}
          </div>

          {/*Nervousness Score Box */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 md:p-8 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Nervousness Score</h2>
            </div>
            <p className="text-neutral-300 leading-relaxed text-lg">{interview.nervousness_score ?? "Not available"}</p>
          </div>

          {/* Two Column Layout for Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            {interview.feedback?.strengths?.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Strengths</h2>
                </div>
                <ul className="space-y-3">
                  {interview.feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3 text-neutral-300">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {interview.feedback?.improvements?.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Areas for Improvement</h2>
                </div>
                <ul className="space-y-3">
                  {interview.feedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-3 text-neutral-300">
                      <span className="text-amber-400 mt-1">→</span>
                      <span className="leading-relaxed">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {interview.feedback?.recommendations?.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 md:p-8 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Recommendations</h2>
              </div>
              <ul className="space-y-3">
                {interview.feedback.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3 text-neutral-300">
                    <span className="text-cyan-400 mt-1">💡</span>
                    <span className="leading-relaxed">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Q&A Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Answers</h2>
            <div className="space-y-6">
              {interview.question_answers?.length > 0 ? (
                interview.question_answers.map((qa, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-cyan-500/50 pl-6 py-3 hover:border-cyan-500 transition-colors"
                  >
                    <h3 className="font-semibold text-white mb-3 text-lg">
                      <span className="text-cyan-400 mr-2">Q{index + 1}:</span>
                      {qa.question}
                    </h3>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <p className="text-neutral-300 leading-relaxed">{qa.answer || "No answer provided"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 italic text-center py-8">No questions and answers recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
          <button
            onClick={() => window.location.reload()}
            className="group px-6 py-3 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Refresh Results
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="group px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/")}
            className="group px-6 py-3 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-all hover:scale-105 flex items-center justify-center gap-2 border border-cyan-500/30"
          >
            <Play className="w-4 h-4" />
            Start New Interview
          </button>
        </div>
      </div>
    </main>
  )
}
