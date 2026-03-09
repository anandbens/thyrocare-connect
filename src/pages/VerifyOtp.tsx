import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VerifyOtp = () => {
  const { items } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);

  useEffect(() => {
    const fetchFallbackOtp = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "fallback_otp")
        .single();
      const config = data?.setting_value as any;
      if (config?.enabled && config?.code) {
        setFallbackOtp(config.code);
      }
    };
    fetchFallbackOtp();
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Rate limiting: Check recent OTP requests for this email (max 5 in 15 min)
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: recentCount } = await supabase
        .from("otp_logs")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .eq("purpose", "checkout")
        .gte("created_at", fifteenMinAgo);

      if (recentCount && recentCount >= 5) {
        toast({ title: "Too many attempts", description: "Please wait 15 minutes before requesting another OTP.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Generate a 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Store OTP in database
      const { error: otpError } = await supabase.from("otp_logs").insert({
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt,
        purpose: "checkout",
      });

      if (otpError) throw otpError;

      // For now, show OTP in toast (until email delivery is integrated)
      toast({
        title: "OTP Sent!",
        description: `Your verification code is: ${otpCode} (Check admin OTP logs)`,
      });

      setStep("otp");
      setResendTimer(60);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit OTP.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: otpRecords, error } = await supabase
        .from("otp_logs")
        .select("*")
        .eq("email", email)
        .eq("otp_code", otp)
        .eq("purpose", "checkout")
        .eq("is_verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      const dbVerified = otpRecords && otpRecords.length > 0;

      if (!dbVerified && otp !== fallbackOtp) {
        toast({ title: "Invalid or expired OTP", description: "Please try again or request a new OTP.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Mark OTP as verified if found in DB
      if (dbVerified) {
        await supabase
          .from("otp_logs")
          .update({ is_verified: true })
          .eq("id", otpRecords[0].id);
      }

      toast({ title: "Verified! ✅", description: "Redirecting to checkout..." });
      navigate("/checkout", { state: { verifiedEmail: email } });
    } catch (err: any) {
      if (otp === fallbackOtp) {
        toast({ title: "Verified! ✅", description: "Redirecting to checkout..." });
        navigate("/checkout", { state: { verifiedEmail: email } });
        return;
      }
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setOtp("");
    handleSendOtp();
  };

  return (
    <Layout>
      <section className="py-10">
        <div className="container max-w-md">
          <button
            onClick={() => navigate("/cart")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                {step === "email" ? (
                  <Mail className="h-6 w-6 text-primary" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-primary" />
                )}
              </div>
              <CardTitle className="font-display">
                {step === "email" ? "Verify Your Email" : "Enter OTP"}
              </CardTitle>
              <CardDescription>
                {step === "email"
                  ? "We'll send a one-time password to verify your email address"
                  : `Enter the 6-digit OTP sent to ${email}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === "email" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                    {email.length > 0 && !validateEmail(email) && (
                      <p className="text-sm text-destructive">Enter a valid email address</p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSendOtp}
                    disabled={loading || !validateEmail(email)}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </>
              ) : (
                <>
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
                    className="w-full"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                      className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(""); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
                  >
                    Change email address
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default VerifyOtp;
