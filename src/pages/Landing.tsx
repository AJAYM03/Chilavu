import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Wallet } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float -z-10" style={{ animationDelay: "1s" }} />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo */}
        <div className="mb-8 animate-scale-in">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20">
            <Wallet className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6 animate-fade-up bg-[length:200%_auto] animate-shimmer relative z-20 leading-[1.3] py-4 px-6">
          ചിലവ്
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-12 animate-fade-up max-w-2xl px-4" style={{ animationDelay: "0.2s" }}>
          പൈസ പോയതെവിടെ? ചിലവ് പറഞ്ഞു തരും!
        </p>
        
        {/* CTA Button */}
        <Button 
          size="lg"
          onClick={() => navigate("/auth")}
          className="animate-fade-up shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
          style={{ animationDelay: "0.4s" }}
        >
          Get Started
        </Button>

        {/* Bottom text */}
        <p className="mt-8 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "0.5s" }}>
          A minimalist finance tracker for college students
        </p>
      </div>
    </div>
  );
};

export default Landing;