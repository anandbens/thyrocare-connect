import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings, FileText,
  Image, Menu, ClipboardList, Key, LogOut, Activity, MessageSquareQuote, Mail
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  roles: ("admin" | "payment_reviewer" | "content_moderator")[];
};

const allMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, roles: ["admin", "payment_reviewer", "content_moderator"] },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart, roles: ["admin", "payment_reviewer"] },
  { title: "Tests", url: "/admin/tests", icon: Package, roles: ["admin", "content_moderator"] },
  { title: "Categories", url: "/admin/categories", icon: ClipboardList, roles: ["admin", "content_moderator"] },
  { title: "Banners", url: "/admin/banners", icon: Image, roles: ["admin", "content_moderator"] },
  { title: "Testimonials", url: "/admin/testimonials", icon: MessageSquareQuote, roles: ["admin", "content_moderator"] },
  { title: "Menus", url: "/admin/menus", icon: Menu, roles: ["admin", "content_moderator"] },
  { title: "Pages", url: "/admin/pages", icon: FileText, roles: ["admin", "content_moderator"] },
  { title: "Users", url: "/admin/users", icon: Users, roles: ["admin"] },
  { title: "OTP Logs", url: "/admin/otp-logs", icon: Key, roles: ["admin"] },
  { title: "Activity Logs", url: "/admin/activity-logs", icon: Activity, roles: ["admin"] },
  { title: "Email Templates", url: "/admin/email-templates", icon: Mail, roles: ["admin"] },
  { title: "Settings", url: "/admin/settings", icon: Settings, roles: ["admin"] },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Filter menu items based on user roles
  const menuItems = allMenuItems.filter((item) => {
    if (isAdmin) return true;
    return item.roles.some((role) => hasRole(role));
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="font-display font-bold text-sm">Admin Panel</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
