import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: categories } = await supabase
      .from("user_categories")
      .select("name")
      .eq("user_id", user.id);

    const { data: recentExpenses } = await supabase
      .from("expenses")
      .select("title, category_name")
      .eq("user_id", user.id)
      .eq("is_income", false)
      .not("category_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    const categoryList = categories?.map((c) => c.name).join(", ") || "No categories yet";
    const recentContext = recentExpenses
      ?.map((e) => `"${e.title}" -> ${e.category_name}`)
      .join("; ") || "No recent expenses";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ suggestedCategory: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a finance tracking assistant. Based on the transaction title "${title}", suggest the most appropriate category from the user's existing categories: ${categoryList}.

Recent spending patterns: ${recentContext}

Respond with ONLY the category name (exact match from the list), or null if no good match exists. Do not explain or provide any other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      return new Response(
        JSON.stringify({ suggestedCategory: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const suggestedCategory = aiData.choices?.[0]?.message?.content?.trim() || null;

    const validCategory = categories?.some((c) => c.name === suggestedCategory)
      ? suggestedCategory
      : null;

    return new Response(
      JSON.stringify({ suggestedCategory: validCategory }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in suggest-category:", error);
    return new Response(
      JSON.stringify({ suggestedCategory: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});