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

    // Get all recurring expenses
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("is_recurring", true)
      .not("recurrence_type", "is", null);

    if (fetchError) {
      console.error("Error fetching recurring expenses:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringExpenses?.length || 0} recurring expenses`);

    const newEntries = [];

    for (const expense of recurringExpenses || []) {
      const lastGenerated = expense.last_generated_date
        ? new Date(expense.last_generated_date)
        : new Date(expense.date);
      
      const shouldGenerate = (recurrenceType: string) => {
        const daysSince = Math.floor(
          (new Date(today).getTime() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (recurrenceType === "weekly" && daysSince >= 7) return true;
        if (recurrenceType === "monthly" && daysSince >= 30) return true;
        return false;
      };

      if (shouldGenerate(expense.recurrence_type)) {
        console.log(`Generating new entry for expense: ${expense.title}`);
        
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
          console.error(`Error creating new entry for ${expense.title}:`, insertError);
          continue;
        }

        // Update last_generated_date
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

    console.log(`Generated ${newEntries.length} new recurring entries`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: newEntries.length,
        entries: newEntries 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-recurring function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
