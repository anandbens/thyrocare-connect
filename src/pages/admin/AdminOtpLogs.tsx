import { useEffect, useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPaginationControls from "@/components/admin/AdminPaginationControls";
import { useAdminPagination } from "@/hooks/useAdminPagination";
import { supabase } from "@/integrations/supabase/client";

const AdminOtpLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("otp_logs").select("*").order("created_at", { ascending: false }).limit(500);
      setLogs(data || []);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => logs.filter((l) => !search || l.email?.toLowerCase().includes(search.toLowerCase())), [logs, search]);

  const { paginatedData, currentPage, totalPages, totalItems, setCurrentPage, rowsPerPage } = useAdminPagination(filtered);

  const exportToExcel = () => {
    const headers = ["Email", "OTP", "Purpose", "Verified", "Expires", "Created"];
    const rows = filtered.map((l) => [l.email, l.otp_code, l.purpose, l.is_verified ? "Yes" : "No", new Date(l.expires_at).toLocaleString(), new Date(l.created_at).toLocaleString()]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `otp-logs-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="OTP Logs">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">OTP Verification Logs</CardTitle>
          <Button onClick={exportToExcel} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by email..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{totalItems} logs</p>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>OTP</TableHead><TableHead>Purpose</TableHead><TableHead>Verified</TableHead><TableHead>Expires</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedData.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.email}</TableCell>
                    <TableCell className="font-mono">{l.otp_code}</TableCell>
                    <TableCell>{l.purpose}</TableCell>
                    <TableCell>{l.is_verified ? <Badge className="bg-green-100 text-green-800">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                    <TableCell>{new Date(l.expires_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminPaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminOtpLogs;
