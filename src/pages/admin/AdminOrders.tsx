import { useEffect, useState, useCallback } from "react";
import { buildSafeCsv, downloadCsv } from "@/lib/csvSanitize";
import { Download, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPaginationControls from "@/components/admin/AdminPaginationControls";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  confirmed: "bg-yellow-100 text-yellow-800",
  sample_collected: "bg-purple-100 text-purple-800",
  processing: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

interface PaymentConfig {
  upi_id: string;
  phonepe_number: string;
  gpay_number: string;
  account_holder_name: string;
  business_name: string;
  whatsapp_number: string;
}

const defaultPaymentConfig: PaymentConfig = {
  upi_id: "",
  phonepe_number: "",
  gpay_number: "",
  account_holder_name: "",
  business_name: "Thyrocare Nagercoil",
  whatsapp_number: "",
};

const ROWS_PER_PAGE = 15;

const buildWhatsAppPaymentMessage = (order: any, config: PaymentConfig) => {
  const tests = order.order_items?.map((i: any) => i.test_name).join(", ") || "N/A";
  let msg = `🏥 *${config.business_name || "Thyrocare Nagercoil"}*\n\n`;
  msg += `Dear *${order.customer_name}*,\n\n`;
  msg += `Thank you for your order! Here are the details:\n\n`;
  msg += `📋 *Order:* ${order.order_number}\n`;
  msg += `🧪 *Tests:* ${tests}\n`;
  msg += `💰 *Amount:* ₹${order.total_amount}\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💳 *Payment Options:*\n\n`;
  if (config.upi_id) msg += `🔹 *UPI ID:* ${config.upi_id}\n`;
  if (config.gpay_number) msg += `🔹 *GPay:* ${config.gpay_number}\n`;
  if (config.phonepe_number) msg += `🔹 *PhonePe:* ${config.phonepe_number}\n`;
  if (config.account_holder_name) msg += `🔹 *Name:* ${config.account_holder_name}\n`;
  msg += `\n━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `Please make the payment of *₹${order.total_amount}* using any of the above options and share the screenshot.\n\n`;
  msg += `Thank you! 🙏`;
  return msg;
};

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [daysFilter, setDaysFilter] = useState("all");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(defaultPaymentConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_paginated_orders", {
      p_page: currentPage,
      p_per_page: ROWS_PER_PAGE,
      p_search: search || null,
      p_order_status: statusFilter === "all" ? null : statusFilter,
      p_payment_status: paymentFilter === "all" ? null : paymentFilter,
      p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
      p_date_to: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setOrders([]);
    } else {
      const result = data as any;
      setOrders(result.data || []);
      setTotalItems(result.total || 0);
      setTotalPages(result.total_pages || 1);
    }
    setLoading(false);
  }, [currentPage, search, statusFilter, paymentFilter, dateFrom, dateTo, toast]);

  const fetchPaymentConfig = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "payment_collection")
      .single();
    if (data?.setting_value) setPaymentConfig(data.setting_value as unknown as PaymentConfig);
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  const handleDaysFilter = (days: string) => {
    setDaysFilter(days);
    if (days === "all") { setDateFrom(""); setDateTo(""); return; }
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - parseInt(days));
    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(now.toISOString().split("T")[0]);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ order_status: newStatus }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Updated" }); fetchOrders(); }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: newStatus }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Payment status updated" }); fetchOrders(); }
  };

  const sendWhatsAppPayment = (order: any) => {
    const phone = order.customer_phone?.replace(/\D/g, "");
    const fullPhone = phone?.startsWith("91") ? phone : `91${phone}`;
    const message = buildWhatsAppPaymentMessage(order, paymentConfig);
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const exportToExcel = async () => {
    // Fetch ALL filtered results for export (bypasses pagination)
    const { data, error } = await supabase.rpc("get_paginated_orders", {
      p_page: 1,
      p_per_page: 100000,
      p_search: search || null,
      p_order_status: statusFilter === "all" ? null : statusFilter,
      p_payment_status: paymentFilter === "all" ? null : paymentFilter,
      p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
      p_date_to: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : null,
    });
    if (error) { toast({ title: "Export failed", description: error.message, variant: "destructive" }); return; }
    const allOrders = (data as any)?.data || [];
    const headers = ["Order #", "Date", "Customer", "Phone", "Email", "Tests", "Amount", "Payment", "Status"];
    const rows = allOrders.map((o: any) => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString(),
      o.customer_name,
      o.customer_phone,
      o.customer_email,
      o.order_items?.map((i: any) => i.test_name).join("; ") || "",
      o.total_amount,
      o.payment_status || "",
      o.order_status || "",
    ]);
    const csv = buildSafeCsv(headers, rows);
    downloadCsv(csv, `orders-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <AdminLayout title="Orders">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <CardTitle className="font-display">Order Management</CardTitle>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            <div className="col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, phone, email, order#" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Order Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="sample_collected">Sample Collected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={daysFilter} onValueChange={(v) => { handleDaysFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Days" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDaysFilter("all"); setCurrentPage(1); }} placeholder="From" />
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3">{totalItems} orders</p>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.customer_phone}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.order_items?.map((i: any) => i.test_name).join(", ")}
                      </TableCell>
                      <TableCell>₹{order.total_amount}</TableCell>
                      <TableCell>
                        <Select value={order.payment_status} onValueChange={(v) => updatePaymentStatus(order.id, v)}>
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <Badge className={paymentColors[order.payment_status] || ""} variant="secondary">
                              {order.payment_status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={order.order_status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <Badge className={statusColors[order.order_status] || ""} variant="secondary">
                              {order.order_status?.replace("_", " ")}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="sample_collected">Sample Collected</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20"
                              >
                                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                Pay
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="font-display">Send Payment Request</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                  {buildWhatsAppPaymentMessage(order, paymentConfig)}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => sendWhatsAppPayment(order)}
                                    className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Send via WhatsApp
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(buildWhatsAppPaymentMessage(order, paymentConfig));
                                      toast({ title: "Copied to clipboard" });
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <AdminPaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            rowsPerPage={ROWS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminOrders;
