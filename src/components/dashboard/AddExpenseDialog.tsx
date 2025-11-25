import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddExpenseDialog = ({ open, onOpenChange }: AddExpenseDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [isIncome, setIsIncome] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [splitWith, setSplitWith] = useState("");
  const [isImpulse, setIsImpulse] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "monthly">("monthly");
  const [aiSuggested, setAiSuggested] = useState(false);

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

  // Reset AI suggestion when title or category changes significantly
  useEffect(() => {
    if (!title || !categoryName) {
      setAiSuggested(false);
    }
  }, [title, categoryName]);

  useEffect(() => {
    if (!title || isIncome || aiSuggested) return;

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("suggest-category", {
          body: { title },
        });

        if (error) throw error;

        if (data?.suggestedCategory) {
          setCategoryName(data.suggestedCategory);
          setAiSuggested(true);
          toast.success(`AI suggested: ${data.suggestedCategory}`, {
            icon: <Sparkles className="h-4 w-4" />,
          });
        }
      } catch (error) {
        console.error("Category suggestion failed:", error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, isIncome, aiSuggested]);

  const addMutation = useMutation({
    mutationFn: async (newExpense: any) => {
      const { error } = await supabase.from("expenses").insert([newExpense]);
      if (error) throw error;

      if (!isIncome && categoryName) {
        const monthYear = format(new Date(), "yyyy-MM");
        const { data: budget } = await supabase
          .from("category_budgets")
          .select("*")
          .eq("category_name", categoryName)
          .eq("month_year", monthYear)
          .maybeSingle();

        if (budget) {
          const { data: expenses } = await supabase
            .from("expenses")
            .select("amount")
            .eq("category_name", categoryName)
            .eq("is_income", false)
            .gte("date", `${monthYear}-01`)
            .lte("date", `${monthYear}-31`);

          const totalSpent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          const percentage = (totalSpent / budget.budget_amount) * 100;

          if (percentage >= 90) {
            toast.warning(`You've used ${percentage.toFixed(0)}% of your ${categoryName} budget!`);
          }
        }
      }
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

      toast.success("Transaction added successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add transaction");
    },
  });

  const resetForm = () => {
    setAmount("");
    setTitle("");
    setDate(new Date());
    setIsIncome(false);
    setCategoryName("");
    setSplitWith("");
    setIsImpulse(false);
    setIsRecurring(false);
    setRecurrenceType("monthly");
    setAiSuggested(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !title || !user) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Fix: Ensure amount is positive
    const finalAmount = Math.abs(parseFloat(amount));

    addMutation.mutate({
      user_id: user.id,
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
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setAiSuggested(false);
              }}
              placeholder="Transaction description"
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
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
              id="is-income"
              checked={isIncome}
              onCheckedChange={setIsIncome}
            />
            <Label htmlFor="is-income">This is income</Label>
          </div>

          {!isIncome && (
            <div>
              <Label htmlFor="category">
                Category {aiSuggested && <Sparkles className="inline h-3 w-3 text-primary" />}
              </Label>
              <Select 
                value={categoryName} 
                onValueChange={(value) => {
                  setCategoryName(value);
                  setAiSuggested(false);
                }}
              >
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
            <Label htmlFor="split-with">Split With (optional)</Label>
            <Input
              id="split-with"
              value={splitWith}
              onChange={(e) => setSplitWith(e.target.value)}
              placeholder="Person's name"
            />
          </div>

          {!isIncome && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is-impulse"
                checked={isImpulse}
                onCheckedChange={setIsImpulse}
              />
              <Label htmlFor="is-impulse">Impulse Purchase</Label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="is-recurring">Recurring</Label>
          </div>

          {isRecurring && (
            <div>
              <Label htmlFor="recurrence">Frequency</Label>
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

          <Button type="submit" className="w-full" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Adding..." : "Add Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
