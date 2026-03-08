import { useEffect, useState } from "react";
import { ShoppingCart, DollarSign, Users, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalTests: 0,
    todayOrders: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, testsRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, payment_status, order_status, created_at"),
        supabase.from("lab_tests").select("id", { count: "exact" }),
      ]);

      const orders = ordersRes.data || [];
      const today = new Date().toISOString().split("T")[0];

      setStats({
        totalOrders: orders.length,
        totalRevenue: orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total_amount), 0),
        pendingOrders: orders.filter(o => o.order_status === "received").length,
        totalTests: testsRes.count || 0,
        todayOrders: orders.filter(o => o.created_at?.startsWith(today)).length,
      });
    };
    fetchStats();
  }, []);

  const widgets = [
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary" },
    { title: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-success" },
    { title: "Pending Orders", value: stats.pendingOrders, icon: TrendingUp, color: "text-accent" },
    { title: "Today's Orders", value: stats.todayOrders, icon: Users, color: "text-primary" },
    { title: "Active Tests", value: stats.totalTests, icon: Package, color: "text-muted-foreground" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {widgets.map((w) => (
          <Card key={w.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{w.title}</CardTitle>
              <w.icon className={`h-5 w-5 ${w.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{w.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
