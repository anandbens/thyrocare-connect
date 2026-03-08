import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Phone, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  sort_order: number | null;
}

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navLinks, setNavLinks] = useState<MenuItem[]>([]);
  const { itemCount } = useCart();
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const fetchMenus = async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("id, label, href, sort_order")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order");
      setNavLinks((data as MenuItem[]) || []);
    };
    fetchMenus();
  }, []);

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Top bar */}
      <div className="text-primary-foreground text-sm py-2" style={{ background: "var(--gradient-primary)" }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" />
            <span className="font-medium">+91 98765 43210</span>
            <span className="hidden sm:inline text-primary-foreground/70 ml-2">
              | Home Collection Available
            </span>
          </div>
          <div className="hidden sm:block text-primary-foreground/80">
            Authorized Thyrocare Partner
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg font-display shadow-md" style={{ background: "var(--gradient-primary)" }}>
              D
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold font-display leading-tight text-foreground">
                Daniel Homoeo Clinic
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Thyrocare Partner</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                  <User className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
            <Link to="/cart" className="relative">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t bg-card p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full mt-2" size="sm" variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full mt-2" size="sm">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full mt-2" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Login / Sign Up
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
