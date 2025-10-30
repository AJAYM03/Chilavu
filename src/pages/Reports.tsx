import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PeriodFilters } from "@/components/dashboard/PeriodFilters";
import { useState } from "react";
import { PeriodType } from "@/pages/Dashboard";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";

const Reports = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getDateRange = () => {
    switch (period) {
      case "daily":
        return {
          start: format(startOfDay(selectedDate), "yyyy-MM-dd"),
          end: format(endOfDay(selectedDate), "yyyy-MM-dd"),
        };
      case "weekly":
        return {
          start: format(startOfWeek(selectedDate), "yyyy-MM-dd"),
          end: format(endOfWeek(selectedDate), "yyyy-MM-dd"),
        };
      case "monthly":
        return {
          start: format(startOfMonth(selectedDate), "yyyy-MM-dd"),
          end: format(endOfMonth(selectedDate), "yyyy-MM-dd"),
        };
    }
  };

  const dateRange = getDateRange();

  const { data: topCategories } = useQuery({
    queryKey: ["top-categories", dateRange],
    queryFn: async () => {
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("is_income", false)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);

      if (!expenses) return [];

      const categoryTotals: Record<string, number> = {};
      expenses.forEach((expense) => {
        const category = expense.category_name || "Uncategorized";
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount);
      });

      return Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
        </div>

        <div className="mb-4 sm:mb-6">
          <PeriodFilters
            period={period}
            setPeriod={setPeriod}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {topCategories && topCategories.length > 0 ? (
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className="text-destructive font-bold text-lg">₹{category.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="No spending data"
                  description="Start tracking your expenses to see your top spending categories"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;