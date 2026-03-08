import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Tests from "./pages/Tests";
import TestDetail from "./pages/TestDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/dashboard/Dashboard";
import UserOrders from "./pages/dashboard/UserOrders";
import UserReports from "./pages/dashboard/UserReports";
import UserProfile from "./pages/dashboard/UserProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTests from "./pages/admin/AdminTests";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminMenus from "./pages/admin/AdminMenus";
import AdminPages from "./pages/admin/AdminPages";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOtpLogs from "./pages/admin/AdminOtpLogs";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tests" element={<Tests />} />
              <Route path="/tests/:id" element={<TestDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              {/* User Dashboard Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/orders" element={<UserOrders />} />
              <Route path="/dashboard/orders/:id" element={<UserOrders />} />
              <Route path="/dashboard/reports" element={<UserReports />} />
              <Route path="/dashboard/profile" element={<UserProfile />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/tests" element={<AdminTests />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/banners" element={<AdminBanners />} />
              <Route path="/admin/testimonials" element={<AdminTestimonials />} />
              <Route path="/admin/menus" element={<AdminMenus />} />
              <Route path="/admin/pages" element={<AdminPages />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/otp-logs" element={<AdminOtpLogs />} />
              <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/email-templates" element={<AdminEmailTemplates />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
