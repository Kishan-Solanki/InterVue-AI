"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const formatDate = (value) => {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value))
  } catch (error) {
    console.error("Error formatting date", value, error)
    return "—"
  }
}

const formatChange = (value) => {
  if (value === null || value === undefined) return "—"
  if (Number.isNaN(value)) return "—"
  if (value === 0) return "0"
  return `${value > 0 ? "+" : ""}${value}`
}

const GrowthPage = () => {
  const [user, setUser] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true

    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/user/get-data")
        if (!res.ok) {
          throw new Error("Unauthorized")
        }
        const userData = await res.json()
        if (!active) return
        setUser(userData)

        try {
          const interviewsRes = await fetch(`/api/user/get-interview-data?userid=${userData.id}`)
          if (!active) return
          if (interviewsRes.ok) {
            const json = await interviewsRes.json()
            setInterviews(Array.isArray(json.data) ? json.data : [])
          } else {
            setInterviews([])
          }
        } catch (interviewError) {
          console.error("Error fetching interview data", interviewError)
          if (active) setInterviews([])
        }
      } catch (error) {
        console.error("Error loading growth data", error)
        if (active) {
          router.push("/login")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [router])

  const insights = useMemo(() => {
    if (!interviews.length) {
      return {
        trend: [],
        averageScore: 0,
        improvement: 0,
        bestScore: 0,
        bestStreak: 0,
        strengths: [],
        weaknesses: [],
        typeBreakdown: [],
        levelBreakdown: [],
        techBreakdown: [],
        monthly: [],
        totalInterviews: 0,
        latestInterview: null,
        latestFeedback: null,
      }
    }

    const sorted = [...interviews].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const trend = sorted.map((iv, index) => {
      const score = Math.round(Number(iv?.feedback?.totalScore ?? 0))
      const prevScore = index > 0 ? Math.round(Number(sorted[index - 1]?.feedback?.totalScore ?? 0)) : null
      return {
        id: iv._id,
        role: iv.role,
        level: iv.level,
        type: iv.type,
        createdAt: iv.createdAt,
        score,
        change: prevScore !== null ? score - prevScore : null,
      }
    })

    const totalScore = trend.reduce((acc, item) => acc + item.score, 0)
    const averageScore = Math.round(totalScore / trend.length)
    const improvement = trend.length > 1 ? trend[trend.length - 1].score - trend[0].score : 0
    const bestScore = trend.reduce((max, item) => Math.max(max, item.score), 0)
    const latestInterview = trend[trend.length - 1] ?? null
    const latestFeedback = sorted[sorted.length - 1]?.feedback ?? null

    let currentStreak = 0
    let bestStreak = 0
    for (let index = 1; index < trend.length; index += 1) {
      if (trend[index].score >= trend[index - 1].score) {
        currentStreak += 1
      } else {
        currentStreak = 0
      }
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak
      }
    }

    const aggregateList = (field) => {
      const map = new Map()
      sorted.forEach((iv) => {
        const entries = iv?.feedback?.[field]
        if (!Array.isArray(entries)) return
        entries.forEach((item) => {
          const value = (item || "").trim()
          if (!value) return
          const key = value.toLowerCase()
          const existing = map.get(key)
          if (existing) {
            existing.count += 1
          } else {
            map.set(key, { label: value, count: 1 })
          }
        })
      })
      return Array.from(map.values()).sort((a, b) => b.count - a.count)
    }

    const computeAverageBy = (field) => {
      const map = new Map()
      sorted.forEach((iv) => {
        const label = (iv?.[field] || "Unknown").trim()
        if (!label) return
        const score = Math.round(Number(iv?.feedback?.totalScore ?? 0))
        const existing = map.get(label)
        if (existing) {
          existing.total += score
          existing.count += 1
        } else {
          map.set(label, { label, total: score, count: 1 })
        }
      })

      return Array.from(map.values())
        .map((item) => ({
          label: item.label,
          count: item.count,
          average: Math.round(item.total / item.count),
        }))
        .sort((a, b) => b.average - a.average)
    }

    const techMap = new Map()
    sorted.forEach((iv) => {
      const score = Math.round(Number(iv?.feedback?.totalScore ?? 0))
      if (!Array.isArray(iv?.techstack)) return
      iv.techstack.forEach((tech) => {
        const label = (tech || "").trim()
        if (!label) return
        const existing = techMap.get(label)
        if (existing) {
          existing.total += score
          existing.count += 1
        } else {
          techMap.set(label, { label, total: score, count: 1 })
        }
      })
    })

    const techBreakdown = Array.from(techMap.values())
      .map((item) => ({
        label: item.label,
        count: item.count,
        average: Math.round(item.total / item.count),
      }))
      .sort((a, b) => b.count - a.count)

    const monthMap = new Map()
    sorted.forEach((iv) => {
      const created = new Date(iv.createdAt)
      const monthStart = new Date(created.getFullYear(), created.getMonth(), 1)
      const key = monthStart.getTime()
      const score = Math.round(Number(iv?.feedback?.totalScore ?? 0))

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          label: new Intl.DateTimeFormat("en-US", {
            month: "short",
            year: "numeric",
          }).format(monthStart),
          total: 0,
          count: 0,
          best: score,
        })
      }

      const entry = monthMap.get(key)
      entry.total += score
      entry.count += 1
      entry.best = Math.max(entry.best, score)
    })

    const orderedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0] - b[0])
    const monthly = orderedMonths.map(([_, value], index) => {
      const average = Math.round(value.total / value.count)
      const prevAverage =
        index > 0 ? Math.round(orderedMonths[index - 1][1].total / orderedMonths[index - 1][1].count) : null

      return {
        label: value.label,
        average,
        count: value.count,
        change: prevAverage !== null ? average - prevAverage : null,
        best: value.best,
      }
    })

    return {
      trend,
      averageScore,
      improvement,
      bestScore,
      bestStreak,
      strengths: aggregateList("strengths"),
      weaknesses: aggregateList("improvements"),
      typeBreakdown: computeAverageBy("type"),
      levelBreakdown: computeAverageBy("level"),
      techBreakdown,
      monthly,
      totalInterviews: sorted.length,
      latestInterview,
      latestFeedback,
    }
  }, [interviews])

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-300">
        Loading your growth insights...
      </div>
    )
  }

  const hasInterviews = insights.totalInterviews > 0

  const chartColors = {
    stroke: "#06b6d4",
    fill: "#06b6d4",
    altStroke: "#8b5cf6",
    altFill: "#8b5cf6",
    emerald: "#10b981",
    rose: "#f43f5e",
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Growth Analytics</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {user ? `${user.username}'s Growth Overview` : "Your Growth Overview"}
            </h1>
            <p className="max-w-2xl text-neutral-400">
              We analyze your past interviews to highlight how your skills are improving, where to double down, and how
              your performance evolves with every practice session.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-slate-500 hover:text-white"
            >
              Back to Dashboard
            </Link>
            {user ? (
              <Link
                href={{
                  pathname: "/interview",
                  query: {
                    userId: user.id,
                    username: user.username,
                    profileImageURL: user.profileImageURL,
                    start: "1",
                  },
                }}
                className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-400"
              >
                Start New Interview
              </Link>
            ) : null}
          </div>
        </header>

        {!hasInterviews ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-neutral-300">
            <h2 className="text-xl font-semibold text-white">You&apos;re at the starting line</h2>
            <p className="mt-2 text-neutral-400">
              Complete your first interview to unlock personalized growth analytics. We&apos;ll track your score
              progression, highlight recurring strengths, and surface areas to sharpen with every session.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:border-slate-500 hover:text-white"
              >
                Explore Dashboard
              </Link>
              {user ? (
                <Link
                  href={{
                    pathname: "/interview",
                    query: {
                      userId: user.id,
                      username: user.username,
                      profileImageURL: user.profileImageURL,
                      start: "1",
                    },
                  }}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
                >
                  Schedule First Practice
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-neutral-400">Average Score</p>
                <p className="mt-2 text-3xl font-semibold text-white">{insights.averageScore}%</p>
                <p className="mt-3 text-xs text-neutral-500">
                  {insights.totalInterviews > 1
                    ? `Change of ${formatChange(insights.improvement)} pts since your first session`
                    : "Baseline established from your first session"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-neutral-400">Interviews Completed</p>
                <p className="mt-2 text-3xl font-semibold text-white">{insights.totalInterviews}</p>
                <p className="mt-3 text-xs text-neutral-500">
                  Strong data starts after 3+ sessions — keep the momentum going.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-neutral-400">Best Score Achieved</p>
                <p className="mt-2 text-3xl font-semibold text-white">{insights.bestScore}%</p>
                <p className="mt-3 text-xs text-neutral-500">
                  Highest performance recorded across all practice interviews.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-neutral-400">Consistent Growth Streak</p>
                <p className="mt-2 text-3xl font-semibold text-white">{insights.bestStreak + 1}</p>
                <p className="mt-3 text-xs text-neutral-500">
                  Longest run of sessions where you kept pace or improved.
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Score Progression</h2>
                  <span className="text-xs text-neutral-500">
                    Latest: {formatDate(insights.latestInterview?.createdAt)}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {insights.trend.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {entry.role} · {entry.level} · {entry.type}
                        </p>
                        <p className="text-xs text-neutral-500">{formatDate(entry.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-white">{entry.score}%</span>
                        <span
                          className={`text-xs font-medium ${
                            entry.change === null
                              ? "text-neutral-500"
                              : entry.change >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                          }`}
                        >
                          {entry.change === null ? "baseline" : `${formatChange(entry.change)} pts`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold text-white">Latest Recommendations</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Tailored actions from your most recent interview feedback.
                </p>
                <div className="mt-4 space-y-3">
                  {Array.isArray(insights.latestFeedback?.recommendations) &&
                  insights.latestFeedback.recommendations.length ? (
                    insights.latestFeedback.recommendations.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-4 text-sm text-neutral-200"
                      >
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-400">
                      No actionable recommendations available yet — complete another session to unlock tailored coaching
                      points.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold text-white">Top Strengths</h2>
                <p className="mt-1 text-xs text-neutral-500">Repeated positive signals from interview feedback.</p>
                <div className="mt-4 space-y-2">
                  {insights.strengths.slice(0, 6).map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-sm text-neutral-100"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs font-medium text-emerald-400">{item.count}×</span>
                    </div>
                  ))}
                  {insights.strengths.length === 0 ? (
                    <p className="text-sm text-neutral-400">
                      As you accumulate interviews we&apos;ll spotlight recurring strengths like clarity, confidence,
                      and storytelling.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold text-white">Focus Areas</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Skill opportunities consistently flagged for improvement.
                </p>
                <div className="mt-4 space-y-2">
                  {insights.weaknesses.slice(0, 6).map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-sm text-neutral-100"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs font-medium text-rose-400">{item.count}×</span>
                    </div>
                  ))}
                  {insights.weaknesses.length === 0 ? (
                    <p className="text-sm text-neutral-400">
                      Complete more interviews to discover which topics and behaviors need targeted practice.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-white">Performance by Interview Type</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Compare how you fare across interview formats and difficulty levels.
              </p>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-300">By Interview Type</h3>
                  <div className="mt-3 space-y-2">
                    {insights.typeBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-sm text-neutral-100"
                      >
                        <div>
                          <p className="font-medium text-white">{item.label}</p>
                          <p className="text-xs text-neutral-500">
                            {item.count} interview{item.count > 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-base font-semibold text-white">{item.average}%</span>
                      </div>
                    ))}
                    {insights.typeBreakdown.length === 0 ? (
                      <p className="text-sm text-neutral-400">
                        Once you try multiple interview types, you&apos;ll see how your performance varies between
                        technical, behavioral, and mixed rounds.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-300">By Difficulty Level</h3>
                  <div className="mt-3 space-y-2">
                    {insights.levelBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-sm text-neutral-100"
                      >
                        <div>
                          <p className="font-medium text-white">{item.label}</p>
                          <p className="text-xs text-neutral-500">
                            {item.count} interview{item.count > 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-base font-semibold text-white">{item.average}%</span>
                      </div>
                    ))}
                    {insights.levelBreakdown.length === 0 ? (
                      <p className="text-sm text-neutral-400">
                        Tackle various difficulty levels to understand where you thrive and where to invest more
                        practice.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-white">Tech Stack Readiness</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Which technologies do you discuss most, and how strong are your responses?
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {insights.techBreakdown.slice(0, 6).map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {item.count} interview{item.count > 1 ? "s" : ""} referenced
                    </p>
                    <p className="mt-3 text-sm text-neutral-300">
                      Avg Score: <span className="font-semibold text-white">{item.average}%</span>
                    </p>
                  </div>
                ))}
                {insights.techBreakdown.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800/80 bg-slate-950/20 p-6 text-sm text-neutral-400">
                    Once your interviews cover specific stacks (e.g., React, Node.js, System Design) we&apos;ll surface
                    focused readiness metrics here.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Interview Cadence & Momentum</h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Track how frequently you practice and how consistency impacts your score.
                  </p>
                </div>
                <span className="text-xs text-neutral-500">
                  {insights.monthly.length} month{insights.monthly.length === 1 ? "" : "s"} tracked
                </span>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-neutral-200">
                  <thead className="text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="pb-3 pr-6">Month</th>
                      <th className="pb-3 pr-6">Interviews</th>
                      <th className="pb-3 pr-6">Average Score</th>
                      <th className="pb-3">Change vs Previous</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {insights.monthly.map((month) => (
                      <tr key={month.label}>
                        <td className="py-3 pr-6 text-sm text-white">{month.label}</td>
                        <td className="py-3 pr-6 text-sm">{month.count}</td>
                        <td className="py-3 pr-6 text-sm">{month.average}%</td>
                        <td className="py-3 text-sm">
                          {month.change === null ? (
                            <span className="text-neutral-500">baseline</span>
                          ) : (
                            <span className={`font-medium ${month.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {formatChange(month.change)} pts
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {insights.monthly.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-sm text-neutral-400">
                          Keep a steady interview cadence — we&apos;ll analyze how consistency compounds your
                          performance each month.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Visual Analytics</h2>

              {/* Score Progression Line Chart */}
              {insights.trend.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Score Progression Over Time</h3>
                  <p className="mt-1 text-xs text-neutral-500">Track your interview scores across all sessions.</p>
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={insights.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="role" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e2e8f0" }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={chartColors.stroke}
                          dot={{ fill: chartColors.fill, r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Score %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Monthly Performance Line Chart */}
              {insights.monthly.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Monthly Average Performance</h3>
                  <p className="mt-1 text-xs text-neutral-500">See how your scores trend month-over-month.</p>
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={insights.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e2e8f0" }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="average"
                          stroke={chartColors.stroke}
                          dot={{ fill: chartColors.fill, r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Avg Score %"
                        />
                        <Line
                          type="monotone"
                          dataKey="best"
                          stroke={chartColors.emerald}
                          dot={{ fill: chartColors.emerald, r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Best Score %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Interview Type Performance Bar Chart */}
              {insights.typeBreakdown.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Performance by Interview Type</h3>
                  <p className="mt-1 text-xs text-neutral-500">Average scores across different interview formats.</p>
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={insights.typeBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e2e8f0" }}
                        />
                        <Bar dataKey="average" fill={chartColors.stroke} name="Avg Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Difficulty Level Performance Bar Chart */}
              {insights.levelBreakdown.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Performance by Difficulty Level</h3>
                  <p className="mt-1 text-xs text-neutral-500">Average scores across different difficulty levels.</p>
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={insights.levelBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e2e8f0" }}
                        />
                        <Bar dataKey="average" fill={chartColors.altStroke} name="Avg Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Strengths vs Weaknesses Comparison */}
              {(insights.strengths.length > 0 || insights.weaknesses.length > 0) && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Top Strengths vs Focus Areas</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Frequency of strengths mentioned vs areas for improvement.
                  </p>
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {insights.strengths.length > 0 && (
                      <div>
                        <h4 className="mb-4 text-sm font-medium text-white">Top Strengths</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={insights.strengths.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "11px" }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                              }}
                              labelStyle={{ color: "#e2e8f0" }}
                            />
                            <Bar dataKey="count" fill={chartColors.emerald} name="Frequency" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {insights.weaknesses.length > 0 && (
                      <div>
                        <h4 className="mb-4 text-sm font-medium text-white">Focus Areas</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={insights.weaknesses.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "11px" }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                              }}
                              labelStyle={{ color: "#e2e8f0" }}
                            />
                            <Bar dataKey="count" fill={chartColors.rose} name="Frequency" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tech Stack Performance Bar Chart */}
              {insights.techBreakdown.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Tech Stack Average Scores</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Performance metrics for technologies discussed in interviews.
                  </p>
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={insights.techBreakdown.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="label"
                          stroke="#94a3b8"
                          style={{ fontSize: "11px" }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e2e8f0" }}
                        />
                        <Bar dataKey="average" fill={chartColors.stroke} name="Avg Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default GrowthPage
