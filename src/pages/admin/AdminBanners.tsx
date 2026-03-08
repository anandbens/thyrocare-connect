import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
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

const AdminBanners = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ id: "", title: "", subtitle: "", image_url: "", link_url: "", sort_order: 0, is_active: true });
  const [editing, setEditing] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setItems(data || []);
  };
  useEffect(() => { fetchData(); }, []);

  const { paginatedData, currentPage, totalPages, totalItems, setCurrentPage, rowsPerPage } = useAdminPagination(items);

  const save = async () => {
    const payload = { title: form.title, subtitle: form.subtitle, image_url: form.image_url, link_url: form.link_url, sort_order: form.sort_order, is_active: form.is_active };
    const { error } = editing
      ? await supabase.from("banners").update(payload).eq("id", form.id)
      : await supabase.from("banners").insert(payload);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setDialogOpen(false); fetchData(); }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchData(); }
  };

  const exportToExcel = () => {
    const headers = ["Title", "Subtitle", "Link", "Sort Order", "Active"];
    const rows = items.map((b) => [b.title, b.subtitle || "", b.link_url || "", b.sort_order, b.is_active ? "Yes" : "No"]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `banners-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Banners">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Banner Management</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Button onClick={() => { setForm({ id: "", title: "", subtitle: "", image_url: "", link_url: "", sort_order: 0, is_active: true }); setEditing(false); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Subtitle</TableHead><TableHead>Link</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedData.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell className="text-muted-foreground">{b.subtitle}</TableCell>
                    <TableCell className="text-sm truncate max-w-[150px]">{b.link_url}</TableCell>
                    <TableCell>{b.sort_order}</TableCell>
                    <TableCell>{b.is_active ? "✅" : "❌"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setForm(b); setEditing(true); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => del(b.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit" : "New"} Banner</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Subtitle</Label><Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>Link URL</Label><Input value={form.link_url || ""} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
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

export default AdminBanners;
