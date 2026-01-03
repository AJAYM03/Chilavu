import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, Search, Download, Receipt, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";

interface ExpenseListProps {
  dateRange: { start: string; end: string };
}

export const ExpenseList = ({ dateRange }: ExpenseListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: expenses } = useQuery({
    queryKey: ["expenses", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date", { ascending: false });
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      const keysToInvalidate = [
        "expenses", "metrics", "spending-chart", "spending-trend",
        "expenses-trend", "expenses-balance", "expenses-impulse",
        "expenses-by-category", "category-budgets-chart", "budget-goal", "top-categories"
      ];
      keysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
      toast.success("Transaction deleted");
      setDeletingExpenseId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const filteredExpenses = expenses?.filter((expense) =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["Date", "Title", "Amount", "Type", "Category", "Impulse", "Split With"];
    const rows = filteredExpenses.map((e) => [
      e.date, e.title, e.amount, e.is_income ? "Income" : "Expense",
      e.category_name || "", e.is_impulse ? "Yes" : "No", e.split_with || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chilavu-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={exportToCSV} className="text-muted-foreground">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses && filteredExpenses.length > 0 ? (
            <div className="space-y-2">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-foreground truncate">{expense.title}</h3>
                      {expense.is_impulse && (
                        <Zap className="h-3.5 w-3.5 text-warning shrink-0" />
                      )}
                      {expense.is_recurring && (
                        <RefreshCw className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{format(parseISO(expense.date), "MMM d")}</span>
                      {expense.category_name && (
                        <span className="px-1.5 py-0.5 bg-muted rounded text-xs">{expense.category_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${expense.is_income ? "text-accent" : "text-foreground"}`}>
                      {expense.is_income ? "+" : "-"}₹{Number(expense.amount).toFixed(0)}
                    </span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingExpense(expense)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingExpenseId(expense.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title={searchTerm ? "No matches found" : "No transactions yet"}
              description={searchTerm ? "Try a different search term" : "Start by adding your first expense or income"}
            />
          )}
        </CardContent>
      </Card>

      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
        />
      )}

      <AlertDialog open={!!deletingExpenseId} onOpenChange={() => setDeletingExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingExpenseId && deleteMutation.mutate(deletingExpenseId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
