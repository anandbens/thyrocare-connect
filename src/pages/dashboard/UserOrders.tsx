import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const UserOrders = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const statusColor = (status: string) => {
    switch (status) {
      case "received": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Layout>
      <section className="py-10">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <h1 className="text-2xl font-display font-bold text-foreground">My Orders</h1>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <p className="font-medium mb-2">No orders yet</p>
                <Link to="/tests"><Button size="sm">Book a Test</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-display font-semibold text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <Badge className={statusColor(order.order_status)}>{order.order_status}</Badge>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-foreground">{item.test_name}</span>
                          <span className="text-muted-foreground">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-foreground">₹{order.total_amount}</span>
                    </div>
                    {order.payment_status && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Payment: <span className="capitalize">{order.payment_status}</span>
                        {order.payment_type && ` · ${order.payment_type}`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default UserOrders;
