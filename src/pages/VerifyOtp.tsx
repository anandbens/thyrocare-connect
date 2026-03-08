import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";
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
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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

  const validatePhone = (value: string) => /^[6-9]\d{9}$/.test(value);

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      toast({ title: "Invalid mobile number", description: "Please enter a valid 10-digit Indian mobile number.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Generate a 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Store OTP in database
      const { error: otpError } = await supabase.from("otp_logs").insert({
        email: phone, // using email field for phone
        otp_code: otpCode,
        expires_at: expiresAt,
        purpose: "checkout_sms",
      });

      if (otpError) throw otpError;

      // Send SMS via edge function
      const { data, error } = await supabase.functions.invoke("send-sms-otp", {
        body: { phone, otp: otpCode },
      });

      if (error) {
        console.error("SMS send error:", error);
        // Still proceed - OTP is stored, show it in dev/test
        toast({
          title: "OTP Generated",
          description: "SMS gateway may not be configured. Check OTP logs in admin panel.",
        });
      } else {
        toast({ title: "OTP Sent!", description: `A 6-digit OTP has been sent to +91 ${phone}` });
      }

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
      // Verify OTP from database
      const { data: otpRecords, error } = await supabase
        .from("otp_logs")
        .select("*")
        .eq("email", phone)
        .eq("otp_code", otp)
        .eq("purpose", "checkout_sms")
        .eq("is_verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!otpRecords || otpRecords.length === 0) {
        toast({ title: "Invalid or expired OTP", description: "Please try again or request a new OTP.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Mark OTP as verified
      await supabase
        .from("otp_logs")
        .update({ is_verified: true })
        .eq("id", otpRecords[0].id);

      toast({ title: "Verified! ✅", description: "Redirecting to checkout..." });

      // Navigate to checkout with phone number
      navigate("/checkout", { state: { verifiedPhone: phone } });
    } catch (err: any) {
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
                {step === "phone" ? (
                  <Phone className="h-6 w-6 text-primary" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-primary" />
                )}
              </div>
              <CardTitle className="font-display">
                {step === "phone" ? "Verify Your Mobile Number" : "Enter OTP"}
              </CardTitle>
              <CardDescription>
                {step === "phone"
                  ? "We'll send a one-time password to verify your identity"
                  : `Enter the 6-digit OTP sent to +91 ${phone}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === "phone" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number *</Label>
                    <div className="flex gap-2">
                      <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                        +91
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="Enter 10-digit mobile number"
                        className="flex-1"
                      />
                    </div>
                    {phone.length > 0 && !validatePhone(phone) && (
                      <p className="text-sm text-destructive">Enter a valid 10-digit mobile number starting with 6-9</p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSendOtp}
                    disabled={loading || !validatePhone(phone)}
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
                    onClick={() => { setStep("phone"); setOtp(""); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
                  >
                    Change mobile number
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
