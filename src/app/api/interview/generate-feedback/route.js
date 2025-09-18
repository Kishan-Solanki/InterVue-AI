import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { connect } from "@/lib/dbconfig";
import Interview from "@/model/interviewModel";

export async function POST(request) {
    try {
        await connect();
        const { interviewId, qaPairs } = await request.json();

        if (!interviewId || !qaPairs || !Array.isArray(qaPairs)) {
            return Response.json(
                { success: false, error: "Invalid request data" },
                { status: 400 }
            );
        }

        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return Response.json(
                { success: false, error: "Interview not found" },
                { status: 404 }
            );
        }

        // Prepare feedback prompt
        const qaText = qaPairs.map((qa, index) =>
            `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer}`
        ).join('\n\n');

        const feedbackPrompt = `
Please evaluate this job interview performance for a ${interview.role} position at ${interview.level} level.

Interview Details:
- Role: ${interview.role}
- Level: ${interview.level}
- Type: ${interview.type}
- Tech Stack: ${interview.techstack.join(', ')}

Interview Q&A:
${qaText}

Please provide:
1. A total score out of 100
2. Detailed feedback covering:
   - Technical competency (if applicable)
   - Communication skills
   - Problem-solving approach
   - Areas of strength
   - Areas for improvement
   - Specific recommendations

Please be constructive and professional in your feedback.
Format your response as JSON with the following structure:
{
  "totalScore": <number between 0-100>,
  "finalAssessment": "<detailed feedback text>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "recommendations": ["<recommendation1>", "<recommendation2>"]
}
`;

        // Generate feedback using AI
        const { text: feedbackText } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: feedbackPrompt,
        });

        let feedbackData;
        try {
            feedbackData = JSON.parse(feedbackText);
        } catch (parseError) {
            // Fallback if JSON parsing fails
            feedbackData = {
                totalScore: 75, // Default score
                finalAssessment: feedbackText,
                strengths: [],
                improvements: [],
                recommendations: []
            };
        }

        // Update interview with feedback
        interview.feedback = {
            totalScore: feedbackData.totalScore || 0,
            finalAssessment: feedbackData.finalAssessment || feedbackText,
            strengths: feedbackData.strengths || [],
            improvements: feedbackData.improvements || [],
            recommendations: feedbackData.recommendations || []
        };

        await interview.save();

        console.log(`Generated feedback for interview ${interviewId} with score ${feedbackData.totalScore}`);

        return Response.json({
            success: true,
            feedback: interview.feedback,
            message: "Feedback generated successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error generating feedback:", error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
} 