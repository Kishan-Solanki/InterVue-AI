"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  profileImage,
}) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("");

  // Event handlers
  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error) => {
      if (error instanceof Error) {
        console.error("VAPI Error:", error.message, error.stack);
      } else {
        try {
          console.error("VAPI Error object:", JSON.stringify(error, null, 2));
        } catch {
          console.error("VAPI Error (raw):", error);
        }
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
  }, []);

  // Update last message and handle feedback
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages) => {
      console.log("handleGenerateFeedback called with:", messages.length, "messages");
      // TODO: integrate createFeedback API if needed
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  // Start call with Assistant
  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    try {
      let assistantVariables = { username: userName, userid: userId };

      if (questions && questions.length > 0) {
        assistantVariables.questions = questions.map((q) => `- ${q}`).join("\n");
      }

      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID, {
        variableValues: assistantVariables,
      });
    } catch (err) {
      console.error("Failed to start call:", err instanceof Error ? err.message : err);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  // End call
  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    try {
      vapi.stop();
    } catch (err) {
      console.error("Failed to stop call:", err);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
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
      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition relative"
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            {callStatus === CallStatus.CONNECTING ? "Connecting..." : "Start Call"}
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
    </div>
  );
};

export default Agent;
