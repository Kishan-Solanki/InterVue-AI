"use client";
import React, { Component } from "react";
import Image from "next/image";   
import CardSwap, { Card } from "./comps/CardSwap";
import TextType from "./comps/TextType";
import Button from "./Button";

export class Hero extends Component {
    handleStart = async () => {
        try {
            const res = await fetch("/api/user/get-data", { credentials: "include" });
            if (res.ok) {
                window.location.href = "/dashboard";
            } else {
                window.location.href = "/login";
            }
        } catch (e) {
            window.location.href = "/login";
        }
    };

    render() {
        return (
            <div className="relative h-[90vh] w-full flex items-center">
                <div className="w-1/2 h-full flex items-center justify-center flex-col z-10">
                    <TextType
                        text={[
                            "Ace Your Interviews & Vivas with AI-Powered Smart Practice!",
                            "Beyond Mock Interviews: enhance cognitive, communicative and comprehensive skills",
                            "Unlock Your Potential with Intervue Smarter.",
                        ]}
                        typingSpeed={75}
                        pauseDuration={1500}
                        showCursor={true}
                        cursorCharacter="|"
                    />
                    <p className="max-w-xl text-lg text-gray-300 mt-8 md:mx-0">
                        Intervue offers a unique AI-driven closed-loop learning system practice with intelligent evaluation that pinpoints weaknesses, then receive targeted resource recommendations to precisely address them.
                    </p>
                    <div className="mt-10">
                        <Button title="Start a Project" onClick={this.handleStart} />
                    </div>
                </div>

                <div className="relative w-1/2 h-full overflow-hidden">
                    <CardSwap cardDistance={60} verticalDistance={70} delay={5000} pauseOnHover={false}>
                        <Card className="bg-white overflow-hidden ">
                            <div className="absolute bottom-0 mx-auto bg-white/30 backdrop-blur text-center ml-[2%] w-[96%] mb-[2%] rounded-md text-black">
                                <h3 className="text-2xl font-bold mb-3">Customizable Learning & Future-Ready</h3>
                                <p className="mb-4">
                                    Elect interview topics based on specific technologies, company requirements, or subjects like DBMS, OS, and CN. Vigilant mode with webcam for integrity in anticipation years. Empowering students with autonomy.
                                </p>
                            </div>
                            <div className="w-full h-full -z-10 relative">
                                <Image
                                    src="/2.png"
                                    alt="AI interviewing a student"
                                    fill
                                    className="inset-0 w-full h-full object-cover rounded-md"
                                    priority
                                />
                            </div>
                        </Card>

                        <Card className="bg-white overflow-hidden ">
                            <div className="absolute bottom-0 mx-auto bg-white/30 backdrop-blur text-center ml-[2%] w-[96%] mb-[2%] rounded-md text-black">
                                <h3 className="text-2xl font-bold mb-3">AI-Powered Practice for Interviews & Viva</h3>
                                <p className="mb-4">
                                    Prepare for technical interviews, HR rounds, and viva examinations across various domains with Intervue&apos;s generative AI. Practice real questions without a human interviewer.
                                </p>
                            </div>
                            <div className="w-full h-full -z-10 relative">
                                <Image
                                    src="/3.png"
                                    alt="AI interviewing a student"
                                    fill
                                    className="inset-0 w-full h-full object-cover rounded-md"
                                />
                            </div>
                        </Card>

                        <Card className="bg-white overflow-hidden ">
                            <div className="absolute bottom-0 mx-auto bg-white/30 backdrop-blur text-center ml-[2%] w-[96%] mb-[2%] rounded-md text-black">
                                <h3 className="text-2xl font-bold mb-3">Personalized Feedback & Improvement</h3>
                                <p className="mb-4">
                                    Our LLM evaluates your responses, scores answers, and provides detailed feedback, highlighting your weaknesses. Get intelligent recommendations for tutorials, videos, and topic-based improvement tips.
                                </p>
                            </div>
                            <div className="w-full h-full -z-10 relative">
                                <Image
                                    src="/1.png"
                                    alt="AI interviewing a student"
                                    fill
                                    className="inset-0 w-full h-full object-cover rounded-md"
                                />
                            </div>
                        </Card>
                    </CardSwap>
                </div>
            </div>
        );
    }
}

export default Hero;
