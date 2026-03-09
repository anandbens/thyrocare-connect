import { useEffect, useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentGatewayConfig {
  razorpay: {
    enabled: boolean;
    is_sandbox: boolean;
    key_id: string;
    key_secret: string;
  };
  phonepe: {
    enabled: boolean;
    is_sandbox: boolean;
    client_id: string;
    client_secret: string;
    client_version: string;
    merchant_id: string;
  };
  cashfree: {
    enabled: boolean;
    is_sandbox: boolean;
    app_id: string;
    secret_key: string;
  };
}

const defaultGatewayConfig: PaymentGatewayConfig = {
  razorpay: { enabled: false, is_sandbox: true, key_id: "", key_secret: "" },
  phonepe: { enabled: false, is_sandbox: true, client_id: "", client_secret: "", client_version: "1", merchant_id: "" },
  cashfree: { enabled: false, is_sandbox: true, app_id: "", secret_key: "" },
};

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Payment collection settings
  const [paymentCollection, setPaymentCollection] = useState({
    upi_id: "",
    phonepe_number: "",
    gpay_number: "",
    account_holder_name: "",
    business_name: "Thyrocare Nagercoil",
    whatsapp_number: "",
  });

  // Payment gateway settings
  const [gateways, setGateways] = useState<PaymentGatewayConfig>(defaultGatewayConfig);

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
        const gatewaySetting = data.find((s) => s.setting_key === "payment_gateways_secret");
        // Fallback to old key for migration
        const gatewayFallback = !gatewaySetting ? data.find((s) => s.setting_key === "payment_gateways") : null;
        const gwData = gatewaySetting || gatewayFallback;
        if (gwData?.setting_value) {
          setGateways({ ...defaultGatewayConfig, ...(gwData.setting_value as any) });
        }
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

  const toggleSecret = (key: string) => setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));

  const SecretInput = ({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative">
      <Input
        type={showSecrets[id] ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button type="button" onClick={() => toggleSecret(id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {showSecrets[id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  const updateGateway = (gateway: keyof PaymentGatewayConfig, field: string, value: any) => {
    setGateways((prev) => ({
      ...prev,
      [gateway]: { ...prev[gateway], [field]: value },
    }));
  };

  const enabledCount = [gateways.razorpay.enabled, gateways.phonepe.enabled, gateways.cashfree.enabled].filter(Boolean).length;

  return (
    <AdminLayout title="Settings">
      <Tabs defaultValue="gateways" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="gateways">
            Payment Gateways
            {enabledCount > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{enabledCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payment">Payment Collection</TabsTrigger>
          <TabsTrigger value="sms">SMS Gateway</TabsTrigger>
          <TabsTrigger value="smtp">SMTP / Email</TabsTrigger>
        </TabsList>

        {/* Payment Gateways */}
        <TabsContent value="gateways" className="space-y-6">
          {/* Razorpay */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Razorpay</CardTitle>
                  <CardDescription>Accept payments via UPI, Cards, Netbanking, Wallets</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {gateways.razorpay.is_sandbox && gateways.razorpay.enabled && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">Sandbox</Badge>
                  )}
                  <Switch
                    checked={gateways.razorpay.enabled}
                    onCheckedChange={(v) => updateGateway("razorpay", "enabled", v)}
                  />
                </div>
              </div>
            </CardHeader>
            {gateways.razorpay.enabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="rzp-sandbox"
                    checked={gateways.razorpay.is_sandbox}
                    onCheckedChange={(v) => updateGateway("razorpay", "is_sandbox", v)}
                  />
                  <Label htmlFor="rzp-sandbox">Sandbox / Test Mode</Label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key ID *</Label>
                    <Input
                      value={gateways.razorpay.key_id}
                      onChange={(e) => updateGateway("razorpay", "key_id", e.target.value)}
                      placeholder="rzp_test_xxxxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Key Secret *</Label>
                    <SecretInput
                      id="rzp-secret"
                      value={gateways.razorpay.key_secret}
                      onChange={(v) => updateGateway("razorpay", "key_secret", v)}
                      placeholder="Razorpay Key Secret"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Razorpay Dashboard → Settings → API Keys</a>
                </p>
              </CardContent>
            )}
          </Card>

          {/* PhonePe */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">PhonePe</CardTitle>
                  <CardDescription>Accept payments via PhonePe UPI, Cards, Netbanking</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {gateways.phonepe.is_sandbox && gateways.phonepe.enabled && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">Sandbox</Badge>
                  )}
                  <Switch
                    checked={gateways.phonepe.enabled}
                    onCheckedChange={(v) => updateGateway("phonepe", "enabled", v)}
                  />
                </div>
              </div>
            </CardHeader>
            {gateways.phonepe.enabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="pp-sandbox"
                    checked={gateways.phonepe.is_sandbox}
                    onCheckedChange={(v) => updateGateway("phonepe", "is_sandbox", v)}
                  />
                  <Label htmlFor="pp-sandbox">Sandbox / Test Mode</Label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Merchant ID *</Label>
                    <Input
                      value={gateways.phonepe.merchant_id}
                      onChange={(e) => updateGateway("phonepe", "merchant_id", e.target.value)}
                      placeholder="MERCHANTUAT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client ID *</Label>
                    <Input
                      value={gateways.phonepe.client_id}
                      onChange={(e) => updateGateway("phonepe", "client_id", e.target.value)}
                      placeholder="Your PhonePe Client ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret *</Label>
                    <SecretInput
                      id="pp-secret"
                      value={gateways.phonepe.client_secret}
                      onChange={(v) => updateGateway("phonepe", "client_secret", v)}
                      placeholder="PhonePe Client Secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Version</Label>
                    <Input
                      value={gateways.phonepe.client_version}
                      onChange={(e) => updateGateway("phonepe", "client_version", e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get credentials from <a href="https://developer.phonepe.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">PhonePe Developer Dashboard</a>. Requires: Merchant ID, Client ID, Client Secret.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Cashfree */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Cashfree</CardTitle>
                  <CardDescription>Accept payments via UPI, Cards, Netbanking, EMI, Pay Later</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {gateways.cashfree.is_sandbox && gateways.cashfree.enabled && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">Sandbox</Badge>
                  )}
                  <Switch
                    checked={gateways.cashfree.enabled}
                    onCheckedChange={(v) => updateGateway("cashfree", "enabled", v)}
                  />
                </div>
              </div>
            </CardHeader>
            {gateways.cashfree.enabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="cf-sandbox"
                    checked={gateways.cashfree.is_sandbox}
                    onCheckedChange={(v) => updateGateway("cashfree", "is_sandbox", v)}
                  />
                  <Label htmlFor="cf-sandbox">Sandbox / Test Mode</Label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>App ID (Client ID) *</Label>
                    <Input
                      value={gateways.cashfree.app_id}
                      onChange={(e) => updateGateway("cashfree", "app_id", e.target.value)}
                      placeholder="Your Cashfree App ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key *</Label>
                    <SecretInput
                      id="cf-secret"
                      value={gateways.cashfree.secret_key}
                      onChange={(v) => updateGateway("cashfree", "secret_key", v)}
                      placeholder="Cashfree Secret Key"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get credentials from <a href="https://merchant.cashfree.com/merchants/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Cashfree Merchant Dashboard → Developers → API Keys</a>
                </p>
              </CardContent>
            )}
          </Card>

          <Button onClick={() => {
            // Save full config (with secrets) to protected key
            saveSetting("payment_gateways_secret", gateways);
            // Save public-only config (no secrets) for frontend
            const publicConfig = {
              razorpay: { enabled: gateways.razorpay.enabled, is_sandbox: gateways.razorpay.is_sandbox, key_id: gateways.razorpay.key_id },
              phonepe: { enabled: gateways.phonepe.enabled, is_sandbox: gateways.phonepe.is_sandbox, client_id: gateways.phonepe.client_id },
              cashfree: { enabled: gateways.cashfree.enabled, is_sandbox: gateways.cashfree.is_sandbox, app_id: gateways.cashfree.app_id },
            };
            saveSetting("payment_gateways_public", publicConfig);
          }} disabled={loading}>
            <Save className="h-4 w-4 mr-2" /> Save Payment Gateway Settings
          </Button>
        </TabsContent>

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
