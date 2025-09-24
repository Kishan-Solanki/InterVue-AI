import { NextResponse } from "next/server"
import { connect } from "@/lib/dbconfig"
import Interview from "@/model/interviewModel"
import User from "@/model/userModel"

export async function POST(request) {
  try {
    console.log("[v0] Starting save-interview API call")

    await connect()
    console.log("[v0] Database connected successfully")

    const body = await request.json()
    console.log("[v0] Request body received:", JSON.stringify(body, null, 2))

    const { userId, type, role, level, company, techstack, qaPairs, strengths, improvements, recommendations } = body

    // Validate required fields
    if (!userId) {
      console.log("[v0] Missing userId")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!qaPairs || !Array.isArray(qaPairs) || qaPairs.length === 0) {
      console.log("[v0] Missing or invalid qaPairs")
      return NextResponse.json({ error: "Q&A pairs are required" }, { status: 400 })
    }

    // Verify user exists
    const user = await User.findById(userId)
    if (!user) {
      console.log("[v0] User not found:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User found:", user.email)

    // Map type to valid enum value
    let validType = "Technical" // default
    if (type === "Behavioral") validType = "Behavioral"
    else if (type === "Mixed") validType = "Mixed"

    // Calculate scores based on Q&A pairs
    const calculateScores = (qaPairs) => {
      const totalQuestions = qaPairs.length
      if (totalQuestions === 0) return { technical: 0, communication: 0, overall: 0 }

      // Simple scoring based on answer quality
      let technicalScore = 0
      let communicationScore = 0

      qaPairs.forEach((pair) => {
        const answerLength = pair.answer.split(" ").length
        const hasExamples = /for example|for instance|e\.g\.|example/i.test(pair.answer)
        const mentionsTech = /react|node|next|docker|kubernetes|aws|gcp|azure|mongodb|postgres|redis|ci\/?cd/i.test(
          pair.answer,
        )

        // Technical score (0-10)
        let techPoints = 5 // base score
        if (answerLength >= 20) techPoints += 2
        if (hasExamples) techPoints += 2
        if (mentionsTech) techPoints += 1
        technicalScore += Math.min(techPoints, 10)

        // Communication score (0-10)
        let commPoints = 5 // base score
        if (answerLength >= 15) commPoints += 2
        if (hasExamples) commPoints += 2
        if (answerLength >= 30) commPoints += 1
        communicationScore += Math.min(commPoints, 10)
      })

      technicalScore = Math.round(technicalScore / totalQuestions)
      communicationScore = Math.round(communicationScore / totalQuestions)
      const overall = Math.round((technicalScore + communicationScore) / 2)

      return { technical: technicalScore, communication: communicationScore, overall }
    }

    const scores = calculateScores(qaPairs)
    console.log("[v0] Calculated scores:", scores)

    // Create interview document
    const interviewData = {
      userId: userId, // Changed from 'user' to 'userId'
      type: validType,
      role: role || "Software Developer",
      level: level || "Medium",
      company: company || "",
      techstack: techstack ? (Array.isArray(techstack) ? techstack : [techstack]) : [],
      amount: qaPairs.length,
      question_answers: qaPairs.map((pair) => ({
        question: pair.question,
        answer: pair.answer,
      })),
      feedback: {
        totalScore: scores.overall,
        finalAssessment: `Based on ${qaPairs.length} questions, the candidate demonstrated ${scores.overall >= 7 ? "strong" : scores.overall >= 5 ? "adequate" : "developing"} performance with a technical score of ${scores.technical}/10 and communication score of ${scores.communication}/10.`,
        strengths: strengths || [],
        improvements: improvements || [],
        recommendations: recommendations || [],
      },
    }

    console.log("[v0] Creating interview with data:", JSON.stringify(interviewData, null, 2))

    const interview = new Interview(interviewData)
    const savedInterview = await interview.save()

    console.log("[v0] Interview saved successfully with ID:", savedInterview._id)

    // Update user's interviews array
    await User.findByIdAndUpdate(userId, {
      $push: { interviews: savedInterview._id },
    })

    console.log("[v0] User interviews array updated")

    return NextResponse.json({
      success: true,
      interview: {
        _id: savedInterview._id,
        type: savedInterview.type,
        role: savedInterview.role,
        level: savedInterview.level,
        scores: savedInterview.feedback.scores,
        status: savedInterview.status,
        createdAt: savedInterview.createdAt,
      },
    })
  } catch (error) {
    console.error("[v0] Error in save-interview API:", error)
    console.error("[v0] Error stack:", error.stack)

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      console.log("[v0] Validation errors:", validationErrors)
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to save interview",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
