import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Wallet, ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-4 tracking-tight">
          ചിലവ്
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg text-muted-foreground mb-3 max-w-sm">
          പൈസ പോയതെവിടെ? ചിലവ് പറഞ്ഞു തരും!
        </p>
        
        <p className="text-sm text-muted-foreground mb-10">
          A simple expense tracker for students
        </p>
        
        {/* CTA Button */}
        <Button 
          size="lg"
          onClick={() => navigate("/auth")}
          className="h-12 px-8 text-base font-medium"
        >
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Features hint */}
        <div className="mt-16 flex items-center gap-6 text-sm text-muted-foreground">
          <span>Track expenses</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>Set budgets</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>Stay on track</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
