import { useEffect, useState, lazy, Suspense } from "react";
import { Plus, Pencil, Trash2, Download, icons } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPaginationControls from "@/components/admin/AdminPaginationControls";
import { useAdminPagination } from "@/hooks/useAdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MedicalIconPicker from "@/components/admin/MedicalIconPicker";

const AdminCategories = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", icon: "🏥", sort_order: 0, is_active: true });
  const [editing, setEditing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("test_categories").select("*").order("sort_order");
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const { paginatedData, currentPage, totalPages, totalItems, setCurrentPage, rowsPerPage } = useAdminPagination(items);

  const save = async () => {
    const payload = { name: form.name, icon: form.icon, sort_order: form.sort_order, is_active: form.is_active };
    const { error } = editing
      ? await supabase.from("test_categories").update(payload).eq("id", form.id)
      : await supabase.from("test_categories").insert(payload);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setDialogOpen(false); fetchData(); }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("test_categories").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchData(); }
  };

  const exportToExcel = () => {
    const headers = ["Icon", "Name", "Sort Order", "Active"];
    const rows = items.map((c) => [c.icon, c.name, c.sort_order, c.is_active ? "Yes" : "No"]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `categories-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Categories">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Test Categories</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Button onClick={() => { setForm({ id: "", name: "", icon: "🏥", sort_order: 0, is_active: true }); setEditing(false); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Icon</TableHead><TableHead>Name</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedData.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {(() => {
                        const IconComp = icons[c.icon as keyof typeof icons];
                        return IconComp ? <IconComp className="h-5 w-5 text-primary" /> : <span>{c.icon}</span>;
                      })()}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.sort_order}</TableCell>
                    <TableCell>{c.is_active ? "✅" : "❌"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setForm(c); setEditing(true); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminPaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
            <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
