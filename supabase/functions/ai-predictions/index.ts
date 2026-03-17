import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recent disaster reports for context
    const { data: reports } = await supabase
      .from("disaster_reports")
      .select("disaster_type, severity, location_name, location_lat, location_lng, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const prompt = `You are a disaster prediction AI. Based on the following recent disaster reports, predict 3-5 potential disasters that could occur in the near future. For each prediction, provide:
- disaster_type (one of: earthquake, flood, fire, hurricane, tornado, tsunami, landslide, drought, other)
- probability (0.0 to 1.0)
- location_lat and location_lng (approximate coordinates)
- location_name
- description (why this is predicted)
- predicted_date (YYYY-MM-DD format, within next 30 days)

Recent reports:
${JSON.stringify(reports || [], null, 2)}

If there are no reports, generate realistic predictions based on global disaster patterns.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a disaster prediction system. Return predictions as JSON." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_predictions",
            description: "Save disaster predictions",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      disaster_type: { type: "string", enum: ["earthquake", "flood", "fire", "hurricane", "tornado", "tsunami", "landslide", "drought", "other"] },
                      probability: { type: "number" },
                      location_lat: { type: "number" },
                      location_lng: { type: "number" },
                      location_name: { type: "string" },
                      description: { type: "string" },
                      predicted_date: { type: "string" },
                    },
                    required: ["disaster_type", "probability", "location_lat", "location_lng", "description"],
                  },
                },
              },
              required: ["predictions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_predictions" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No predictions returned");

    const { predictions } = JSON.parse(toolCall.function.arguments);

    // Save to database
    for (const pred of predictions) {
      await supabase.from("predictions").insert({
        disaster_type: pred.disaster_type,
        probability: pred.probability,
        location_lat: pred.location_lat,
        location_lng: pred.location_lng,
        location_name: pred.location_name || null,
        description: pred.description,
        predicted_date: pred.predicted_date || null,
      });
    }

    return new Response(JSON.stringify({ success: true, count: predictions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Prediction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
