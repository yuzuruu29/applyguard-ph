import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { supabase } from "../lib/supabase.js";

export default function MockInterviewPage() {
  const { user, tier } = useAuth();
  const { notify } = useApp();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Job context state
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Premium check
    if (!user) {
      notify("Please sign in first.", "info");
      navigate("/account");
    } else if (tier !== "premium") {
      notify("Mock Interview is a Premium feature.", "warn");
      navigate("/offers");
    }
  }, [user, tier, navigate, notify]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      notify("Your browser doesn't support speech recognition. Try Chrome or Edge.", "error");
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserSpeech(transcript);
      };
      
      rec.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        if (event.error !== "no-speech") {
          notify("Microphone error: " + event.error, "error");
        }
      };
      
      rec.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(rec);
    }

    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      notify("Camera/Microphone access is required for the mock interview.", "error");
    }
  };

  const speak = (text) => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes("en") && v.name.includes("Google")) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // continue even if TTS fails
      window.speechSynthesis.speak(utterance);
    });
  };

  const handleStartInterview = async () => {
    if (!jobDescription.trim() || !role.trim()) {
      notify("Please provide the target role and job description.", "error");
      return;
    }
    
    await startCamera();
    setHasStarted(true);

    const initialMessage = {
      role: "user",
      content: `I am applying for the role of ${role}. Here is the job description:\n\n${jobDescription}\n\nPlease start the interview by introducing yourself as the hiring manager and asking the first question.`
    };
    
    const newMessages = [initialMessage];
    setMessages(newMessages);
    await callAIProxy(newMessages);
  };

  const handleUserSpeech = async (transcript) => {
    setIsRecording(false);
    
    const newMessages = [...messages, { role: "user", content: transcript }];
    setMessages(newMessages);
    
    await callAIProxy(newMessages);
  };

  const callAIProxy = async (currentMessages) => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          feature: "interview_voice",
          messages: currentMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");

      const aiText = data.text;
      setMessages(prev => [...prev, { role: "assistant", content: aiText }]);
      
      // Speak the response
      await speak(aiText);
      
    } catch (err) {
      console.error(err);
      notify(err.message || "Failed to reach AI.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  if (!user || tier !== "premium") return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Voice Mock Interview</h1>
        <p className="mt-2 text-ink-soft">Practice answering questions live with our AI hiring manager.</p>
      </header>

      {!hasStarted ? (
        <section className="rounded-3xl border border-line bg-card p-6">
          <h2 className="font-display text-xl text-ink mb-4">Interview Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink">Target Role</label>
              <input 
                type="text" 
                value={role} 
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="mt-1 w-full rounded-xl border border-line bg-paper px-4 py-2 outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Job Description</label>
              <textarea 
                value={jobDescription} 
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={6}
                className="mt-1 w-full rounded-xl border border-line bg-paper px-4 py-2 outline-none focus:border-brand"
              />
            </div>
            <button 
              onClick={handleStartInterview}
              className="w-full rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep transition-all"
            >
              Start Interview (Requires Camera & Mic)
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-lg">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="h-full w-full object-cover transform -scale-x-100"
            />
            {/* AI Status Overlay */}
            <div className="absolute top-4 left-4 rounded-full bg-black/60 px-4 py-2 backdrop-blur-md flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isProcessing ? 'bg-brand animate-pulse' : 'bg-go'}`}></div>
              <span className="text-sm font-medium text-white">
                {isProcessing ? "AI is thinking..." : "AI Interviewer (Active)"}
              </span>
            </div>
            {/* User Recording Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <button 
                onClick={toggleRecording}
                disabled={isProcessing}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-xl transition-all ${
                  isProcessing ? 'bg-gray-500 opacity-50 cursor-not-allowed' :
                  isRecording ? 'bg-stop text-white animate-pulse' : 'bg-paper text-ink hover:scale-105'
                }`}
              >
                {isRecording ? "⏹️" : "🎙️"}
              </button>
            </div>
          </div>

          {/* Transcript / Conversation */}
          <div className="rounded-3xl border border-line bg-card p-6 h-64 overflow-y-auto space-y-4">
            {messages.filter(m => m.role === "assistant" || (m.role === "user" && m !== messages[0])).map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <span className="mb-1 text-xs font-semibold text-ink-faint">
                  {m.role === "user" ? "You" : "AI Interviewer"}
                </span>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user" ? "bg-brand text-paper" : "bg-paper border border-line text-ink"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isRecording && (
              <div className="flex flex-col items-end">
                <span className="mb-1 text-xs font-semibold text-ink-faint">You</span>
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-brand/50 text-paper italic">
                  Listening...
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
