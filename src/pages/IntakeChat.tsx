import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";
import { Heart, Send, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const IntakeChat = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Calculate progress step from message count
  const msgCount = messages.length;
  const step = msgCount <= 2 ? 1 : msgCount <= 4 ? 2 : msgCount <= 6 ? 3 : msgCount <= 8 ? 4 : 5;

  // Create intake session on mount
  useEffect(() => {
    const createSession = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("intake_sessions")
        .insert({ user_id: user.id, status: "in_progress" as const })
        .select("id")
        .single();
      if (data) sessionIdRef.current = data.id;
    };
    createSession();
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Send first AI message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setLoading(true);
      callAI([]).then(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callAI = async (currentMessages: Msg[]) => {
    try {
      const { data, error } = await supabase.functions.invoke("intake-chat", {
        body: { messages: currentMessages, user_id: user?.id },
      });

      if (error) throw error;

      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }

      const reply = data.reply as string;
      // Strip <INTAKE_SUMMARY> tags from displayed text
      const displayReply = reply.replace(/<INTAKE_SUMMARY>[\s\S]*?<\/INTAKE_SUMMARY>/g, "").trim();

      const newMessages: Msg[] = [...currentMessages, { role: "assistant", content: displayReply }];
      setMessages(newMessages);

      // Check for intake summary
      if (data.intake_summary) {
        await saveIntakeSummary(data.intake_summary, currentMessages);
      }
    } catch (err: any) {
      toast({ title: err.message || "Failed to get AI response", variant: "destructive" });
    }
  };

  const saveIntakeSummary = async (summary: any, conversationMessages: Msg[]) => {
    if (!sessionIdRef.current || !user) return;
    try {
      const severityMap: Record<string, "low" | "moderate" | "high"> = {
        low: "low", moderate: "moderate", high: "high"
      };
      await supabase
        .from("intake_sessions")
        .update({
          status: summary.crisis_flag ? "escalated" as const : "completed" as const,
          completed_at: new Date().toISOString(),
          conversation_json: conversationMessages as any,
          structured_features: summary as any,
          severity_level: severityMap[summary.risk_level] || "moderate" as const,
          confidence_score: summary.confidence,
          icd10_suggestion: summary.suggested_icd10,
          cpt_suggestion: summary.suggested_cpt,
          crisis_flag: summary.crisis_flag || false,
          human_review_required: (summary.confidence || 0) < 0.7,
        })
        .eq("id", sessionIdRef.current);

      if (summary.crisis_flag) {
        await supabase.from("crisis_events").insert({
          user_id: user.id,
          intake_session_id: sessionIdRef.current,
        });
      }

      toast({ title: "Assessment complete!" });
      setTimeout(() => navigate("/results"), 1000);
    } catch (err: any) {
      toast({ title: "Error saving assessment", variant: "destructive" });
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    await callAI(newMessages);
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="flex flex-col h-screen bg-background">
        {/* Top bar */}
        <div className="border-b bg-card px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard/patient" className="text-muted-foreground hover:text-foreground transition-colors">
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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/patient">Save & Exit</Link>
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-[680px] mx-auto space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
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
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold mr-3 flex-shrink-0 mt-1">
                  H
                </div>
                <div className="bg-card border shadow-sm rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-card px-4 py-3">
          <p className="text-center text-xs text-muted-foreground mb-2">This conversation is private and secure.</p>
          <div className="max-w-[680px] mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && send()}
              placeholder="Type your response…"
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={send} size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default IntakeChat;
