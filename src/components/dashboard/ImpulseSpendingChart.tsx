import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, CheckCircle } from "lucide-react";

interface ImpulseSpendingChartProps {
  dateRange: { start: string; end: string };
}

export const ImpulseSpendingChart = ({ dateRange }: ImpulseSpendingChartProps) => {
  const { data: expenses } = useQuery({
    queryKey: ["expenses-impulse", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .eq("is_income", false)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);
      return data || [];
    },
  });

  const impulseTotal = expenses?.filter(e => e.is_impulse).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const plannedTotal = expenses?.filter(e => !e.is_impulse).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const total = impulseTotal + plannedTotal;
  const impulsePercent = total > 0 ? (impulseTotal / total) * 100 : 0;
  const plannedPercent = 100 - impulsePercent;

  const hasData = total > 0;

  // Determine status
  const getStatus = () => {
    if (impulsePercent <= 10) return { label: "Excellent", color: "text-accent", icon: CheckCircle };
    if (impulsePercent <= 20) return { label: "Good", color: "text-accent", icon: CheckCircle };
    if (impulsePercent <= 30) return { label: "Okay", color: "text-warning", icon: Zap };
    return { label: "High", color: "text-destructive", icon: Zap };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Impulse spending</CardTitle>
          {hasData && (
            <div className={`flex items-center gap-1.5 text-sm ${status.color}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="font-medium">{status.label}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Visual bar */}
            <div className="h-4 rounded-full bg-muted overflow-hidden flex">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${plannedPercent}%` }}
              />
              <div 
                className="h-full bg-destructive transition-all duration-500"
                style={{ width: `${impulsePercent}%` }}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Planned</span>
                </div>
                <p className="text-lg font-semibold text-foreground">₹{plannedTotal.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{plannedPercent.toFixed(0)}% of spending</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <span className="text-sm text-muted-foreground">Impulse</span>
                </div>
                <p className="text-lg font-semibold text-destructive">₹{impulseTotal.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{impulsePercent.toFixed(0)}% of spending</p>
              </div>
            </div>

            {/* Tip */}
            {impulsePercent > 20 && (
              <p className="text-xs text-muted-foreground text-center py-2 px-3 bg-muted/50 rounded-lg">
                💡 Try the 24-hour rule: wait a day before impulse purchases
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <div className="p-4 rounded-full bg-muted mb-3">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No spending data</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mark purchases as "impulse" to track them
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
