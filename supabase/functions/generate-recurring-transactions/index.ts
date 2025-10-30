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
