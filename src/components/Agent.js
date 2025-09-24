"use client"

import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { vapi } from "@/lib/vapi.sdk"

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
  ERROR: "ERROR",
}

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
  const router = useRouter()
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE)
  const [messages, setMessages] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastMessage, setLastMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false)
  const [createdInterviewId, setCreatedInterviewId] = useState(null)
  const callEndedRef = useRef(false)

  // New: Live Q&A and insights
  const [qaPairsState, setQaPairsState] = useState([])
  const [strengths, setStrengths] = useState([])
  const [improvements, setImprovements] = useState([])
  const [recommendations, setRecommendations] = useState([])

  // Event handlers
  useEffect(() => {
    const onCallStart = () => {
      console.log("Call started successfully")
      setCallStatus(CallStatus.ACTIVE)
      setErrorMessage("")
      callEndedRef.current = false
    }

    const onCallEnd = () => {
      console.log("Call ended normally")
      if (!callEndedRef.current) {
        callEndedRef.current = true
        setCallStatus(CallStatus.FINISHED)
      }
    }

    const onMessage = (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript }
        setMessages((prev) => [...prev, newMessage])
      }
    }

    const onSpeechStart = () => setIsSpeaking(true)
    const onSpeechEnd = () => setIsSpeaking(false)

    const onError = (error) => {
      console.error("VAPI Error occurred:", error)
      console.error("Error type:", typeof error)
      console.error("Error constructor:", error?.constructor?.name)
      console.error("Error keys:", error && typeof error === "object" ? Object.keys(error) : "N/A")

      // Handle different types of errors
      if (error && typeof error === "object") {
        // Check if error is empty object
        if (Object.keys(error).length === 0) {
          console.warn("Received empty error object from VAPI")
          setErrorMessage("An unknown error occurred during the call")
        } else {
          // Try to parse if it's a string, otherwise use as is
          let errorData
          try {
            errorData = typeof error === "string" ? JSON.parse(error) : error
          } catch (parseError) {
            console.error("Failed to parse error:", parseError)
            errorData = error
          }

          // Log VAPI error structure for debugging
          console.error("VAPI Error Details:", {
            type: errorData.type,
            stage: errorData.stage,
            error: errorData.error,
            totalDuration: errorData.totalDuration,
            timestamp: errorData.timestamp,
            context: errorData.context,
          })

          // Log context object details if it exists
          if (errorData.context && typeof errorData.context === "object") {
            console.error("VAPI Error Context Details:", {
              contextKeys: Object.keys(errorData.context),
              contextStringified: JSON.stringify(errorData.context, null, 2),
            })
          }

          // Check for specific error types based on VAPI error structure
          if (
            errorData.type === "ejected" ||
            errorData.error?.type === "ejected" ||
            errorData.error?.message?.includes("Meeting has ended") ||
            errorData.error?.message?.includes("call ended") ||
            errorData.error?.message?.includes("Call ended")
          ) {
            console.log("Call was ejected or ended, handling gracefully...")
            if (!callEndedRef.current) {
              callEndedRef.current = true
              setCallStatus(CallStatus.FINISHED)
            }
            return
          }

          // Handle VAPI-specific error messages with better categorization
          let errorMessage = "An error occurred during the call"
          let errorType = "unknown"

          // Determine error type and message
          if (errorData.error?.message) {
            errorMessage = errorData.error.message
            errorType = errorData.error.type || "api_error"
          } else if (errorData.error?.type) {
            errorType = errorData.error.type
            errorMessage = `VAPI Error: ${errorData.error.type}`
          } else if (errorData.type) {
            errorType = errorData.type
            errorMessage = `VAPI Error: ${errorData.type}`
          } else if (errorData.stage) {
            errorType = "stage_error"
            errorMessage = `Error during ${errorData.stage}`
          }

          // Handle specific VAPI error types
          switch (errorType) {
            case "cors":
              errorMessage =
                "CORS error: Please check your domain configuration in VAPI settings. Make sure your domain is whitelisted."
              console.error("CORS Error Details:", {
                currentDomain: window.location.origin,
                userAgent: navigator.userAgent,
                context: errorData.context,
              })
              console.error("CORS Resolution Steps:", {
                step1: "1. Go to your VAPI dashboard",
                step2: "2. Navigate to Settings > Web SDK",
                step3: "3. Add your domain to the allowed origins list",
                step4:
                  "4. Make sure to include both http://localhost:3000 (for development) and your production domain",
                step5: "5. Save the configuration and try again",
              })
              break
            case "pipeline-error-custom-llm-llm-failed":
              errorMessage = "AI model connection failed. Please try again."
              break
            case "invalid_request_error":
              errorMessage = "Invalid request configuration. Please check your settings."
              break
            case "authentication_error":
              errorMessage = "Authentication failed. Please check your API credentials."
              break
            case "rate_limit_error":
              errorMessage = "Rate limit exceeded. Please wait a moment and try again."
              break
            case "network_error":
              errorMessage = "Network connection failed. Please check your internet connection."
              break
            case "timeout_error":
              errorMessage = "Request timed out. Please try again."
              break
            case "ejected":
              // Already handled above, but just in case
              if (!callEndedRef.current) {
                callEndedRef.current = true
                setCallStatus(CallStatus.FINISHED)
              }
              return
            default:
              // Keep the original error message
              break
          }

          // Add context information if available
          if (errorData.context) {
            errorMessage += ` (Context: ${errorData.context})`
          }

          // Add stage information if available
          if (errorData.stage && errorType !== "stage_error") {
            errorMessage += ` (Stage: ${errorData.stage})`
          }

          setErrorMessage(errorMessage)
        }
      } else if (error instanceof Error) {
        console.error("VAPI Error:", error.message, error.stack)
        setErrorMessage(error.message)
      } else if (typeof error === "string") {
        console.error("VAPI Error (string):", error)
        setErrorMessage(error)
      } else {
        console.error("VAPI Error (unknown type):", error)
        setErrorMessage("An unexpected error occurred")
      }

      if (callStatus === CallStatus.ACTIVE || callStatus === CallStatus.CONNECTING) {
        setCallStatus(CallStatus.ERROR)
      }
    }

    vapi.on("call-start", onCallStart)
    vapi.on("call-end", onCallEnd)
    vapi.on("message", onMessage)
    vapi.on("speech-start", onSpeechStart)
    vapi.on("speech-end", onSpeechEnd)
    vapi.on("error", onError)

    return () => {
      vapi.off("call-start", onCallStart)
      vapi.off("call-end", onCallEnd)
      vapi.off("message", onMessage)
      vapi.off("speech-start", onSpeechStart)
      vapi.off("speech-end", onSpeechEnd)
      vapi.off("error", onError)
    }
  }, [callStatus])

  // Handle feedback generation or redirect when call finishes
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content)
    }

    // Live update Q&A as messages progress
    const livePairs = extractQAPairs(messages)
    setQaPairsState(livePairs)
    const { strengths: s, improvements: i, recommendations: r } = deriveInsights(livePairs)
    setStrengths(s)
    setImprovements(i)
    setRecommendations(r)

    const handleSaveInterview = async (messages) => {
      if (isProcessingFeedback) return

      setIsProcessingFeedback(true)
      console.log("[v0] Saving complete interview with", messages.length, "messages")

      try {
        // Extract Q&A pairs from conversation
        const qaPairs = extractQAPairs(messages)
        console.log("[v0] Extracted Q&A pairs:", qaPairs)

        if (qaPairs.length > 0) {
          // Get current insights
          const { strengths, improvements, recommendations } = deriveInsights(qaPairs)
          console.log("[v0] Generated insights:", { strengths, improvements, recommendations })

          const requestBody = {
            userId,
            type: type || "Technical",
            role: "Software Developer",
            level: "Medium",
            company: "",
            techstack: "",
            qaPairs,
            strengths,
            improvements,
            recommendations,
          }

          console.log("[v0] Sending request to save-interview API:", JSON.stringify(requestBody, null, 2))

          // Save complete interview data
          const response = await fetch("/api/interview/save-interview", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          })

          console.log("[v0] API Response status:", response.status)
          console.log("[v0] API Response ok:", response.ok)
          console.log("[v0] API Response headers:", Object.fromEntries(response.headers.entries()))

          const responseText = await response.text()
          console.log("[v0] API Response text:", responseText)

          if (!response.ok) {
            let errorData
            try {
              errorData = JSON.parse(responseText)
              console.log("[v0] Parsed error data:", errorData)
            } catch (parseError) {
              console.log("[v0] Could not parse error response as JSON")
              errorData = { error: responseText }
            }

            throw new Error(`Failed to save interview: ${errorData.error || responseText}`)
          }

          const data = JSON.parse(responseText)
          const savedInterviewId = data.interview._id
          setCreatedInterviewId(savedInterviewId)

          console.log("[v0] Interview saved successfully with ID:", savedInterviewId)

          // Redirect to results page
          router.push(`/interview/results?id=${savedInterviewId}`)
        } else {
          console.log("[v0] No Q&A pairs found")
        }
      } catch (error) {
        console.error("[v0] Error saving interview:", error)
        console.error("[v0] Error stack:", error.stack)
        setErrorMessage(`Failed to save interview data: ${error.message}`)
      } finally {
        setIsProcessingFeedback(false)
      }
    }

    if (callStatus === CallStatus.FINISHED && !isProcessingFeedback) {
      console.log("Interview finished, saving complete interview data...")
      handleSaveInterview(messages)
    }
  }, [messages, callStatus, userId, type, router, isProcessingFeedback])

  // Start call with Assistant
  const handleCall = useCallback(async () => {
    setCallStatus(CallStatus.CONNECTING)
    setErrorMessage("")
    callEndedRef.current = false

    try {
      // Validate environment variables
      if (!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
        throw new Error("VAPI Assistant ID is not configured")
      }

      if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
        throw new Error("VAPI Web Token is not configured")
      }

      // Check if VAPI is properly initialized
      if (!vapi || typeof vapi.start !== "function") {
        throw new Error("VAPI is not properly initialized")
      }

      // Log environment details for CORS debugging
      console.log("Environment Details:", {
        currentDomain: window.location.origin,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port,
        userAgent: navigator.userAgent,
        isLocalhost: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
        isHttps: window.location.protocol === "https:",
      })

      const assistantVariables = {
        username: userName,
        userid: userId,
      }

      if (questions && questions.length > 0) {
        assistantVariables.questions = questions.map((q) => `- ${q}`).join("\n")
      }

      console.log("Starting VAPI call with variables:", assistantVariables)
      console.log("VAPI Assistant ID:", process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID)
      console.log("VAPI Token configured:", !!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN)
      console.log("VAPI object:", vapi)

      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID, {
        variableValues: assistantVariables,
      })
    } catch (err) {
      console.error("Failed to start call:", err)
      console.error("Error details:", {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        type: typeof err,
        constructor: err?.constructor?.name,
        keys: err && typeof err === "object" ? Object.keys(err) : "N/A",
      })

      setCallStatus(CallStatus.INACTIVE)

      // Handle empty error objects specifically
      if (!err || (typeof err === "object" && Object.keys(err).length === 0)) {
        console.warn("Received empty error object from VAPI start")
        setErrorMessage("Failed to start the interview call. Please check your VAPI configuration.")
        return
      }

      // Provide more specific error messages
      if (err?.message?.includes("Assistant ID") || err?.message?.includes("assistant")) {
        setErrorMessage("VAPI configuration error: Invalid Assistant ID")
      } else if (
        err?.message?.includes("token") ||
        err?.message?.includes("auth") ||
        err?.message?.includes("unauthorized")
      ) {
        setErrorMessage("VAPI authentication error: Please check your API token")
      } else if (
        err?.message?.includes("network") ||
        err?.message?.includes("fetch") ||
        err?.message?.includes("connection")
      ) {
        setErrorMessage("Network error: Please check your internet connection")
      } else if (err?.message?.includes("permission") || err?.message?.includes("forbidden")) {
        setErrorMessage("Permission denied: Please check your VAPI account permissions")
      } else if (err?.message?.includes("timeout")) {
        setErrorMessage("Request timed out: Please try again")
      } else if (err?.message?.includes("rate limit") || err?.message?.includes("quota")) {
        setErrorMessage("Rate limit exceeded: Please wait a moment and try again")
      } else {
        setErrorMessage(`Failed to start the interview call: ${err?.message || "Unknown error"}`)
      }
    }
  }, [userName, userId, questions, type])

  // Auto-start the call if requested
  useEffect(() => {
    if (autoStart && callStatus === CallStatus.INACTIVE) {
      // Defer slightly to allow initial mount
      const t = setTimeout(() => {
        if (!callEndedRef.current) {
          try {
            handleCall()
          } catch (_) {}
        }
      }, 300)
      return () => clearTimeout(t)
    }
  }, [autoStart, callStatus, handleCall])

  // Extract Q&A pairs from conversation messages
  const extractQAPairs = (messages) => {
    const qaPairs = []
    let currentQuestion = ""

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]

      if (message.role === "assistant") {
        // This is likely a question from the AI
        currentQuestion = message.content
      } else if (message.role === "user" && currentQuestion) {
        // This is the user's answer to the current question
        qaPairs.push({
          question: currentQuestion,
          answer: message.content,
        })
        currentQuestion = ""
      }
    }

    return qaPairs
  }

  // Simple heuristic-based insights
  const deriveInsights = (pairs) => {
    const strengths = []
    const improvements = []
    const recommendations = []

    if (pairs.length === 0) return { strengths, improvements, recommendations }

    const avgAnswerLength = pairs.reduce((s, p) => s + p.answer.split(" ").length, 0) / pairs.length
    if (avgAnswerLength >= 18) strengths.push("Provides detailed, well-elaborated answers")
    else improvements.push("Elaborate more on key points with supporting details")

    const containsExamples = pairs.some((p) => /for example|for instance|e\.g\.|example/i.test(p.answer))
    if (containsExamples) strengths.push("Includes concrete examples to justify answers")
    else recommendations.push("Incorporate real examples or metrics to strengthen points")

    const mentionsProcess = pairs.some((p) => /steps|process|approach|architecture|design/i.test(p.answer))
    if (mentionsProcess) strengths.push("Explains reasoning and approach clearly")
    else improvements.push("Explain the approach or steps taken to reach the answer")

    const mentionsTools = pairs.some((p) =>
      /react|node|next|docker|kubernetes|aws|gcp|azure|mongodb|postgres|redis|ci\/?cd/i.test(p.answer),
    )
    if (mentionsTools) strengths.push("Demonstrates familiarity with relevant tools/technologies")
    else recommendations.push("Reference relevant tools, libraries, or patterns where applicable")

    // De-duplicate entries
    const dedupe = (arr) => Array.from(new Set(arr))
    return {
      strengths: dedupe(strengths).slice(0, 5),
      improvements: dedupe(improvements).slice(0, 5),
      recommendations: dedupe(recommendations).slice(0, 5),
    }
  }

  // End call
  const handleDisconnect = () => {
    if (!callEndedRef.current) {
      callEndedRef.current = true
      setCallStatus(CallStatus.FINISHED)
    }

    try {
      vapi.stop()
    } catch (err) {
      console.error("Failed to stop call:", err)
    }

    console.log("Call ended, interview data will be saved and then redirect to results page")
  }

  // Reset error state
  const handleRetry = () => {
    setCallStatus(CallStatus.INACTIVE)
    setErrorMessage("")
    setMessages([])
    callEndedRef.current = false
  }

  // Highlight helper classes
  const aiHighlight = callStatus === CallStatus.ACTIVE && isSpeaking ? "ring-2 ring-cyan-500 border-cyan-500" : ""
  const userHighlight = callStatus === CallStatus.ACTIVE && !isSpeaking ? "ring-2 ring-cyan-500 border-cyan-500" : ""

  return (
    <div className={layout === "split" ? "w-full p-6" : "flex flex-col items-center space-y-6 p-6"}>
      {layout === "split" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: AI */}
          <div
            className={`h-full flex flex-col items-center bg-slate-800/50 border border-slate-700 rounded-xl p-6 transition-all ${aiHighlight}`}
          >
            <div className="relative">
              <Image src="/ai-avatar.png" alt="AI" width={128} height={128} className="rounded-full" />
              {isSpeaking && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <h3 className="mt-3 font-semibold text-white">AI Interviewer</h3>
          </div>

          {/* Right: User */}
          <div
            className={`h-full flex flex-col items-center bg-slate-800/50 border border-slate-700 rounded-xl p-6 transition-all ${userHighlight}`}
          >
            <Image
              src={profileImage || "/placeholder.svg"}
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
                      <p className="text-cyan-300 font-medium">
                        Q{idx + 1}: {p.question}
                      </p>
                      <p className="text-neutral-300">A: {p.answer}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <div>
                  <h5 className="text-white font-semibold">Strengths</h5>
                  <ul className="mt-2 list-disc list-inside text-neutral-300 space-y-1">
                    {strengths.length === 0 ? (
                      <li className="text-neutral-500">Will appear as you answer</li>
                    ) : (
                      strengths.map((s, i) => <li key={i}>{s}</li>)
                    )}
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold">Areas for Improvement</h5>
                  <ul className="mt-2 list-disc list-inside text-neutral-300 space-y-1">
                    {improvements.length === 0 ? (
                      <li className="text-neutral-500">Will appear as you answer</li>
                    ) : (
                      improvements.map((s, i) => <li key={i}>{s}</li>)
                    )}
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold">Recommendations</h5>
                  <ul className="mt-2 list-disc list-inside text-neutral-300 space-y-1">
                    {recommendations.length === 0 ? (
                      <li className="text-neutral-500">Will appear as you answer</li>
                    ) : (
                      recommendations.map((s, i) => <li key={i}>{s}</li>)
                    )}
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
              <Image src="/ai-avatar.png" alt="AI" width={80} height={80} className="rounded-full" />
              {isSpeaking && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <h3 className="mt-2 font-semibold">AI Interviewer</h3>
          </div>

          {/* User */}
          <div className="flex flex-col items-center border rounded-xl p-4 shadow-md">
            <Image
              src={profileImage || "/placeholder.svg"}
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
              <p key={lastMessage} className="text-gray-800 transition-opacity duration-500 animate-fadeIn">
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
                      <p className="font-medium">
                        Q{idx + 1}: {p.question}
                      </p>
                      <p>A: {p.answer}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold">Strengths</h5>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {strengths.length === 0 ? (
                      <li className="text-neutral-500">Will appear as you answer</li>
                    ) : (
                      strengths.map((s, i) => <li key={i}>{s}</li>)
                    )}
                  </ul>
                </div>
                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold">Areas for Improvement</h5>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {improvements.length === 0 ? (
                      <li className="text-neutral-500">Will appear as you answer</li>
                    ) : (
                      improvements.map((s, i) => <li key={i}>{s}</li>)
                    )}
                  </ul>
                </div>
                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold">Recommendations</h5>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {recommendations.length === 0 ? (
                      <li className="text-neutral-500">Will appear as you answer</li>
                    ) : (
                      recommendations.map((s, i) => <li key={i}>{s}</li>)
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Agent
