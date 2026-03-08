import { useEffect, useState, useMemo } from "react";
import { Search, Download, Shield, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPaginationControls from "@/components/admin/AdminPaginationControls";
import { useAdminPagination } from "@/hooks/useAdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ALL_ROLES = ["admin", "user", "payment_reviewer", "content_moderator"] as const;
type AppRole = (typeof ALL_ROLES)[number];

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  user: "bg-blue-100 text-blue-800",
  payment_reviewer: "bg-yellow-100 text-yellow-800",
  content_moderator: "bg-purple-100 text-purple-800",
};

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  user: "User",
  payment_reviewer: "Order Manager",
  content_moderator: "Content Moderator",
};

const AdminUsers = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Role management dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingRoles, setEditingRoles] = useState<AppRole[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    setProfiles(profilesRes.data || []);

    const rolesMap: Record<string, AppRole[]> = {};
    (rolesRes.data || []).forEach((r: any) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role as AppRole);
    });
    setUserRoles(rolesMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const roles = userRoles[p.user_id] || ["user"];
      if (roleFilter !== "all" && !roles.includes(roleFilter as AppRole)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.full_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
        );
      }
      return true;
    });
  }, [profiles, userRoles, search, roleFilter]);

  const { paginatedData, currentPage, totalPages, totalItems, setCurrentPage, rowsPerPage } = useAdminPagination(filtered);

  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setEditingRoles(userRoles[user.user_id] || ["user"]);
    setRoleDialogOpen(true);
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.user_id;

    // Delete existing roles
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Insert new roles
    const rolesToInsert = editingRoles.length > 0 ? editingRoles : ["user"];
    const { error } = await supabase.from("user_roles").insert(
      rolesToInsert.map((role) => ({ user_id: userId, role }))
    );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Roles updated successfully" });
      setRoleDialogOpen(false);
      fetchData();
    }
  };

  const toggleRole = (role: AppRole) => {
    setEditingRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const exportToExcel = () => {
    const headers = ["Name", "Email", "Phone", "Roles", "Joined"];
    const rows = filtered.map((p) => [
      p.full_name || "",
      p.email || "",
      p.phone || "",
      (userRoles[p.user_id] || ["user"]).map((r: string) => roleLabelMap[r] || r).join("; "),
      new Date(p.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Users">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <CardTitle className="font-display">User Management</CardTitle>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, email, phone..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Filter by role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{roleLabelMap[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground mb-3">{totalItems} users</p>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                ) : (
                  paginatedData.map((p) => {
                    const roles = userRoles[p.user_id] || ["user"];
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{p.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {roles.map((role: string) => (
                              <Badge key={role} className={roleColors[role] || ""} variant="secondary">
                                {roleLabelMap[role] || role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openRoleDialog(p)}>
                            <Shield className="h-4 w-4 mr-1" /> Roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <AdminPaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserCog className="h-5 w-5" /> Manage Roles
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium">{selectedUser.full_name || "Unnamed User"}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="space-y-3">
                <Label>Assign Roles</Label>
                {ALL_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`role-${role}`}
                      checked={editingRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <div>
                      <Label htmlFor={`role-${role}`} className="font-medium cursor-pointer">
                        {roleLabelMap[role]}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {role === "admin" && "Full access to all admin features"}
                        {role === "user" && "Regular user with basic access"}
                        {role === "payment_reviewer" && "Can manage orders and payments"}
                        {role === "content_moderator" && "Can manage tests, banners, pages, and content"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRoles}>Save Roles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
