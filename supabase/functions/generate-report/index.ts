import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { intake_session_id, user_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch intake session
    const intakeRes = await fetch(
      `${SUPABASE_URL}/rest/v1/intake_sessions?id=eq.${intake_session_id}&select=*&limit=1`,
      { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const intakes = await intakeRes.json();
    if (!intakes || intakes.length === 0) throw new Error("Intake session not found");
    const intake = intakes[0];

    const prompt = `Generate a professional mental health intake summary report for a clinical therapist. Use the following intake data: ${JSON.stringify(intake.structured_features)}.

Format the report in markdown with these sections:

## Patient Intake Summary

**Date:** ${new Date(intake.completed_at || intake.created_at).toLocaleDateString()}
**Severity Level:** ${intake.severity_level || "Not determined"}

## Primary Concerns

Write 2-3 sentences about main concerns based on the structured features.

## Symptom Profile

Bullet points covering: frequency, duration, functional impact score, sleep impact, work impact.

## Risk Assessment

Risk level with brief explanation. If crisis_flag is true write: CRISIS FLAG ACTIVE — immediate clinical attention required.

## Suggested Diagnostic Codes

ICD-10: ${intake.icd10_suggestion || "Pending"} — provide description
CPT: ${intake.cpt_suggestion || "Pending"} — provide description

## Recommended Care Pathway

Group or individual recommendation with brief rationale.

## Clinical Notes

2-3 sentences summarizing key observations from intake.

Keep the tone clinical and professional. Do not include personally identifying information other than age and language.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a clinical report generator for a mental health platform. Generate professional, clinical reports in markdown format." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const t = await aiResponse.text();
      console.error("AI error:", aiResponse.status, t);
      throw new Error("Failed to generate report");
    }

    const aiData = await aiResponse.json();
    const reportMarkdown = aiData.choices?.[0]?.message?.content || "";

    // Save report
    await fetch(`${SUPABASE_URL}/rest/v1/patient_reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id,
        intake_session_id,
        report_markdown: reportMarkdown,
      }),
    });

    return new Response(JSON.stringify({ report_markdown: reportMarkdown }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
