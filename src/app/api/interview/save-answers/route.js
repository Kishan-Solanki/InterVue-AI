import { connect } from "@/lib/dbconfig";
import Interview from "@/model/interviewModel";

export async function POST(request) {
    try {
        await connect();
        const { interviewId, answers } = await request.json();

        if (!interviewId || !answers || !Array.isArray(answers)) {
            return Response.json(
                { success: false, error: "Invalid request data" },
                { status: 400 }
            );
        }

        // Update the interview with user answers
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return Response.json(
                { success: false, error: "Interview not found" },
                { status: 404 }
            );
        }

        // Update question_answers with user responses
        const updatedQA = interview.question_answers.map((qa, index) => {
            const userAnswer = answers.find(answer =>
                answer.question.toLowerCase().includes(qa.question.toLowerCase().substring(0, 50))
            );

            return {
                question: qa.question,
                answer: userAnswer ? userAnswer.answer : qa.answer
            };
        });

        // If we have more answers than questions, add them
        answers.forEach(answer => {
            const existsInQA = updatedQA.some(qa =>
                answer.question.toLowerCase().includes(qa.question.toLowerCase().substring(0, 50))
            );

            if (!existsInQA) {
                updatedQA.push({
                    question: answer.question,
                    answer: answer.answer
                });
            }
        });

        interview.question_answers = updatedQA;
        await interview.save();

        console.log(`Saved ${answers.length} answers for interview ${interviewId}`);

        return Response.json({
            success: true,
            message: "Interview answers saved successfully",
            answersCount: answers.length
        }, { status: 200 });

    } catch (error) {
        console.error("Error saving interview answers:", error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
```
