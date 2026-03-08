import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const AdminOtpLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("otp_logs").select("*").order("created_at", { ascending: false }).limit(200);
      setLogs(data || []);
    };
    fetch();
  }, []);

  const filtered = logs.filter((l) => !search || l.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="OTP Logs">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">OTP Verification Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>OTP</TableHead><TableHead>Purpose</TableHead><TableHead>Verified</TableHead><TableHead>Expires</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((l) => (
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
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminOtpLogs;
