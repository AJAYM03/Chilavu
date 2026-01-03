import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

interface BudgetGoalProps {
  dateRange: { start: string; end: string };
}

export const BudgetGoal = ({ dateRange }: BudgetGoalProps) => {
  const selectedDate = parseISO(dateRange.start);
  const currentMonthYear = format(selectedDate, "yyyy-MM");

  const { data: budgetData = { budgetAmount: 0, spent: 0 } } = useQuery({
    queryKey: ["budget-goal", currentMonthYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { budgetAmount: 0, spent: 0 };

      const { data: budget } = await supabase
        .from("budget_goals")
        .select("amount")
        .eq("month_year", currentMonthYear)
        .eq("user_id", user.id)
        .maybeSingle();

      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .eq("is_income", false)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

      const totalSpent = expenses?.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      ) || 0;

      return {
        budgetAmount: budget?.amount || 0,
        spent: totalSpent,
      };
    },
  });

  const percentage = budgetData.budgetAmount
    ? Math.min((budgetData.spent / budgetData.budgetAmount) * 100, 100)
    : 0;

  const actualPercentage = budgetData.budgetAmount
    ? (budgetData.spent / budgetData.budgetAmount) * 100
    : 0;

  const remaining = Math.max(0, budgetData.budgetAmount - budgetData.spent);
  const isOver = budgetData.spent > budgetData.budgetAmount;
  const isClose = actualPercentage > 80 && actualPercentage <= 100;

  // Status message
  const getStatusMessage = () => {
    if (!budgetData.budgetAmount) return "Set a monthly budget to track spending";
    if (isOver) return "You've exceeded your budget this month";
    if (isClose) return "Getting close to your limit";
    if (actualPercentage < 50) return "Great job! Spending is on track";
    return "You're doing well, keep it up!";
  };

  const StatusIcon = isOver ? AlertTriangle : isClose ? AlertTriangle : TrendingUp;

  return (
    <Card className={isOver ? 'border-destructive/30' : isClose ? 'border-warning/30' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Monthly Budget</CardTitle>
          </div>
          {budgetData.budgetAmount > 0 && (
            <span className={`text-sm font-medium ${isOver ? 'text-destructive' : isClose ? 'text-warning' : 'text-muted-foreground'}`}>
              {actualPercentage.toFixed(0)}%
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {budgetData.budgetAmount > 0 ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Spent: <span className="font-semibold text-foreground">₹{budgetData.spent.toFixed(0)}</span>
              </span>
              <span className="text-muted-foreground">
                Budget: <span className="font-semibold text-foreground">₹{budgetData.budgetAmount.toFixed(0)}</span>
              </span>
            </div>

            <Progress 
              value={percentage} 
              className={`h-3 ${
                isOver 
                  ? "[&>div]:bg-destructive" 
                  : isClose 
                  ? "[&>div]:bg-warning" 
                  : "[&>div]:bg-primary"
              }`}
            />

            <div className="flex items-center gap-2 text-sm">
              <StatusIcon className={`h-4 w-4 ${isOver ? 'text-destructive' : isClose ? 'text-warning' : 'text-accent'}`} />
              <span className="text-muted-foreground">{getStatusMessage()}</span>
            </div>

            {!isOver && (
              <p className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg py-2">
                ₹{remaining.toFixed(0)} left to spend
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No budget set for {format(selectedDate, "MMMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Set one in Settings → Budget Goals
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
