import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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


const Checkout = () => {
  const { items, totalAmount, totalSavings, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const verifiedPhone = (location.state as any)?.verifiedPhone || "";

  const savedForm = (() => {
    try {
      const saved = localStorage.getItem("checkout_form");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  const [form, setForm] = useState({
    name: savedForm?.name || "",
    email: savedForm?.email || "",
    phone: verifiedPhone || savedForm?.phone || "",
    altPhone: savedForm?.altPhone || "",
    age: savedForm?.age || "",
    gender: savedForm?.gender || "male",
    address1: savedForm?.address1 || "",
    address2: savedForm?.address2 || "",
    landmark: savedForm?.landmark || "",
    district: savedForm?.district || "",
    area: savedForm?.area || "",
    state: savedForm?.state || "Tamil Nadu",
    pincode: savedForm?.pincode || "",
    date: "",
    time: savedForm?.time || "morning",
  });

  const [isExistingUser, setIsExistingUser] = useState(false);

  // Auto-populate from existing orders if phone matches
  useEffect(() => {
    if (!verifiedPhone) return;
    const fetchExistingData = async () => {
      const { data: existingOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_phone", verifiedPhone)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        const o = existingOrders[0];
        setIsExistingUser(true);
        setForm((prev) => ({
          ...prev,
          name: o.customer_name || prev.name,
          email: o.customer_email || prev.email,
          phone: verifiedPhone,
          altPhone: o.alt_phone || "",
          age: o.age?.toString() || "",
          gender: o.gender || "male",
          address1: o.address1 || "",
          address2: o.address2 || "",
          landmark: o.landmark || "",
          district: o.district || "",
          area: o.area || "",
          state: o.state || "Tamil Nadu",
          pincode: o.pincode || "",
        }));
      }
    };
    fetchExistingData();
  }, [verifiedPhone]);

  const districtAreas: Record<string, string[]> = {
    Nagercoil: ["Nagercoil Town", "Kottar", "Vadasery", "Eraniel", "Colachel", "Marthandam", "Thuckalay", "Kuzhithurai"],
    Tirunelveli: ["Tirunelveli Town", "Palayamkottai", "Melapalayam", "Sankarankovil", "Ambasamudram", "Tenkasi", "Cheranmahadevi", "Nanguneri"],
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validatePhone10 = (val: string) => /^[6-9]\d{9}$/.test(val);
  const validatePincode = (val: string) => /^\d{6}$/.test(val);
  const validateAge = (val: string) => /^\d{1,2}$/.test(val) && parseInt(val) >= 1 && parseInt(val) <= 99;

  const getISTNow = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + (istOffset - now.getTimezoneOffset() * 60 * 1000));
    return istNow;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    
    if (!validatePhone10(form.phone)) {
      newErrors.phone = "Enter a valid 10-digit mobile number starting with 6-9";
    }
    
    if (form.altPhone && !validatePhone10(form.altPhone)) {
      newErrors.altPhone = "Enter a valid 10-digit mobile number starting with 6-9";
    }

    if (form.altPhone && form.phone === form.altPhone) {
      newErrors.altPhone = "Alternative number must be different from primary number";
    }

    if (!validateAge(form.age)) {
      newErrors.age = "Age must be 1-99 (1 or 2 digits)";
    }

    if (!form.address1.trim()) newErrors.address1 = "Address is required";
    if (!form.district) newErrors.district = "District is required";
    if (!form.area) newErrors.area = "Area is required";

    if (!validatePincode(form.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    if (!form.date) {
      newErrors.date = "Preferred date is required";
    } else {
      const istNow = getISTNow();
      const today = istNow.toISOString().slice(0, 10);
      if (form.date < today) {
        newErrors.date = "Date cannot be earlier than today";
      }
    }

    // Validate time slot - if date is today, check if time slot has passed
    if (form.date && !newErrors.date) {
      const istNow = getISTNow();
      const today = istNow.toISOString().slice(0, 10);
      if (form.date === today) {
        const currentHour = istNow.getHours();
        if (form.time === "morning" && currentHour >= 9) {
          newErrors.time = "Morning slot (7-9 AM) has passed for today";
        } else if (form.time === "forenoon" && currentHour >= 11) {
          newErrors.time = "Forenoon slot (9-11 AM) has passed for today";
        } else if (form.time === "afternoon" && currentHour >= 14) {
          newErrors.time = "Afternoon slot (12-2 PM) has passed for today";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrder = async () => {
    // Server-side validation first
    const validationPayload = {
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender,
      address1: form.address1,
      district: form.district,
      area: form.area,
      pincode: form.pincode,
      preferred_date: form.date || null,
      preferred_time: form.time,
      total_amount: totalAmount,
      items: items.map((item) => ({
        test_id: item.test.id,
        test_name: item.test.name,
        price: item.test.price,
        original_price: item.test.original_price,
      })),
    };

    const { data: validation, error: valError } = await supabase.functions.invoke("validate-order", {
      body: validationPayload,
    });

    if (valError || (validation && !validation.valid)) {
      const errorMessages = validation?.errors?.join(", ") || valError?.message || "Validation failed";
      throw new Error(errorMessages);
    }

    const orderNumber = `DHC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone,
        alt_phone: form.altPhone || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender,
        address1: form.address1.trim(),
        address2: form.address2?.trim() || null,
        landmark: form.landmark?.trim() || null,
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

    if (!validateForm()) {
      toast({ title: "Please fix the errors", description: "Check the highlighted fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder();

      toast({
        title: "Order placed successfully! 🎉",
        description: `Order ${order.order_number} received. You will receive payment details via WhatsApp shortly.`,
      });
      clearCart();
      navigate("/dashboard/orders");
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

  const todayIST = getISTNow().toISOString().slice(0, 10);

  return (
    <Layout>
      <section className="py-10">
        <div className="container max-w-4xl">
          <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>

          <h1 className="text-3xl font-display font-bold text-foreground mb-8">Checkout</h1>

          {isExistingUser && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
              ✅ Welcome back! We've pre-filled your details from your previous order. You can update the alternative number and address if needed.
            </div>
          )}

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
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number *</Label>
                      <Input
                        id="phone"
                        required
                        type="tel"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        readOnly={!!verifiedPhone}
                        className={verifiedPhone ? "bg-muted" : ""}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altPhone">Alternative Mobile Number</Label>
                      <Input
                        id="altPhone"
                        type="tel"
                        maxLength={10}
                        value={form.altPhone}
                        onChange={(e) => update("altPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                      />
                      {errors.altPhone && <p className="text-sm text-destructive">{errors.altPhone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        required
                        type="text"
                        maxLength={2}
                        value={form.age}
                        onChange={(e) => update("age", e.target.value.replace(/\D/g, "").slice(0, 2))}
                        placeholder="Age (1-99)"
                      />
                      {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
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
                        {errors.address1 && <p className="text-sm text-destructive">{errors.address1}</p>}
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
                        {errors.district && <p className="text-sm text-destructive">{errors.district}</p>}
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
                        {errors.area && <p className="text-sm text-destructive">{errors.area}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          required
                          maxLength={6}
                          value={form.pincode}
                          onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="629001"
                        />
                        {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Preferred Date *</Label>
                        <Input id="date" required type="date" min={todayIST} value={form.date} onChange={(e) => update("date", e.target.value)} />
                        {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
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
                        {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
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
                      {loading ? "Placing Order..." : `Place Order — ₹${totalAmount}`}
                    </Button>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Payment details will be shared via WhatsApp
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
