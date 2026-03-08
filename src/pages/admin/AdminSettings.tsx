import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Payment settings
  const [payment, setPayment] = useState({
    razorpay_key_id: "",
    razorpay_key_secret: "",
    is_sandbox: true,
  });

  // SMTP settings
  const [smtp, setSmtp] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    from_email: "",
    from_name: "Thyrocare Nagercoil",
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("*");
      if (data) {
        const paymentSetting = data.find((s) => s.setting_key === "payment_gateway");
        const smtpSetting = data.find((s) => s.setting_key === "smtp_config");
        if (paymentSetting?.setting_value) setPayment(paymentSetting.setting_value as any);
        if (smtpSetting?.setting_value) setSmtp(smtpSetting.setting_value as any);
      }
    };
    fetch();
  }, []);

  const saveSetting = async (key: string, value: any) => {
    setLoading(true);
    const { error } = await supabase.from("site_settings").upsert(
      { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
      { onConflict: "setting_key" }
    );
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Settings saved" });
    setLoading(false);
  };

  return (
    <AdminLayout title="Settings">
      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payment">Payment Gateway</TabsTrigger>
          <TabsTrigger value="smtp">SMTP / Email</TabsTrigger>
        </TabsList>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Razorpay Configuration</CardTitle>
              <CardDescription>Configure payment gateway for sandbox or production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <Label className="font-medium">Environment:</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Production</span>
                  <Switch checked={payment.is_sandbox} onCheckedChange={(v) => setPayment({ ...payment, is_sandbox: v })} />
                  <span className="text-sm">Sandbox</span>
                </div>
                {payment.is_sandbox && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚠️ Sandbox Mode</span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razorpay Key ID *</Label>
                  <Input value={payment.razorpay_key_id} onChange={(e) => setPayment({ ...payment, razorpay_key_id: e.target.value })} placeholder="rzp_test_xxx or rzp_live_xxx" />
                </div>
                <div className="space-y-2">
                  <Label>Razorpay Key Secret *</Label>
                  <Input type="password" value={payment.razorpay_key_secret} onChange={(e) => setPayment({ ...payment, razorpay_key_secret: e.target.value })} placeholder="••••••••" />
                </div>
              </div>
              <Button onClick={() => saveSetting("payment_gateway", payment)} disabled={loading}>
                <Save className="h-4 w-4 mr-2" /> Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">SMTP Email Configuration</CardTitle>
              <CardDescription>Configure email server for sending OTPs and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host *</Label>
                  <Input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Port *</Label>
                  <Input value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input value={smtp.username} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })} placeholder="email@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input value={smtp.from_email} onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })} placeholder="noreply@danielclinic.com" />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input value={smtp.from_name} onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })} />
                </div>
              </div>
              <Button onClick={() => saveSetting("smtp_config", smtp)} disabled={loading}>
                <Save className="h-4 w-4 mr-2" /> Save SMTP Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;
