const apiKey =process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function generateFeedbackWithGemini({ role, level, type, company, techstack, question_answers }) {
  const model = "gemini-2.5-flash-preview-05-20";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
    You are an AI interview evaluator. Analyze the following interview details and provide structured feedback.
    
    Role: ${role}
    Level: ${level}
    Type: ${type}
    Company: ${company}
    Tech Stack: ${techstack.join(", ")}

    Questions and Answers:
    ${question_answers.map((qa, idx) => `${idx + 1}. Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")}
  `;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      totalScore: { type: "NUMBER" },
      finalAssessment: { type: "STRING" },
      strengths: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      improvements: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      recommendations: {
        type: "ARRAY",
        items: { type: "STRING" }
      }
    }
  };

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  };

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const jsonString = candidate.content.parts[0].text;
        return JSON.parse(jsonString);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error(`API call attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 100;
        await new Promise(res => setTimeout(res, delay));
      } else {
        return {
          totalScore: 0,
          finalAssessment: "",
          strengths: [],
          improvements: [],
          recommendations: [],
        };
      }
    }
    attempt++;
  }
}
