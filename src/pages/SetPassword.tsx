import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, CheckCircle } from "lucide-react";

const SetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
          setChecking(false);
        } else if (event === "SIGNED_IN" && session) {
          // Check if this is from a recovery link via URL hash
          const hash = window.location.hash;
          if (hash.includes("type=recovery")) {
            setIsRecovery(true);
          }
          setChecking(false);
        }
      }
    );

    // Also check URL hash directly
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    
    // Give some time for the auth event to fire
    const timer = setTimeout(() => setChecking(false), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords match.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Error setting password", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "Password set successfully!", description: "You can now sign in with your new password." });
      setTimeout(() => navigate("/login"), 3000);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container max-w-md text-center">
            <p className="text-muted-foreground">Verifying your link...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container max-w-md">
            <Card>
              <CardContent className="pt-8 text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-display font-bold text-foreground">Password Set Successfully!</h2>
                <p className="text-muted-foreground">Your account is now activated. Redirecting to login...</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-3" style={{ background: "var(--gradient-primary)" }}>
                <Lock className="h-7 w-7" />
              </div>
              <CardTitle className="font-display text-2xl">
                {isRecovery ? "Reset Your Password" : "Set Your Password"}
              </CardTitle>
              <CardDescription>
                {isRecovery
                  ? "Enter your new password below"
                  : "Activate your account by setting a password"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  {loading ? "Setting password..." : "Set Password & Activate"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default SetPassword;
