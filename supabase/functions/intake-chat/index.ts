import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a warm, empathetic clinical intake assistant for HereForYou, a licensed mental health platform. Your job is to conduct a structured 5-7 minute intake conversation. Ask about: symptom frequency, duration, functional impact (work/sleep/relationships), risk indicators, and substance use if relevant. Ask one question at a time. Use plain, non-clinical language. Do NOT diagnose. Do NOT provide therapy.

If the user expresses suicidal ideation, thoughts of self-harm, or immediate danger, output a JSON object with crisis_flag: true immediately and stop the conversation wrapped in <INTAKE_SUMMARY> tags.

After 8-12 exchanges, output a final JSON summary wrapped in <INTAKE_SUMMARY> tags with these fields:
{
  "symptom_frequency": "daily|weekly|occasional",
  "duration_weeks": number,
  "functional_impact": number (1-10),
  "risk_level": "low|moderate|high",
  "substance_use": boolean,
  "primary_concern": "string",
  "crisis_flag": boolean,
  "suggested_icd10": "string (e.g. F41.1)",
  "suggested_cpt": "string (e.g. 90837)",
  "confidence": number (0-1)
}

Keep the JSON inside <INTAKE_SUMMARY> tags like: <INTAKE_SUMMARY>{"key":"value"}</INTAKE_SUMMARY>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, user_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build messages for the AI - system prompt is separate
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    // Check for intake summary in the reply
    let intake_summary = null;
    const summaryMatch = reply.match(/<INTAKE_SUMMARY>([\s\S]*?)<\/INTAKE_SUMMARY>/);
    if (summaryMatch) {
      try {
        intake_summary = JSON.parse(summaryMatch[1].trim());
      } catch (e) {
        console.error("Failed to parse intake summary:", e);
      }
    }

    // Log to audit_log
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    await fetch(`${SUPABASE_URL}/rest/v1/audit_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        agent_name: "intake-chat",
        user_id: user_id || null,
        action: intake_summary ? "intake_completed" : "intake_message",
        input_summary: (messages[messages.length - 1]?.content || "").substring(0, 200),
        output_summary: reply.substring(0, 200),
        confidence: intake_summary?.confidence || null,
      }),
    });

    return new Response(JSON.stringify({ reply, intake_summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intake-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
