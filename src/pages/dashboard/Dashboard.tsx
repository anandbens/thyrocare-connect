import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, FileText, User, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setProfile(profileRes.data);
      setOrders(ordersRes.data || []);
      setOrderCount(ordersRes.data?.length || 0);
    };
    fetchData();
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
          {/* Welcome */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                Hello, {profile?.full_name || user.email?.split("@")[0]} 👋
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Link to="/dashboard/orders">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">My Orders</p>
                    <p className="text-sm text-muted-foreground">{orderCount} order{orderCount !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/dashboard/reports">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">Reports</p>
                    <p className="text-sm text-muted-foreground">View results</p>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/dashboard/profile">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <User className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">Profile</p>
                    <p className="text-sm text-muted-foreground">Edit details</p>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Recent Orders</CardTitle>
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm" className="text-primary">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm">Book a test to get started!</p>
                  <Link to="/tests"><Button className="mt-4" size="sm">Browse Tests</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link key={order.id} to={`/dashboard/orders/${order.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-foreground">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}{order.order_items?.length || 0} test{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={statusColor(order.order_status)}>
                            {order.order_status}
                          </Badge>
                          <span className="font-semibold text-foreground">₹{order.total_amount}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
