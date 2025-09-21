import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbconfig";
import { Interview } from "@/model/interviewModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get("id");

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the interview by ID
    const interview = await Interview.findById(interviewId)
      .populate('user', 'name email')
      .lean();

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
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
        recommendations: interview.feedback?.recommendations || []
      },
      createdAt: interview.createdAt,
      user: interview.user
    };

    return NextResponse.json({
      success: true,
      interview: formattedInterview
    });

  } catch (error) {
    console.error("Error fetching interview results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}