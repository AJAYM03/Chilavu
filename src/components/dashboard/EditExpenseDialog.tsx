import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface EditExpenseDialogProps {
  expense: Tables<"expenses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditExpenseDialog = ({ expense, open, onOpenChange }: EditExpenseDialogProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(expense.amount.toString());
  const [title, setTitle] = useState(expense.title);
  const [date, setDate] = useState<Date>(parseISO(expense.date));
  const [isIncome, setIsIncome] = useState(expense.is_income);
  const [categoryName, setCategoryName] = useState(expense.category_name || "");
  const [splitWith, setSplitWith] = useState(expense.split_with || "");
  const [isImpulse, setIsImpulse] = useState(expense.is_impulse);
  const [isRecurring, setIsRecurring] = useState(expense.is_recurring || false);
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "monthly">(
    (expense.recurrence_type as "weekly" | "monthly") || "monthly"
  );

  const { data: categories } = useQuery({
    queryKey: ["user-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_categories")
        .select("*")
        .order("name");
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedExpense: {
      amount: number;
      title: string;
      date: string;
      is_income: boolean;
      category_name: string | null;
      split_with: string | null;
      is_impulse: boolean;
      is_recurring: boolean;
      recurrence_type: string | null;
    }) => {
      const { error } = await supabase
        .from("expenses")
        .update(updatedExpense)
        .eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      const keysToInvalidate = [
        "expenses",
        "metrics",
        "spending-chart",
        "spending-trend",
        "expenses-trend",
        "expenses-balance",
        "expenses-impulse",
        "expenses-by-category",
        "category-budgets-chart",
        "budget-goal",
        "top-categories"
      ];
      
      keysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      toast.success("Transaction updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update transaction");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Fix: Ensure amount is positive
    const finalAmount = Math.abs(parseFloat(amount));

    updateMutation.mutate({
      amount: finalAmount,
      title,
      date: format(date, "yyyy-MM-dd"),
      is_income: isIncome,
      category_name: isIncome ? null : categoryName || null,
      split_with: splitWith || null,
      is_impulse: isImpulse,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-amount">Amount *</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-is-income"
              checked={isIncome}
              onCheckedChange={setIsIncome}
            />
            <Label htmlFor="edit-is-income">This is income</Label>
          </div>

          {!isIncome && (
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={categoryName} onValueChange={setCategoryName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="edit-split-with">Split With (optional)</Label>
            <Input
              id="edit-split-with"
              value={splitWith}
              onChange={(e) => setSplitWith(e.target.value)}
            />
          </div>

          {!isIncome && (
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-impulse"
                checked={isImpulse}
                onCheckedChange={setIsImpulse}
              />
              <Label htmlFor="edit-is-impulse">Impulse Purchase</Label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-is-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="edit-is-recurring">Recurring</Label>
          </div>

          {isRecurring && (
            <div>
              <Label htmlFor="edit-recurrence">Frequency</Label>
              <Select
                value={recurrenceType}
                onValueChange={(v) => setRecurrenceType(v as "weekly" | "monthly")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Update Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};