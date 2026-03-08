import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminPages = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ id: "", page_key: "", title: "", content: "{}" });

  const fetch = async () => {
    const { data } = await supabase.from("page_content").select("*").order("page_key");
    setItems(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    let parsed;
    try { parsed = JSON.parse(form.content); } catch { toast({ title: "Invalid JSON", variant: "destructive" }); return; }
    const { error } = form.id
      ? await supabase.from("page_content").update({ title: form.title, content: parsed }).eq("id", form.id)
      : await supabase.from("page_content").insert({ page_key: form.page_key, title: form.title, content: parsed });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setDialogOpen(false); fetch(); }
  };

  return (
    <AdminLayout title="Page Content">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Page Content Management</CardTitle>
          <Button onClick={() => { setForm({ id: "", page_key: "", title: "", content: "{}" }); setDialogOpen(true); }}>Add Page</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Page Key</TableHead><TableHead>Title</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.page_key}</TableCell>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setForm({ ...p, content: JSON.stringify(p.content, null, 2) }); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{form.id ? "Edit" : "New"} Page</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Page Key</Label><Input value={form.page_key} onChange={(e) => setForm({ ...form, page_key: e.target.value })} disabled={!!form.id} placeholder="e.g., home, about" /></div>
            <div className="space-y-2"><Label>Title</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Content (JSON)</Label><Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="font-mono text-sm" /></div>
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

export default AdminPages;
