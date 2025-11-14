import mongoose from "mongoose"

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    audio_link: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["Easy", "Hard", "Medium"],
      required: true,
    },
    type: {
      type: String,
      enum: ["Technical", "Behavioral", "Mixed"],
      required: true,
    },
    amount: {
      type: Number,
      default: 10,
    },
    techstack: [
      {
        type: String,
        trim: true,
      },
    ],
    question_answers: [
      {
        question: { type: String, required: true },
        answer: { type: String, default: "" },
      },
    ],
    feedback: {
      totalScore: { type: Number, default: 0 },
      finalAssessment: { type: String, trim: true, default: "" },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      recommendations: [{ type: String }],
    },
    company: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

const Interview = mongoose.models.Interview || mongoose.model("Interview", interviewSchema)

export default Interview
