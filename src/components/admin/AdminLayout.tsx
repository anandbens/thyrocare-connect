import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNewOrderCount } from "@/hooks/useNewOrderCount";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  requiredRole?: "admin" | "payment_reviewer" | "content_moderator";
}

const AdminLayout = ({ children, title, requiredRole }: AdminLayoutProps) => {
  const { user, isAdmin, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const newOrderCount = useNewOrderCount();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  const hasAccess = isAdmin || (requiredRole && hasRole(requiredRole));
  if (!hasAccess) return <Navigate to="/dashboard" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-display font-semibold">{title}</h1>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => navigate("/admin/orders?tab=new")}
              >
                <Bell className="h-5 w-5" />
                {newOrderCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                    {newOrderCount}
                  </span>
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
