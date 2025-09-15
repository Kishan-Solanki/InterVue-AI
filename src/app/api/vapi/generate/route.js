import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import Interview from "@/model/interviewModel";
import User from "@/model/userModel";
import { connect } from "@/lib/dbconfig";

export async function POST(request) {
  const { type, role, level, techstack, amount, userid, company } = await request.json();

  try {
    await connect();
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        For company nemed ${company}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]`,
    });

    const interview = new Interview({
      role,
      type,
      level,
      techstack: techstack.split(",").map((t) => t.trim()),
      question_answers: JSON.parse(questions).map((q) => ({
        question: q,
        answer: "",
      })),
      userId: userid,
      company: "",
      feedback: {
        totalScore: 0,
        finalAssessment: "",
      },
    });

    await interview.save();

    await User.findByIdAndUpdate(userid, {
      $push: { interviews: interview._id },
    });

    return Response.json({ success: true, interview }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connect();

    const interviews = await Interview.find({})
      .populate("userId", "username email profileImageURL")
      .sort({ createdAt: -1 });

    return Response.json({ success: true, data: interviews }, { status: 200 });
  } catch (error) {
    console.error("GET Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
