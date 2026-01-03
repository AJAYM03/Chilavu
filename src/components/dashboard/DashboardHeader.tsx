import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings, BarChart2, FolderOpen, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardHeader = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">ചിലവ്</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground" 
            onClick={() => navigate("/categories")}
          >
            <FolderOpen className="h-[18px] w-[18px]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground" 
            onClick={() => navigate("/reports")}
          >
            <BarChart2 className="h-[18px] w-[18px]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground" 
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-[18px] w-[18px]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground" 
            onClick={signOut}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </div>
    </header>
  );
};
