import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { toast } = useToast();
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  if (user) {
    if (isAdmin) navigate("/admin");
    else navigate("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
    else toast({ title: "Welcome back!" });
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupName || !signupPassword || !signupPhone) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from("otp_logs").insert({
      email: signupEmail,
      otp_code: otpCode,
      expires_at: expiresAt,
      purpose: "signup",
    });

    if (error) {
      toast({ title: "Error sending OTP", description: error.message, variant: "destructive" });
    } else {
      setOtpSent(true);
      toast({ title: "OTP Sent!", description: `Your verification code is: ${otpCode} (Check OTP logs in admin for now)` });
    }
    setLoading(false);
  };

  const handleVerifyAndSignup = async () => {
    setVerifyingOtp(true);
    // Verify OTP
    const { data: otpData, error: otpError } = await supabase
      .from("otp_logs")
      .select("*")
      .eq("email", signupEmail)
      .eq("otp_code", otp)
      .eq("purpose", "signup")
      .eq("is_verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpData) {
      toast({ title: "Invalid or expired OTP", description: "Please request a new OTP.", variant: "destructive" });
      setVerifyingOtp(false);
      return;
    }

    // Mark OTP as verified
    await supabase.from("otp_logs").update({ is_verified: true }).eq("id", otpData.id);

    // Now create the account
    const { error } = await signUp(signupEmail, signupPassword, signupName, signupPhone);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      setOtpSent(false);
      setOtp("");
    }
    setVerifyingOtp(false);
  };

  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl font-display mx-auto mb-3" style={{ background: "var(--gradient-primary)" }}>
                D
              </div>
              <CardTitle className="font-display text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in to track your orders and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input id="signup-name" required value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Your full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Mobile Number</Label>
                        <Input id="signup-phone" type="tel" required value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" required minLength={6} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="••••••••" />
                      </div>
                      <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                        {loading ? "Sending OTP..." : "Send Verification OTP"}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-6 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Enter the 6-digit OTP sent to</p>
                        <p className="font-medium text-foreground">{signupEmail}</p>
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
                        disabled={otp.length !== 6 || verifyingOtp}
                        onClick={handleVerifyAndSignup}
                      >
                        {verifyingOtp ? "Verifying..." : "Verify & Create Account"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setOtpSent(false); setOtp(""); }}>
                        ← Back to form
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
