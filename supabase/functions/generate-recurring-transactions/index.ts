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
    // Authentication: Verify the request is authorized
    const authHeader = req.headers.get("authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Allow either JWT token (for admin users) or service role key (for scheduled jobs)
    const token = authHeader.replace("Bearer ", "");
    
    // Check if it's the service role key (for cron jobs)
    const isCronJob = serviceRoleKey && token === serviceRoleKey;
    
    if (!isCronJob) {
      // Verify JWT token for authenticated users
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError || !user) {
        console.error("Invalid authentication token:", userError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid authentication" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Authenticated user ${user.id} triggered recurring transactions`);
    } else {
      console.log("Cron job authenticated via service role key");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];
    console.log(`Processing recurring transactions for: ${today}`);

    // Get all recurring expenses that need generation
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("is_recurring", true)
      .not("recurrence_type", "is", null);

    if (fetchError) {
      console.error("Error fetching recurring expenses:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringExpenses?.length || 0} recurring templates`);

    const newEntries = [];

    for (const expense of recurringExpenses || []) {
      const lastGenerated = expense.last_generated_date
        ? new Date(expense.last_generated_date)
        : new Date(expense.date);
      
      const daysSince = Math.floor(
        (new Date(today).getTime() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let shouldGenerate = false;
      if (expense.recurrence_type === "weekly" && daysSince >= 7) {
        shouldGenerate = true;
      } else if (expense.recurrence_type === "monthly" && daysSince >= 30) {
        shouldGenerate = true;
      }

      if (shouldGenerate) {
        console.log(`Generating new entry for: ${expense.title}`);
        
        // Create new expense entry
        const { error: insertError } = await supabase.from("expenses").insert({
          user_id: expense.user_id,
          amount: expense.amount,
          title: expense.title,
          date: today,
          is_income: expense.is_income,
          category_name: expense.category_name,
          split_with: expense.split_with,
          is_impulse: false,
          is_recurring: false,
          recurrence_type: null,
        });

        if (insertError) {
          console.error(`Error creating entry for ${expense.title}:`, insertError);
          continue;
        }

        // Update last_generated_date on the template
        const { error: updateError } = await supabase
          .from("expenses")
          .update({ last_generated_date: today })
          .eq("id", expense.id);

        if (updateError) {
          console.error(`Error updating last_generated_date for ${expense.title}:`, updateError);
        } else {
          newEntries.push(expense.title);
        }
      }
    }

    console.log(`Successfully generated ${newEntries.length} recurring entries`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: newEntries.length,
        entries: newEntries,
        date: today
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-recurring-transactions function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
