import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Payment collection settings
  const [paymentCollection, setPaymentCollection] = useState({
    upi_id: "",
    phonepe_number: "",
    gpay_number: "",
    account_holder_name: "",
    business_name: "Thyrocare Nagercoil",
    whatsapp_number: "",
  });

  // SMS Gateway settings
  const [sms, setSms] = useState({
    gateway_url: "",
    api_key: "",
    entity_id: "",
    sender_id: "",
    template_id: "",
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
        const paymentCollectionSetting = data.find((s) => s.setting_key === "payment_collection");
        const smtpSetting = data.find((s) => s.setting_key === "smtp_config");
        const smsSetting = data.find((s) => s.setting_key === "sms_gateway");
        if (paymentCollectionSetting?.setting_value) setPaymentCollection(paymentCollectionSetting.setting_value as any);
        if (smtpSetting?.setting_value) setSmtp(smtpSetting.setting_value as any);
        if (smsSetting?.setting_value) setSms(smsSetting.setting_value as any);
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
          <TabsTrigger value="payment">Payment Collection</TabsTrigger>
          <TabsTrigger value="sms">SMS Gateway</TabsTrigger>
          <TabsTrigger value="smtp">SMTP / Email</TabsTrigger>
        </TabsList>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Payment Collection Settings</CardTitle>
              <CardDescription>Configure UPI/GPay/PhonePe details for WhatsApp payment collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={paymentCollection.business_name} onChange={(e) => setPaymentCollection({ ...paymentCollection, business_name: e.target.value })} placeholder="Thyrocare Nagercoil" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number (for sending)</Label>
                  <Input value={paymentCollection.whatsapp_number} onChange={(e) => setPaymentCollection({ ...paymentCollection, whatsapp_number: e.target.value })} placeholder="919876543210" />
                </div>
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input value={paymentCollection.upi_id} onChange={(e) => setPaymentCollection({ ...paymentCollection, upi_id: e.target.value })} placeholder="yourname@upi" />
                </div>
                <div className="space-y-2">
                  <Label>GPay Number</Label>
                  <Input value={paymentCollection.gpay_number} onChange={(e) => setPaymentCollection({ ...paymentCollection, gpay_number: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="space-y-2">
                  <Label>PhonePe Number</Label>
                  <Input value={paymentCollection.phonepe_number} onChange={(e) => setPaymentCollection({ ...paymentCollection, phonepe_number: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input value={paymentCollection.account_holder_name} onChange={(e) => setPaymentCollection({ ...paymentCollection, account_holder_name: e.target.value })} placeholder="John Doe" />
                </div>
              </div>
              <Button onClick={() => saveSetting("payment_collection", paymentCollection)} disabled={loading}>
                <Save className="h-4 w-4 mr-2" /> Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">SMS Gateway Configuration</CardTitle>
              <CardDescription>Configure SMS gateway for sending OTPs via SMS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Gateway API URL *</Label>
                  <Input value={sms.gateway_url} onChange={(e) => setSms({ ...sms, gateway_url: e.target.value })} placeholder="https://api.smsprovider.com/send" />
                </div>
                <div className="space-y-2">
                  <Label>API Key *</Label>
                  <Input type="password" value={sms.api_key} onChange={(e) => setSms({ ...sms, api_key: e.target.value })} placeholder="Your SMS API key" />
                </div>
                <div className="space-y-2">
                  <Label>Entity ID</Label>
                  <Input value={sms.entity_id} onChange={(e) => setSms({ ...sms, entity_id: e.target.value })} placeholder="DLT Entity ID" />
                </div>
                <div className="space-y-2">
                  <Label>Sender ID</Label>
                  <Input value={sms.sender_id} onChange={(e) => setSms({ ...sms, sender_id: e.target.value })} placeholder="THYROC" />
                </div>
                <div className="space-y-2">
                  <Label>Template ID</Label>
                  <Input value={sms.template_id} onChange={(e) => setSms({ ...sms, template_id: e.target.value })} placeholder="DLT Template ID" />
                </div>
              </div>
              <Button onClick={() => saveSetting("sms_gateway", sms)} disabled={loading}>
                <Save className="h-4 w-4 mr-2" /> Save SMS Settings
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
