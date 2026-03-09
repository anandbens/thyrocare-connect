import { motion } from "framer-motion";
import { Check, Plus, Clock, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LabTest } from "@/data/tests";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { getTestImage } from "@/lib/testImages";

interface TestCardProps {
  test: LabTest;
  index?: number;
}

const TestCard = ({ test, index = 0 }: TestCardProps) => {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = isInCart(test.id);
  const discount = Math.round(((test.original_price - test.price) / test.original_price) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card className="group h-full hover:-translate-y-1 transition-all duration-300 border-border/60 hover:border-primary/30 overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
        {/* Test Image */}
        <Link to={`/tests/${test.id}`} className="block">
          <div className="relative h-40 overflow-hidden bg-muted">
            <img
              src={test.image_url || defaultTestImage}
              alt={test.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {discount > 0 && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-destructive text-destructive-foreground text-xs font-bold shadow-md">
                  {discount}% OFF
                </Badge>
              </div>
            )}
            {test.is_popular && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-accent/90 text-accent-foreground text-xs shadow-md">
                  ⭐ Popular
                </Badge>
              </div>
            )}
          </div>
        </Link>

        <CardContent className="p-5 flex flex-col flex-1">
          <Link to={`/tests/${test.id}`}>
            <h3 className="font-display font-semibold text-base lg:text-lg text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
              {test.name}
            </h3>
          </Link>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {test.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {test.turnaround || "24-48 hrs"}
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              {test.sample_type || "Blood"}
            </span>
            {test.parameters && (
              <Badge variant="secondary" className="text-xs">
                {test.parameters} params
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-border/50">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">₹{test.price}</span>
                <span className="text-sm text-muted-foreground line-through">₹{test.original_price}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant={inCart ? "default" : "outline"}
              className={inCart ? "bg-primary" : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"}
              onClick={() => (inCart ? removeItem(test.id) : addItem(test))}
            >
              {inCart ? (
                <>
                  <Check className="h-4 w-4 mr-1" /> Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestCard;
