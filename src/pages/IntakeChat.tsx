import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";
import { Heart, Send, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

type Msg = { role: "ai" | "user"; text: string };

const initialMessages: Msg[] = [
  { role: "ai", text: "Hi there! I'm here to help understand what you're going through. This is a safe, private space. Let's start — how have you been feeling over the past couple of weeks?" },
];

const IntakeChat = () => {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [step] = useState(1);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Thank you for sharing that. Can you tell me how often you've been experiencing these feelings — is it daily, a few times a week, or less frequently?" },
      ]);
    }, 1200);
  };

  return (
    <PageTransition>
      <div className="flex flex-col h-screen bg-background">
        {/* Top bar */}
        <div className="border-b bg-card px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">HereForYou</span>
          </div>
          <div className="flex-1 mx-8">
            <div className="h-2 bg-muted rounded-full max-w-xs mx-auto">
              <div
                className="h-2 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
          <Button variant="ghost" size="sm">Save & Exit</Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-[680px] mx-auto space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold mr-3 flex-shrink-0 mt-1">
                    H
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border shadow-sm rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-card px-4 py-3">
          <p className="text-center text-xs text-muted-foreground mb-2">This conversation is private and secure.</p>
          <div className="max-w-[680px] mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type your response…"
              className="flex-1"
            />
            <Button onClick={send} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default IntakeChat;
