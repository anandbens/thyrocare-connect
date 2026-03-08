import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const { items, totalAmount, totalSavings, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    altPhone: "",
    age: "",
    gender: "male",
    address1: "",
    address2: "",
    landmark: "",
    district: "",
    area: "",
    state: "Tamil Nadu",
    pincode: "",
    date: "",
    time: "morning",
  });

  const districtAreas: Record<string, string[]> = {
    Nagercoil: ["Nagercoil Town", "Kottar", "Vadasery", "Eraniel", "Colachel", "Marthandam", "Thuckalay", "Kuzhithurai"],
    Tirunelveli: ["Tirunelveli Town", "Palayamkottai", "Melapalayam", "Sankarankovil", "Ambasamudram", "Tenkasi", "Cheranmahadevi", "Nanguneri"],
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const createOrder = async () => {
    // Create order in database first
    const orderNumber = `DHC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        alt_phone: form.altPhone || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender,
        address1: form.address1,
        address2: form.address2 || null,
        landmark: form.landmark || null,
        district: form.district,
        area: form.area,
        state: form.state,
        pincode: form.pincode,
        preferred_date: form.date || null,
        preferred_time: form.time,
        total_amount: totalAmount,
        total_savings: totalSavings,
        user_id: user?.id || null,
        payment_type: "online",
        payment_status: "pending",
        order_status: "received",
      })
      .select()
      .single();

    if (orderError || !order) throw new Error(orderError?.message || "Failed to create order");

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      test_id: item.test.id,
      test_name: item.test.name,
      price: item.test.price,
      original_price: item.test.original_price,
    }));

    await supabase.from("order_items").insert(orderItems);

    return order;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    try {
      // Create order in DB
      const order = await createOrder();

      // Create Razorpay order via edge function
      const { data: razorpayData, error: rzpError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            amount: totalAmount,
            currency: "INR",
            receipt: order.order_number,
            notes: { order_id: order.id, customer_name: form.name },
          },
        }
      );

      if (rzpError || !razorpayData?.order_id) {
        // Fallback: mark as COD if payment gateway not configured
        await supabase
          .from("orders")
          .update({ payment_type: "cod", payment_status: "pending", order_status: "confirmed" })
          .eq("id", order.id);

        toast({
          title: "Order placed successfully! 🎉",
          description: "Payment gateway is not configured. Order placed as Cash on Collection.",
        });
        clearCart();
        navigate("/dashboard/orders");
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: razorpayData.key_id,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        name: "Daniel Homoeo Clinic",
        description: `Order ${order.order_number}`,
        order_id: razorpayData.order_id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#0f8a6c" },
        handler: async (response: any) => {
          // Verify payment
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
            "verify-razorpay-payment",
            {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
              },
            }
          );

          if (verifyError || !verifyData?.verified) {
            toast({
              title: "Payment verification failed",
              description: "Please contact support with your order number.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Payment successful! 🎉",
            description: `Order ${order.order_number} confirmed. You'll receive a confirmation email.`,
          });
          clearCart();
          navigate("/dashboard/orders");
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment cancelled",
              description: "Your order has been saved. You can pay later from your dashboard.",
            });
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <Layout>
      <section className="py-10">
        <div className="container max-w-4xl">
          <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>

          <h1 className="text-3xl font-display font-bold text-foreground mb-8">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Patient Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Enter full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number *</Label>
                      <Input id="phone" required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altPhone">Alternative Mobile Number</Label>
                      <Input id="altPhone" type="tel" value={form.altPhone} onChange={(e) => update("altPhone", e.target.value)} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input id="age" required type="number" min="1" max="120" value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="Age" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Gender *</Label>
                      <div className="flex gap-4">
                        {["male", "female", "other"].map((g) => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={(e) => update("gender", e.target.value)} className="accent-primary" />
                            <span className="text-sm capitalize">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Collection Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address1">Address Line 1 *</Label>
                        <Input id="address1" required value={form.address1} onChange={(e) => update("address1", e.target.value)} placeholder="Door No, Street Name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address2">Address Line 2</Label>
                        <Input id="address2" value={form.address2} onChange={(e) => update("address2", e.target.value)} placeholder="Colony, Area" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark</Label>
                        <Input id="landmark" value={form.landmark} onChange={(e) => update("landmark", e.target.value)} placeholder="Near temple, opposite school, etc." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <select
                          id="state"
                          value={form.state}
                          disabled
                          className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                        >
                          <option value="Tamil Nadu">Tamil Nadu</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="district">District *</Label>
                        <select
                          id="district"
                          required
                          value={form.district}
                          onChange={(e) => {
                            update("district", e.target.value);
                            update("area", "");
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select District</option>
                          <option value="Nagercoil">Nagercoil</option>
                          <option value="Tirunelveli">Tirunelveli</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Area *</Label>
                        <select
                          id="area"
                          required
                          value={form.area}
                          onChange={(e) => update("area", e.target.value)}
                          disabled={!form.district}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted disabled:cursor-not-allowed"
                        >
                          <option value="">Select Area</option>
                          {form.district && districtAreas[form.district]?.map((area) => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input id="pincode" required value={form.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="629001" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Preferred Date *</Label>
                        <Input id="date" required type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Slot *</Label>
                        <select
                          value={form.time}
                          onChange={(e) => update("time", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="morning">Morning (7-9 AM)</option>
                          <option value="forenoon">Forenoon (9-11 AM)</option>
                          <option value="afternoon">Afternoon (12-2 PM)</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="font-display">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.map((item) => (
                      <div key={item.test.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{item.test.name}</span>
                        <span className="font-medium shrink-0">₹{item.test.price}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between text-sm text-primary">
                      <span>Savings</span>
                      <span>-₹{totalSavings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Collection</span>
                      <span className="text-primary font-medium">FREE</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{totalAmount}</span>
                    </div>
                    <Button type="submit" className="w-full rounded-xl mt-4" size="lg" disabled={loading}>
                      {loading ? "Processing..." : `Pay ₹${totalAmount}`}
                    </Button>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure payment powered by Razorpay
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
