"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
  ERROR: "ERROR",
};

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  profileImage,
  layout = "stack",
  autoStart = false,
}) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);
  const callEndedRef = useRef(false);

  // New: Live Q&A and insights
  const [qaPairsState, setQaPairsState] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Event handlers
  useEffect(() => {
    const onCallStart = () => {
      console.log("Call started successfully");
      setCallStatus(CallStatus.ACTIVE);
      setErrorMessage("");
      callEndedRef.current = false;
    };

    const onCallEnd = () => {
      console.log("Call ended normally");
      if (!callEndedRef.current) {
        callEndedRef.current = true;
        setCallStatus(CallStatus.FINISHED);
      }
    };

    const onMessage = (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error) => {
      console.error("VAPI Error occurred:", error);

      // Handle different types of errors
      if (error && typeof error === 'object') {
        const errorData = typeof error === 'string' ? JSON.parse(error) : error;

        if (errorData.error?.type === 'ejected' || errorData.errorMsg?.includes('Meeting has ended')) {
          console.log("Call was ejected, handling gracefully...");
          if (!callEndedRef.current) {
            callEndedRef.current = true;
            setCallStatus(CallStatus.FINISHED);
          }
          return;
        }

        // Handle other errors
        setErrorMessage(errorData.errorMsg || "An error occurred during the call");
      } else if (error instanceof Error) {
        console.error("VAPI Error:", error.message, error.stack);
        setErrorMessage(error.message);
      } else {
        console.error("VAPI Error (raw):", error);
        setErrorMessage("An unexpected error occurred");
      }

      if (callStatus === CallStatus.ACTIVE || callStatus === CallStatus.CONNECTING) {
        setCallStatus(CallStatus.ERROR);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [callStatus]);

  // Handle feedback generation or redirect when call finishes
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    // Live update Q&A as messages progress
    const livePairs = extractQAPairs(messages);
    setQaPairsState(livePairs);
    const { strengths: s, improvements: i, recommendations: r } = deriveInsights(livePairs);
    setStrengths(s);
    setImprovements(i);
    setRecommendations(r);

    const handleGenerateFeedback = async (messages) => {
      if (isProcessingFeedback) return;

      setIsProcessingFeedback(true);
      console.log("Processing interview feedback with", messages.length, "messages");

      try {
        // Extract Q&A pairs from conversation
        const qaPairs = extractQAPairs(messages);

        if (qaPairs.length > 0 && interviewId) {
          // Save answers to database
          await saveInterviewAnswers(interviewId, qaPairs);

          // Generate feedback
          await generateFeedback(interviewId, qaPairs);

          console.log("Interview feedback processed successfully");
        } else {
          console.log("No Q&A pairs found or missing interview ID");
        }
      } catch (error) {
        console.error("Error processing feedback:", error);
        setErrorMessage("Failed to process interview feedback");
      } finally {
        setIsProcessingFeedback(false);
      }
    };

    if (callStatus === CallStatus.FINISHED && !isProcessingFeedback) {
      // Optionally persist at end (non-blocking)
      handleGenerateFeedback(messages);
      // Always return to dashboard after end per requirement
      router.push("/dashboard");
    }
  }, [messages, callStatus, interviewId, router, type, isProcessingFeedback]);

  // Auto-start the call if requested
  useEffect(() => {
    if (autoStart && callStatus === CallStatus.INACTIVE) {
      // Defer slightly to allow initial mount
      const t = setTimeout(() => {
        if (!callEndedRef.current) {
          try { handleCall(); } catch (_) { }
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [autoStart, callStatus]);

  // Extract Q&A pairs from conversation messages
  const extractQAPairs = (messages) => {
    const qaPairs = [];
    let currentQuestion = "";

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.role === "assistant") {
        // This is likely a question from the AI
        currentQuestion = message.content;
      } else if (message.role === "user" && currentQuestion) {
        // This is the user's answer to the current question
        qaPairs.push({
          question: currentQuestion,
          answer: message.content
        });
        currentQuestion = "";
      }
    }

    return qaPairs;
  };

  // Simple heuristic-based insights
  const deriveInsights = (pairs) => {
    const strengths = [];
    const improvements = [];
    const recommendations = [];

    if (pairs.length === 0) return { strengths, improvements, recommendations };

    const avgAnswerLength = pairs.reduce((s, p) => s + p.answer.split(" ").length, 0) / pairs.length;
    if (avgAnswerLength >= 18) strengths.push("Provides detailed, well-elaborated answers");
    else improvements.push("Elaborate more on key points with supporting details");

    const containsExamples = pairs.some(p => /for example|for instance|e\.g\.|example/i.test(p.answer));
    if (containsExamples) strengths.push("Includes concrete examples to justify answers");
    else recommendations.push("Incorporate real examples or metrics to strengthen points");

    const mentionsProcess = pairs.some(p => /steps|process|approach|architecture|design/i.test(p.answer));
    if (mentionsProcess) strengths.push("Explains reasoning and approach clearly");
    else improvements.push("Explain the approach or steps taken to reach the answer");

    const mentionsTools = pairs.some(p => /react|node|next|docker|kubernetes|aws|gcp|azure|mongodb|postgres|redis|ci\/?cd/i.test(p.answer));
    if (mentionsTools) strengths.push("Demonstrates familiarity with relevant tools/technologies");
    else recommendations.push("Reference relevant tools, libraries, or patterns where applicable");

    // De-duplicate entries
    const dedupe = (arr) => Array.from(new Set(arr));
    return {
      strengths: dedupe(strengths).slice(0, 5),
      improvements: dedupe(improvements).slice(0, 5),
      recommendations: dedupe(recommendations).slice(0, 5),
    };
  };

  // Save interview answers to database
  const saveInterviewAnswers = async (interviewId, qaPairs) => {
    try {
      const response = await fetch('/api/interview/save-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          answers: qaPairs
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save interview answers');
      }

      console.log("Interview answers saved successfully");
    } catch (error) {
      console.error("Error saving interview answers:", error);
      // Do not throw to avoid breaking UI
    }
  };

  // Generate feedback for the interview
  const generateFeedback = async (interviewId, qaPairs) => {
    try {
      const response = await fetch('/api/interview/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          qaPairs
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      console.log("Interview feedback generated successfully");
    } catch (error) {
      console.error("Error generating feedback:", error);
      // Do not throw to avoid breaking UI
    }
  };

  // Start call with Assistant
  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setErrorMessage("");
    callEndedRef.current = false;

    try {
      let assistantVariables = {
        username: userName,
        userid: userId
      };

      if (questions && questions.length > 0) {
        assistantVariables.questions = questions.map((q) => `- ${q}`).join("\n");
      }

      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID, {
        variableValues: assistantVariables,
      });
    } catch (err) {
      console.error("Failed to start call:", err instanceof Error ? err.message : err);
      setCallStatus(CallStatus.INACTIVE);
      setErrorMessage("Failed to start the interview call");
    }
  };

  // End call
  const handleDisconnect = () => {
    if (!callEndedRef.current) {
      callEndedRef.current = true;
      setCallStatus(CallStatus.FINISHED);
    }

    try {
      vapi.stop();
    } catch (err) {
      console.error("Failed to stop call:", err);
    }

    // Redirect to dashboard per requirement
    router.push('/dashboard');
  };

  // Reset error state
  const handleRetry = () => {
    setCallStatus(CallStatus.INACTIVE);
    setErrorMessage("");
    setMessages([]);
    callEndedRef.current = false;
  };

  // Highlight helper classes
  const aiHighlight = callStatus === CallStatus.ACTIVE && isSpeaking ? "ring-2 ring-cyan-500 border-cyan-500" : "";
  const userHighlight = callStatus === CallStatus.ACTIVE && !isSpeaking ? "ring-2 ring-cyan-500 border-cyan-500" : "";

  return (
    <div className={layout === "split" ? "w-full p-6" : "flex flex-col items-center space-y-6 p-6"}>
      {layout === "split" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: AI */}
          <div className={`h-full flex flex-col items-center bg-slate-800/50 border border-slate-700 rounded-xl p-6 transition-all ${aiHighlight}`}>
            <div className="relative">
              <Image src="/ai-avatar.png" alt="AI" width={128} height={128} className="rounded-full" />
              {isSpeaking && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <h3 className="mt-3 font-semibold text-white">AI Interviewer</h3>
          </div>

          {/* Right: User */}
          <div className={`h-full flex flex-col items-center bg-slate-800/50 border border-slate-700 rounded-xl p-6 transition-all ${userHighlight}`}>
            <Image
              src={profileImage}
              alt="User"
              width={128}
              height={128}
              className="rounded-md object-cover"
            />
            <h3 className="mt-3 font-semibold text-white">{userName}</h3>
          </div>

          {/* Status Messages - span both */}
          {isProcessingFeedback && (
            <div className="md:col-span-2 w-full border rounded-lg p-3 bg-blue-50 text-blue-800">
              <p className="text-center">Processing interview feedback...</p>
            </div>
          )}

          {errorMessage && (
            <div className="md:col-span-2 w-full border rounded-lg p-3 bg-red-50 text-red-800">
              <p className="text-center">{errorMessage}</p>
            </div>
          )}

          {/* Transcript - span both */}
          {messages.length > 0 && (
            <div className="md:col-span-2 w-full border rounded-lg p-3 bg-gray-50">
              <p key={lastMessage} className="text-gray-800 transition-opacity duration-500 animate-fadeIn">
                {lastMessage}
              </p>
            </div>
          )}

          {/* Controls - span both */}
          <div className="md:col-span-2 w-full flex justify-center gap-4">
            {callStatus === CallStatus.ERROR ? (
              <button
                className="px-6 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition"
                onClick={handleRetry}
              >
                Retry Interview
              </button>
            ) : callStatus !== CallStatus.ACTIVE ? (
              <button
                className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition relative"
                onClick={handleCall}
                disabled={callStatus === CallStatus.CONNECTING || isProcessingFeedback}
              >
                {callStatus === CallStatus.CONNECTING
                  ? "Connecting..."
                  : callStatus === CallStatus.FINISHED
                    ? "Interview Completed"
                    : "Start Call"}
              </button>
            ) : (
              <button
                className="px-6 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                onClick={handleDisconnect}
              >
                End Call
              </button>
            )}
          </div>

          {/* Live Q&A and Insights - span both */}
          {qaPairsState.length > 0 && (
            <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h4 className="text-white font-semibold mb-4">Questions & Answers</h4>
                <ol className="space-y-3 list-decimal list-inside text-neutral-200">
                  {qaPairsState.map((p, idx) => (
                    <li key={idx} className="space-y-1">
                      <p className="text-cyan-300 font-medium">Q{idx + 1}: {p.question}</p>
                      <p className="text-neutral-300">A: {p.answer}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <div>
                  <h5 className="text-white font-semibold">Strengths</h5>
                  <ul className="mt-2 list-disc list-inside text-neutral-300 space-y-1">
                    {strengths.length === 0 ? <li className="text-neutral-500">Will appear as you answer</li> : strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold">Areas for Improvement</h5>
                  <ul className="mt-2 list-disc list-inside text-neutral-300 space-y-1">
                    {improvements.length === 0 ? <li className="text-neutral-500">Will appear as you answer</li> : improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold">Recommendations</h5>
                  <ul className="mt-2 list-disc list-inside text-neutral-300 space-y-1">
                    {recommendations.length === 0 ? <li className="text-neutral-500">Will appear as you answer</li> : recommendations.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          {/* Interviewer */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Image
                src="/ai-avatar.png"
                alt="AI"
                width={80}
                height={80}
                className="rounded-full"
              />
              {isSpeaking && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <h3 className="mt-2 font-semibold">AI Interviewer</h3>
          </div>

          {/* User */}
          <div className="flex flex-col items-center border rounded-xl p-4 shadow-md">
            <Image
              src={profileImage}
              alt="User"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
            <h3 className="mt-2 font-semibold">{userName}</h3>
          </div>

          {/* Status Messages */}
          {isProcessingFeedback && (
            <div className="w-full max-w-md border rounded-lg p-3 bg-blue-50 text-blue-800">
              <p className="text-center">Processing interview feedback...</p>
            </div>
          )}

          {errorMessage && (
            <div className="w-full max-w-md border rounded-lg p-3 bg-red-50 text-red-800">
              <p className="text-center">{errorMessage}</p>
            </div>
          )}

          {/* Transcript */}
          {messages.length > 0 && (
            <div className="w-full max-w-md border rounded-lg p-3 bg-gray-50">
              <p
                key={lastMessage}
                className="text-gray-800 transition-opacity duration-500 animate-fadeIn"
              >
                {lastMessage}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="w-full flex justify-center gap-4">
            {callStatus === CallStatus.ERROR ? (
              <button
                className="px-6 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition"
                onClick={handleRetry}
              >
                Retry Interview
              </button>
            ) : callStatus !== CallStatus.ACTIVE ? (
              <button
                className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition relative"
                onClick={handleCall}
                disabled={callStatus === CallStatus.CONNECTING || isProcessingFeedback}
              >
                {callStatus === CallStatus.CONNECTING
                  ? "Connecting..."
                  : callStatus === CallStatus.FINISHED
                    ? "Interview Completed"
                    : "Start Call"}
              </button>
            ) : (
              <button
                className="px-6 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                onClick={handleDisconnect}
              >
                End Call
              </button>
            )}
          </div>

          {/* Live Q&A and Insights (stack layout) */}
          {qaPairsState.length > 0 && (
            <div className="w-full max-w-3xl space-y-6">
              <div className="bg-white border rounded-xl p-6">
                <h4 className="font-semibold mb-4">Questions & Answers</h4>
                <ol className="space-y-3 list-decimal list-inside">
                  {qaPairsState.map((p, idx) => (
                    <li key={idx} className="space-y-1">
                      <p className="font-medium">Q{idx + 1}: {p.question}</p>
                      <p>A: {p.answer}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold">Strengths</h5>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {strengths.length === 0 ? <li className="text-neutral-500">Will appear as you answer</li> : strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold">Areas for Improvement</h5>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {improvements.length === 0 ? <li className="text-neutral-500">Will appear as you answer</li> : improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold">Recommendations</h5>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {recommendations.length === 0 ? <li className="text-neutral-500">Will appear as you answer</li> : recommendations.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Agent;
