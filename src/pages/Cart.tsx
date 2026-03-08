import { Link } from "react-router-dom";
import { Trash2, ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/context/CartContext";

const Cart = () => {
  const { items, removeItem, clearCart, totalAmount, totalSavings } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add tests or health packages to get started</p>
          <Link to="/tests">
            <Button>
              Browse Tests <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10">
        <div className="container max-w-3xl">
          <Link to="/tests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>

          <h1 className="text-3xl font-display font-bold text-foreground mb-8">Your Cart</h1>

          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <Card key={item.test.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.test.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.test.parameters} parameters • {item.test.turnaround}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{item.test.price}</p>
                      <p className="text-xs text-muted-foreground line-through">₹{item.test.original_price}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.test.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span className="font-medium">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Home Collection</span>
                <span className="text-primary font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-sm text-primary">
                <span>Total Savings</span>
                <span className="font-medium">-₹{totalSavings}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>

              <Link to="/verify-otp">
                <Button className="w-full rounded-xl mt-4" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
