import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPaginationControls from "@/components/admin/AdminPaginationControls";
import { useAdminPagination } from "@/hooks/useAdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminTestimonials = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ id: "", customer_name: "", customer_location: "", rating: 5, review: "", sort_order: 0, is_active: true });
  const [editing, setEditing] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("sort_order");
    setItems(data || []);
  };
  useEffect(() => { fetchData(); }, []);

  const { paginatedData, currentPage, totalPages, totalItems, setCurrentPage, rowsPerPage } = useAdminPagination(items);

  const save = async () => {
    const payload = { customer_name: form.customer_name, customer_location: form.customer_location, rating: form.rating, review: form.review, sort_order: form.sort_order, is_active: form.is_active };
    const { error } = editing
      ? await supabase.from("testimonials").update(payload).eq("id", form.id)
      : await supabase.from("testimonials").insert(payload);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setDialogOpen(false); fetchData(); }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchData(); }
  };

  const exportToExcel = () => {
    const headers = ["Customer", "Location", "Rating", "Review", "Active"];
    const rows = items.map((t) => [t.customer_name, t.customer_location || "", t.rating, t.review, t.is_active ? "Yes" : "No"]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `testimonials-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Testimonials">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Testimonial Management</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Button onClick={() => { setForm({ id: "", customer_name: "", customer_location: "", rating: 5, review: "", sort_order: 0, is_active: true }); setEditing(false); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Testimonial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Location</TableHead><TableHead>Rating</TableHead><TableHead>Review</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedData.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.customer_location}</TableCell>
                    <TableCell><div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />)}</div></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{t.review}</TableCell>
                    <TableCell>{t.sort_order}</TableCell>
                    <TableCell>{t.is_active ? "✅" : "❌"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setForm(t); setEditing(true); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No testimonials yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <AdminPaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit" : "New"} Testimonial</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Customer Name *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={form.customer_location || ""} onChange={(e) => setForm({ ...form, customer_location: e.target.value })} placeholder="e.g. Madurai, Tamil Nadu" /></div>
            <div className="space-y-2"><Label>Rating</Label>
              <Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map((r) => <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? "s" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Review *</Label><Textarea value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} rows={4} /></div>
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

export default AdminTestimonials;
