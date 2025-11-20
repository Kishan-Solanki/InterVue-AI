import { NextResponse } from "next/server"
import { connect } from "@/lib/dbconfig"
import Interview from "@/model/interviewModel"
import User from "@/model/userModel"
import { generateFeedbackWithGemini } from "@/lib/googleGemini"

export async function POST(request) {
  try {
    await connect()

    const body = await request.json()
    const { userId, type, role, level, company, techstack, qaPairs, strengths, improvements, recommendations,nervousness_score, } = body

    if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    if (!qaPairs || !Array.isArray(qaPairs) || qaPairs.length === 0)
      return NextResponse.json({ error: "Q&A pairs are required" }, { status: 400 })

    // Verify user exists
    const user = await User.findById(userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Map type to valid enum value
    const validType = ["Technical", "Behavioral", "Mixed"].includes(type) ? type : "Technical"

    // Generate feedback using Google Gemini API
    const feedback = await generateFeedbackWithGemini({
      role: role || "Software Developer",
      level: level || "Medium",
      type: validType,
      company: company || "",
      techstack: techstack || [],
      question_answers: qaPairs,
      nervousness_score,
    })

    // Create interview document
    const interviewData = {
      userId,
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
        totalScore: feedback.totalScore || 0,
        finalAssessment: feedback.finalAssessment || "",
        strengths: feedback.strengths || strengths || [],
        improvements: feedback.improvements || improvements || [],
        recommendations: feedback.recommendations || recommendations || [],
      },
      nervousness_score: nervousness_score || 0,  
    }

    const interview = new Interview(interviewData)
    const savedInterview = await interview.save()

    // Update user's interviews array
    await User.findByIdAndUpdate(userId, { $push: { interviews: savedInterview._id } })

    return NextResponse.json({
      success: true,
      interviewId: savedInterview._id,
    })
  } catch (error) {
    console.error("Error saving interview:", error)
    return NextResponse.json({ error: "Failed to save interview", details: error.message }, { status: 500 })
  }
}
