
// --- Configuration ---
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
// UPDATED: Using a more robust, generally available model name.
const DEFAULT_MODEL = "gemini-2.5-flash" 
const modelName = process.env.GOOGLE_GEMINI_MODEL || DEFAULT_MODEL
const apiBase = process.env.GOOGLE_GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta" // Consider changing to /v1

// --- Interface for function arguments ---
/**
 * @typedef {object} QuestionAnswer
 * @property {string} question
 * @property {string} answer
 */

/**
 * @typedef {object} FeedbackArgs
 * @property {string} role - The job role (e.g., "Senior Software Engineer")
 * @property {string} level - The required level (e.g., "L5")
 * @property {string} type - The interview type (e.g., "Technical Screen")
 * @property {string} company - The company name
 * @property {string[]} techstack - Array of technologies (e.g., ["React", "Node.js", "AWS"])
 * @property {QuestionAnswer[]} question_answers - Array of interview Q&A pairs
 * @property {number} nervousness_score - A score from 1-10 (1=calm, 10=very nervous)
 */

/**
 * @typedef {object} GeneratedFeedback
 * @property {number} totalScore - Overall score (e.g., 1-100)
 * @property {string} finalAssessment - A brief summary of the evaluation
 * @property {string[]} strengths - Key positive aspects
 * @property {string[]} improvements - Areas needing development (weaknesses)
 * @property {string[]} recommendations - Actionable suggestions for improvement
 */


// --- Main Function ---

/**
 * Generates structured interview feedback using the Google Gemini API.
 * @param {FeedbackArgs} interviewDetails - The details of the interview performance.
 * @returns {Promise<GeneratedFeedback>} - The structured feedback object.
 */
export async function generateFeedbackWithGemini({
  role,
  level,
  type,
  company,
  techstack,
  question_answers,
  nervousness_score,
}) {
  if (!apiKey) {
    console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY. Returning fallback feedback.")
    return {
      totalScore: 0,
      finalAssessment: "API key is missing. Cannot generate feedback.",
      strengths: [],
      improvements: [],
      recommendations: [],
    }
  }

  const apiUrl = `${apiBase}/models/${modelName}:generateContent?key=${apiKey}`

  const prompt = `
You are an AI interview evaluator. Analyze the following interview details and provide structured, professional feedback in the specified JSON format.

### Interview Context
Role: ${role}
Level: ${level}
Type: ${type}
Company: ${company}
Tech Stack: ${techstack.join(", ")}

### Questions and Answers
${question_answers.map((qa, idx) => `Q${idx + 1}. ${qa.question}\nA${idx + 1}. ${qa.answer}`).join("\n\n")}

### Candidate Behavior
Nervousness Score (1-10, 10 being very nervous): ${nervousness_score}

### Evaluation Criteria
Based on the above information, provide a comprehensive evaluation covering:
- Technical knowledge and understanding of the tech stack.
- Communication clarity and confidence.
- Problem-solving and reasoning ability.
- Behavior and confidence indicators (use the nervousness score as a factor).
- If any viva or oral examination data is present, evaluate it based on the Q&A quality and depth of understanding.
- Provide structured feedback with strengths, weaknesses, and suggestions for improvement.
- The 'totalScore' should be a numeric rating from 1 to 100.
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

  const maxRetries = 5
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        const errorMessage = errorPayload.error?.message || `HTTP error! status: ${response.status}`
        throw new Error(`${errorMessage} (model: ${modelName}, attempt: ${attempt + 1})`)
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const jsonString = candidate.content.parts[0].text;
        // Attempt to parse the JSON string from the model's response
        return JSON.parse(jsonString)
      }

      throw new Error("Invalid API response format or empty response")
    } catch (error) {
      console.error(`API call attempt ${attempt + 1} failed:`, error?.message || error)
      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(res => setTimeout(res, delay));
      } else {
        // Final fallback after all retries fail
        return {
          totalScore: 0,
          finalAssessment: "API service failed after maximum retries. Check model name/API key.",
          strengths: [],
          improvements: [],
          recommendations: [],
        };
      }
    }
    attempt++;
  }
}