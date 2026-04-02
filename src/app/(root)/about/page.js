"use client";

import { FloatingDock } from "@/app/component/comps/FloatingDock ";
import { motion } from "framer-motion";
import { Sparkles, Brain, GraduationCap, Users } from "lucide-react";
import {
  IconBrandGithub, IconHome, IconLogout, IconMicrophone,
  IconReportAnalytics, IconHistory,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  // Define handleLogout BEFORE using it in links array
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const links = [
    { title: "Home", icon: <IconHome className="h-full w-full" />, href: "/" },
    //uncomment this immedietly 
    //{ title: "GitHub", icon: <IconBrandGithub className="h-full w-full" />, href: "https://github.com/Kishan-Solanki/InterVue-AI" },
    { title: "Logout", icon: <IconLogout className="h-full w-full" />, onClick: handleLogout },
  ];
  
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-6 py-16 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[45rem] h-[45rem] rounded-full bg-gradient-to-r from-teal-500/30 via-cyan-500/20 to-blue-600/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[25rem] h-[25rem] rounded-full bg-gradient-to-r from-purple-500/20 via-pink-400/10 to-cyan-500/20 blur-3xl animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        {/* Animated AI Title */}
        <motion.h1
          className="relative text-5xl md:text-7xl font-extrabold tracking-wide mb-10 drop-shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <span className="animate-gradient">IntervueAI</span>

          {/* Neon glow pulse */}
          <motion.span
            className="absolute inset-0 blur-2xl bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 opacity-30"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          An AI-powered platform designed to revolutionize how students prepare
          for interviews and viva exams. With smart feedback, realistic
          simulations, and next-gen evaluation, IntervueAI helps you practice,
          learn, and grow with confidence.
        </motion.p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {[
          {
            title: "Smart Interview Practice",
            desc: "Simulated AI-driven interviews with instant feedback on your answers.",
            icon: <Brain className="w-10 h-10 text-cyan-400" />,
          },
          {
            title: "Personalized Feedback",
            desc: "NLP-powered evaluations with tailored improvement tips and tutorials.",
            icon: <Sparkles className="w-10 h-10 text-teal-400" />,
          },
          {
            title: "Wide Coverage",
            desc: "Practice technical, HR, and viva questions across domains and companies.",
            icon: <GraduationCap className="w-10 h-10 text-blue-400" />,
          },
          {
            title: "Future Ready",
            desc: "Proctoring, group discussions, resume analysis, and emotion tracking.",
            icon: <Users className="w-10 h-10 text-purple-400" />,
          },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 hover:border-cyan-400/50 transition-all duration-300"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-black/50 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
            </div>
            <p className="text-gray-300">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Closing */}
      <motion.div
        className="mt-20 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed text-lg">
          <span className="font-semibold text-cyan-400">IntervueAI</span> is
          more than a tool – it&apos;s your{" "}
          <span className="text-white font-bold">AI-powered mentor</span>,
          guiding you to success in placements, assessments, and beyond.
        </p>
      </motion.div>
      <div className="fixed bottom-4 left-0 w-fit bg-red-400  z-50 text-black">
        <FloatingDock items={links} />
      </div>

      {/* Gradient animation styles */}
      <style jsx>{`
        .animate-gradient {
          background: linear-gradient(
            270deg,
            #14b8a6,
            #06b6d4,
            #2563eb,
            #14b8a6
          );
          background-size: 600% 600%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 6s ease infinite;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

    </main>
  );
}