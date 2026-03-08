import { useEffect, useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPaginationControls from "@/components/admin/AdminPaginationControls";
import { useAdminPagination } from "@/hooks/useAdminPagination";
import { supabase } from "@/integrations/supabase/client";

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500);
      setLogs(data || []);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => logs.filter((l) => !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.entity_type?.toLowerCase().includes(search.toLowerCase())), [logs, search]);

  const { paginatedData, currentPage, totalPages, totalItems, setCurrentPage, rowsPerPage } = useAdminPagination(filtered);

  const exportToExcel = () => {
    const headers = ["Action", "Entity Type", "Entity ID", "IP", "Time"];
    const rows = filtered.map((l) => [l.action, l.entity_type || "", l.entity_id || "", l.ip_address || "", new Date(l.created_at).toLocaleString()]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Activity Logs">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Activity Logs</CardTitle>
          <Button onClick={exportToExcel} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actions..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{totalItems} logs</p>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Details</TableHead><TableHead>IP</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedData.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.action}</TableCell>
                    <TableCell>{l.entity_type} {l.entity_id ? `#${l.entity_id.slice(0, 8)}` : ""}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{JSON.stringify(l.details)}</TableCell>
                    <TableCell>{l.ip_address || "—"}</TableCell>
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

export default AdminActivityLogs;
