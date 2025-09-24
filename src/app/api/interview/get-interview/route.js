import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connect } from "@/lib/dbconfig"
import Interview from "@/model/interviewModel"
import { verifyJwtToken } from "@/lib/jwt"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get("id")
    await connect()

    let interview
    if (interviewId) {
      // Find the interview by ID
      interview = await Interview.findById(interviewId).populate("userId", "username email profileImageURL").lean()
    } else {
      // If no id provided, get the latest interview for the authenticated user
      const cookieStore = await cookies()
      const token = cookieStore.get("token")?.value
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      const decoded = verifyJwtToken(token)
      if (!decoded || typeof decoded !== "object" || !decoded.id) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      interview = await Interview.findOne({ userId: decoded.id })
        .sort({ createdAt: -1 })
        .populate("userId", "username email profileImageURL")
        .lean()
    }

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    // Format the response to match what the results page expects
    const formattedInterview = {
      _id: interview._id,
      role: interview.role || "Software Developer",
      level: interview.level || "Mid-level",
      type: interview.type || "Technical",
      question_answers: interview.question_answers || [],
      feedback: {
        totalScore: interview.feedback?.totalScore || 0,
        finalAssessment: interview.feedback?.finalAssessment || "No assessment available",
        strengths: interview.feedback?.strengths || [],
        improvements: interview.feedback?.improvements || [],
        recommendations: interview.feedback?.recommendations || [],
      },
      createdAt: interview.createdAt,
      user: interview.userId,
    }

    return NextResponse.json({
      success: true,
      interview: formattedInterview,
    })
  } catch (error) {
    console.error("Error fetching interview results:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
