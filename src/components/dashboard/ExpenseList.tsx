import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, Search, Download, Receipt } from "lucide-react";
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
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["spending-chart"] });
      queryClient.invalidateQueries({ queryKey: ["spending-trend"] });
      toast.success("Expense deleted successfully");
      setDeletingExpenseId(null);
    },
    onError: () => {
      toast.error("Failed to delete expense");
    },
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
      e.date,
      e.title,
      e.amount,
      e.is_income ? "Income" : "Expense",
      e.category_name || "",
      e.is_impulse ? "Yes" : "No",
      e.split_with || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses && filteredExpenses.length > 0 ? (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md hover:border-primary/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{expense.title}</h3>
                      {expense.is_impulse && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded animate-pulse">
                          Impulse
                        </span>
                      )}
                      {expense.is_recurring && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Recurring
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{format(parseISO(expense.date), "MMM dd, yyyy")}</span>
                      {expense.category_name && <span className="font-medium">{expense.category_name}</span>}
                      {expense.split_with && <span>Split with: {expense.split_with}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-bold text-lg ${
                        expense.is_income ? "text-accent" : "text-destructive"
                      }`}
                    >
                      {expense.is_income ? "+" : "-"}₹{Number(expense.amount).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-primary/10"
                      onClick={() => setEditingExpense(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/10"
                      onClick={() => setDeletingExpenseId(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title={searchTerm ? "No matching transactions" : "No transactions yet"}
              description={searchTerm ? "Try adjusting your search term" : "Start tracking your expenses and income"}
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
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingExpenseId && deleteMutation.mutate(deletingExpenseId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};