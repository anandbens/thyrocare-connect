import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    // Check if email exists in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      toast({ title: "Email not found", description: "No account exists with this email address.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Generate OTP and store
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from("otp_logs").insert({
      email,
      otp_code: otpCode,
      expires_at: expiresAt,
      purpose: "password_reset",
    });

    if (error) {
      toast({ title: "Error", description: "Could not send OTP. Please try again.", variant: "destructive" });
    } else {
      setStep("otp");
      toast({ title: "OTP Sent!", description: `Verification code: ${otpCode} (Check your email/admin OTP logs)` });
    }
    setLoading(false);
  };

  const handleVerifyAndReset = async () => {
    setLoading(true);

    // Verify OTP
    const { data: otpData } = await supabase
      .from("otp_logs")
      .select("*")
      .eq("email", email)
      .eq("otp_code", otp)
      .eq("purpose", "password_reset")
      .eq("is_verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpData) {
      toast({ title: "Invalid or expired OTP", description: "Please request a new OTP.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Mark OTP as verified
    await supabase.from("otp_logs").update({ is_verified: true }).eq("id", otpData.id);

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setStep("done");
      toast({ title: "Reset link sent!", description: "Check your email for the password reset link." });
    }
    setLoading(false);
  };

  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-3" style={{ background: "var(--gradient-primary)" }}>
                <KeyRound className="h-7 w-7" />
              </div>
              <CardTitle className="font-display text-2xl">Forgot Password</CardTitle>
              <CardDescription>
                {step === "email" && "Enter your registered email to receive a verification OTP"}
                {step === "otp" && "Enter the OTP sent to your email"}
                {step === "done" && "Password reset link has been sent"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "email" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                  <div className="text-center">
                    <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      <ArrowLeft className="h-3 w-3" /> Back to Login
                    </Link>
                  </div>
                </form>
              )}

              {step === "otp" && (
                <div className="space-y-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Enter the 6-digit OTP sent to</p>
                    <p className="font-medium text-foreground">{email}</p>
                  </div>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    className="w-full rounded-xl"
                    disabled={otp.length !== 6 || loading}
                    onClick={handleVerifyAndReset}
                  >
                    {loading ? "Verifying..." : "Verify & Send Reset Link"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setStep("email"); setOtp(""); }}>
                    ← Back
                  </Button>
                </div>
              )}

              {step === "done" && (
                <div className="text-center space-y-4">
                  <Mail className="h-16 w-16 text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to set your new password.
                  </p>
                  <Link to="/login">
                    <Button variant="outline" className="rounded-xl">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default ForgotPassword;
