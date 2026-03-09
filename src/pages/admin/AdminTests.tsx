import { useEffect, useState } from "react";
import { buildSafeCsv, downloadCsv } from "@/lib/csvSanitize";
import { Plus, Pencil, Trash2, Search, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPaginationControls from "@/components/admin/AdminPaginationControls";
import { useAdminPagination } from "@/hooks/useAdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParamGroup } from "@/data/tests";

const emptyTest = {
  id: "", name: "", test_code: "", description: "", category_id: "", parameters: 0,
  parameters_list: [] as string[], parameters_grouped: [] as ParamGroup[],
  price: 0, original_price: 0,
  is_popular: false, turnaround: "24-48 hours", fasting_required: false,
  sample_type: "Blood", is_active: true, image_url: "",
};

const AdminTests = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyTest);
  const [editing, setEditing] = useState(false);
  const [paramsText, setParamsText] = useState("");
  const [paramGroups, setParamGroups] = useState<ParamGroup[]>([]);

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

  const filtered = tests.filter((t) => {
    if (search && !t.name?.toLowerCase().includes(search.toLowerCase()) && !t.test_code?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
    if (statusFilter === "active" && !t.is_active) return false;
    if (statusFilter === "inactive" && t.is_active) return false;
    return true;
  });

  const { paginatedData, currentPage, totalPages, totalItems, setCurrentPage, rowsPerPage } = useAdminPagination(filtered);

  const openNew = () => { setForm(emptyTest); setParamsText(""); setParamGroups([]); setEditing(false); setDialogOpen(true); };
  const openEdit = (test: any) => {
    const groups = (test.parameters_grouped || []) as ParamGroup[];
    setForm({ ...test, category_id: test.category_id || "", parameters_grouped: groups });
    setParamsText((test.parameters_list || []).join(", "));
    setParamGroups(groups);
    setEditing(true);
    setDialogOpen(true);
  };

  // Param group helpers
  const addGroup = () => setParamGroups([...paramGroups, { group: "", count: 0, tests: [] }]);
  const removeGroup = (idx: number) => setParamGroups(paramGroups.filter((_, i) => i !== idx));
  const updateGroupName = (idx: number, name: string) => {
    const updated = [...paramGroups];
    updated[idx].group = name;
    setParamGroups(updated);
  };
  const updateGroupTests = (idx: number, testsStr: string) => {
    const updated = [...paramGroups];
    const testsList = testsStr.split(",").map(s => s.trim()).filter(Boolean);
    updated[idx].tests = testsList;
    updated[idx].count = testsList.length;
    setParamGroups(updated);
  };

  const handleSave = async () => {
    // Build flat params list from groups if groups exist, otherwise from paramsText
    let paramsList: string[];
    let finalGroups: ParamGroup[];

    if (paramGroups.length > 0 && paramGroups.some(g => g.tests.length > 0)) {
      paramsList = paramGroups.flatMap(g => g.tests);
      finalGroups = paramGroups.filter(g => g.group && g.tests.length > 0);
    } else {
      paramsList = paramsText.split(",").map((s: string) => s.trim()).filter(Boolean);
      finalGroups = [];
    }

    const payload = {
      name: form.name, test_code: form.test_code || null, description: form.description,
      category_id: form.category_id || null,
      parameters: paramsList.length, parameters_list: paramsList,
      parameters_grouped: finalGroups as any,
      price: Number(form.price), original_price: Number(form.original_price),
      is_popular: form.is_popular, turnaround: form.turnaround,
      fasting_required: form.fasting_required, sample_type: form.sample_type, is_active: form.is_active,
    };
    let error;
    if (editing) ({ error } = await supabase.from("lab_tests").update(payload).eq("id", form.id));
    else ({ error } = await supabase.from("lab_tests").insert(payload));
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Test updated" : "Test created" }); setDialogOpen(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    const { count } = await supabase.from("order_items").select("id", { count: "exact" }).eq("test_id", id);
    if (count && count > 0) {
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

  const exportToExcel = () => {
    const headers = ["Name", "Code", "Category", "Price", "MRP", "Parameters", "Popular", "Active"];
    const rows = filtered.map((t) => [t.name, t.test_code || "", t.test_categories?.name || "", t.price, t.original_price, t.parameters, t.is_popular ? "Yes" : "No", t.is_active ? "Yes" : "No"]);
    const csv = buildSafeCsv(headers, rows);
    downloadCsv(csv, `tests-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <AdminLayout title="Test Management">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Lab Tests</CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Test</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tests..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground mb-3">{totalItems} tests</p>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead>
                  <TableHead>MRP</TableHead><TableHead>Params</TableHead><TableHead>Popular</TableHead>
                  <TableHead>Active</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : paginatedData.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="text-muted-foreground text-xs font-mono">{test.test_code || "—"}</TableCell>
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

          <AdminPaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Test" : "New Test"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Test Code</Label><Input value={form.test_code || ""} onChange={(e) => setForm({ ...form, test_code: e.target.value })} placeholder="e.g. AACP1" /></div>
            <div className="space-y-2"><Label>Test Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Sample Type</Label><Input value={form.sample_type || ""} onChange={(e) => setForm({ ...form, sample_type: e.target.value })} /></div>
            <div className="space-y-2"><Label>Price (₹) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Original Price (MRP ₹) *</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Turnaround Time</Label><Input value={form.turnaround || ""} onChange={(e) => setForm({ ...form, turnaround: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Parameters (comma separated — used when no groups below)</Label><Textarea value={paramsText} onChange={(e) => setParamsText(e.target.value)} placeholder="e.g., T3, T4, TSH" /></div>
            
            {/* Grouped Parameters */}
            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Grouped Parameters (for packages)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addGroup}><Plus className="h-3 w-3 mr-1" /> Add Group</Button>
              </div>
              {paramGroups.length === 0 && (
                <p className="text-xs text-muted-foreground">No groups added. Use the flat parameters field above for simple tests, or add groups for packages.</p>
              )}
              {paramGroups.map((g, idx) => (
                <Card key={idx} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Group name (e.g. Liver, Thyroid)"
                      value={g.group}
                      onChange={(e) => updateGroupName(idx, e.target.value)}
                      className="flex-1"
                    />
                    <Badge variant="secondary">{g.tests.length} tests</Badge>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGroup(idx)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Comma-separated tests: Hba1c, Average blood glucose (abg)"
                    value={g.tests.join(", ")}
                    onChange={(e) => updateGroupTests(idx, e.target.value)}
                    rows={2}
                  />
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-4"><Label>Popular</Label><Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} /></div>
            <div className="flex items-center gap-4"><Label>Fasting Required</Label><Switch checked={form.fasting_required} onCheckedChange={(v) => setForm({ ...form, fasting_required: v })} /></div>
            <div className="flex items-center gap-4"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></div>
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
