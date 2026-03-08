import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const emptyTest = {
  id: "",
  name: "",
  description: "",
  category_id: "",
  parameters: 0,
  parameters_list: [] as string[],
  price: 0,
  original_price: 0,
  is_popular: false,
  turnaround: "24-48 hours",
  fasting_required: false,
  sample_type: "Blood",
  is_active: true,
};

const AdminTests = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyTest);
  const [editing, setEditing] = useState(false);
  const [paramsText, setParamsText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [testsRes, catsRes] = await Promise.all([
      supabase.from("lab_tests").select("*, test_categories(name)").order("created_at", { ascending: false }),
      supabase.from("test_categories").select("*").order("sort_order"),
    ]);
    setTests(testsRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setForm(emptyTest);
    setParamsText("");
    setEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (test: any) => {
    setForm({ ...test, category_id: test.category_id || "" });
    setParamsText((test.parameters_list || []).join(", "));
    setEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const paramsList = paramsText.split(",").map((s: string) => s.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      description: form.description,
      category_id: form.category_id || null,
      parameters: paramsList.length,
      parameters_list: paramsList,
      price: Number(form.price),
      original_price: Number(form.original_price),
      is_popular: form.is_popular,
      turnaround: form.turnaround,
      fasting_required: form.fasting_required,
      sample_type: form.sample_type,
      is_active: form.is_active,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("lab_tests").update(payload).eq("id", form.id));
    } else {
      ({ error } = await supabase.from("lab_tests").insert(payload));
    }

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editing ? "Test updated" : "Test created" });
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    // Check if test has orders
    const { count } = await supabase.from("order_items").select("id", { count: "exact" }).eq("test_id", id);
    if (count && count > 0) {
      // Soft delete - deactivate
      const { error } = await supabase.from("lab_tests").update({ is_active: false }).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Test deactivated", description: "This test has orders, so it was deactivated instead of deleted." });
    } else {
      const { error } = await supabase.from("lab_tests").delete().eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Test deleted" });
    }
    fetchData();
  };

  const filtered = tests.filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Test Management">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Lab Tests</CardTitle>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Test</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Params</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filtered.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell>{test.test_categories?.name || "—"}</TableCell>
                    <TableCell>₹{test.price}</TableCell>
                    <TableCell className="text-muted-foreground">₹{test.original_price}</TableCell>
                    <TableCell>{test.parameters}</TableCell>
                    <TableCell>{test.is_popular ? <Badge>Yes</Badge> : "—"}</TableCell>
                    <TableCell>{test.is_active ? <Badge variant="secondary">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(test)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(test.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Test" : "New Test"}</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Test Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sample Type</Label>
              <Input value={form.sample_type || ""} onChange={(e) => setForm({ ...form, sample_type: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Price (₹) *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Original Price (MRP ₹) *</Label>
              <Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Turnaround Time</Label>
              <Input value={form.turnaround || ""} onChange={(e) => setForm({ ...form, turnaround: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Parameters (comma separated)</Label>
              <Textarea value={paramsText} onChange={(e) => setParamsText(e.target.value)} placeholder="e.g., T3, T4, TSH" />
            </div>
            <div className="flex items-center gap-4">
              <Label>Popular</Label>
              <Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} />
            </div>
            <div className="flex items-center gap-4">
              <Label>Fasting Required</Label>
              <Switch checked={form.fasting_required} onCheckedChange={(v) => setForm({ ...form, fasting_required: v })} />
            </div>
            <div className="flex items-center gap-4">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTests;
