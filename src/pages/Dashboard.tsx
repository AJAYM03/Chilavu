import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PeriodFilters } from "@/components/dashboard/PeriodFilters";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { SpendingTrendChart } from "@/components/dashboard/SpendingTrendChart";
import { IncomeVsExpenseChart } from "@/components/dashboard/IncomeVsExpenseChart";
import { NetBalanceChart } from "@/components/dashboard/NetBalanceChart";
import { ImpulseSpendingChart } from "@/components/dashboard/ImpulseSpendingChart";
import { CategoryBudgetChart } from "@/components/dashboard/CategoryBudgetChart";
import { BudgetGoal } from "@/components/dashboard/BudgetGoal";
import { ExpenseList } from "@/components/dashboard/ExpenseList";
import { AddExpenseDialog } from "@/components/dashboard/AddExpenseDialog";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export type PeriodType = "daily" | "weekly" | "monthly";

const Dashboard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <DashboardHeader />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <PeriodFilters
          period={period}
          setPeriod={setPeriod}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <MetricsCards dateRange={dateRange} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeVsExpenseChart dateRange={dateRange} period={period} />
          <NetBalanceChart dateRange={dateRange} period={period} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImpulseSpendingChart dateRange={dateRange} />
          <CategoryBudgetChart dateRange={dateRange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart dateRange={dateRange} />
          <SpendingTrendChart dateRange={dateRange} period={period} />
        </div>

        <BudgetGoal />

        <ExpenseList dateRange={dateRange} />
      </div>

      <Button
        size="lg"
        className="fixed bottom-6 right-4 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50"
        onClick={() => setIsAddDialogOpen(true)}
      >
        <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      <AddExpenseDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
};

export default Dashboard;