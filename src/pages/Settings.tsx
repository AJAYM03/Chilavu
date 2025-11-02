import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const currentMonthYear = format(new Date(), "yyyy-MM");

  const { data: budgetGoal } = useQuery({
    queryKey: ["budget-goal-settings", currentMonthYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("month_year", currentMonthYear)
        .maybeSingle();
      if (data) {
        setBudgetAmount(data.amount.toString());
      }
      return data;
    },
  });

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

  const { data: existingCategoryBudgets } = useQuery({
    queryKey: ["category-budgets", currentMonthYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("category_budgets")
        .select("*")
        .eq("month_year", currentMonthYear);
      
      if (data) {
        const budgetMap: Record<string, string> = {};
        data.forEach(b => {
          budgetMap[b.category_name] = b.budget_amount.toString();
        });
        setCategoryBudgets(budgetMap);
      }
      return data || [];
    },
  });

  const saveBudgetMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error("Not authenticated");

      if (budgetGoal) {
        const { error } = await supabase
          .from("budget_goals")
          .update({ amount })
          .eq("id", budgetGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget_goals")
          .insert([{ user_id: user.id, amount, month_year: currentMonthYear }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-goal-settings", currentMonthYear] });
      queryClient.invalidateQueries({ queryKey: ["budget-goal", currentMonthYear] });
      toast.success("Budget goal saved successfully");
    },
    onError: () => {
      toast.error("Failed to save budget goal");
    },
  });

  const saveCategoryBudgetMutation = useMutation({
    mutationFn: async ({ categoryName, amount }: { categoryName: string; amount: number }) => {
      if (!user) throw new Error("Not authenticated");

      const existing = existingCategoryBudgets?.find(
        b => b.category_name === categoryName && b.month_year === currentMonthYear
      );

      if (existing) {
        const { error } = await supabase
          .from("category_budgets")
          .update({ budget_amount: amount })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("category_budgets")
          .insert([{ 
            user_id: user.id, 
            category_name: categoryName,
            budget_amount: amount, 
            month_year: currentMonthYear 
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets"] });
      toast.success("Category budget saved");
    },
    onError: () => {
      toast.error("Failed to save category budget");
    },
  });

  const deleteCategoryBudgetMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const existing = existingCategoryBudgets?.find(
        b => b.category_name === categoryName && b.month_year === currentMonthYear
      );
      if (existing) {
        const { error } = await supabase
          .from("category_budgets")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets"] });
      toast.success("Category budget removed");
    },
  });

  const addDefaultCategoriesMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const defaultCategories = ["Food", "Transport", "Stationery", "Fees", "Entertainment", "Rent/Hostel"];
      
      // Get existing categories
      const { data: existingCategories } = await supabase
        .from("user_categories")
        .select("name")
        .eq("user_id", user.id);

      const existingNames = existingCategories?.map(c => c.name) || [];
      
      // Filter out categories that already exist
      const categoriesToAdd = defaultCategories.filter(cat => !existingNames.includes(cat));

      if (categoriesToAdd.length === 0) {
        throw new Error("All default categories already exist");
      }

      // Insert new categories
      const { error } = await supabase
        .from("user_categories")
        .insert(categoriesToAdd.map(name => ({ user_id: user.id, name })));

      if (error) throw error;

      return categoriesToAdd.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["user-categories"] });
      toast.success(`Added ${count} default ${count === 1 ? 'category' : 'categories'}`);
    },
    onError: (error: Error) => {
      if (error.message === "All default categories already exist") {
        toast.info("All default categories are already added");
      } else {
        toast.error("Failed to add default categories");
      }
    },
  });

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    saveBudgetMutation.mutate(amount);
  };

  const handleSaveCategoryBudget = (categoryName: string) => {
    const amount = parseFloat(categoryBudgets[categoryName]);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    saveCategoryBudgetMutation.mutate({ categoryName, amount });
  };

  const handleDeleteCategoryBudget = (categoryName: string) => {
    deleteCategoryBudgetMutation.mutate(categoryName);
    setCategoryBudgets(prev => {
      const newBudgets = { ...prev };
      delete newBudgets[categoryName];
      return newBudgets;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-4 sm:space-y-6 max-w-2xl">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Monthly Budget Goal</CardTitle>
              <CardDescription>Set your overall spending limit for the month</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget Amount (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="Enter monthly budget"
                    className="text-lg"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={saveBudgetMutation.isPending}
                  className="w-full"
                >
                  {saveBudgetMutation.isPending ? "Saving..." : "Save Budget Goal"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Default Categories</CardTitle>
                  <CardDescription>Add student-friendly expense categories</CardDescription>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => addDefaultCategoriesMutation.mutate()}
                  disabled={addDefaultCategoriesMutation.isPending}
                  className="hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click "Add Defaults" to automatically add categories like Food, Transport, Stationery, Fees, Entertainment, and Rent/Hostel to your account.
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle>Category Budgets</CardTitle>
              <CardDescription>Set spending limits for each category</CardDescription>
            </CardHeader>
            <CardContent>
              {categories && categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-end gap-2 p-3 rounded-lg border hover:border-primary/50 transition-colors">
                      <div className="flex-1">
                        <Label htmlFor={`budget-${category.id}`} className="text-sm font-medium">
                          {category.name}
                        </Label>
                        <Input
                          id={`budget-${category.id}`}
                          type="number"
                          step="0.01"
                          value={categoryBudgets[category.name] || ""}
                          onChange={(e) =>
                            setCategoryBudgets((prev) => ({
                              ...prev,
                              [category.name]: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => handleSaveCategoryBudget(category.name)}
                        disabled={
                          !categoryBudgets[category.name] ||
                          saveCategoryBudgetMutation.isPending
                        }
                        className="hover:scale-105 transition-transform"
                      >
                        Save
                      </Button>
                      {categoryBudgets[category.name] && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategoryBudget(category.name)}
                          disabled={deleteCategoryBudgetMutation.isPending}
                          className="hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Plus}
                  title="No categories available"
                  description="Create categories in the Categories page or add default categories above to set budgets"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;