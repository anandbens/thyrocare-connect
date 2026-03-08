import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/context/CartContext";

const Checkout = () => {
  const { items, totalAmount, totalSavings, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "male",
    address: "",
    pincode: "",
    date: "",
    time: "morning",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    // Simulate payment — will be replaced with Razorpay integration
    await new Promise((r) => setTimeout(r, 1500));
    toast({
      title: "Order placed successfully! 🎉",
      description: "You will receive a confirmation on your email and phone.",
    });
    clearCart();
    navigate("/");
    setLoading(false);
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
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Textarea id="address" required value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Full address for home sample collection" />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input id="pincode" required value={form.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="625001" />
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
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Secure payment powered by Razorpay
                    </p>
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
