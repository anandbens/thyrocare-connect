import { motion } from "framer-motion";
import { Check, Plus, Clock, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LabTest } from "@/data/tests";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

interface TestCardProps {
  test: LabTest;
  index?: number;
}

const TestCard = ({ test, index = 0 }: TestCardProps) => {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = isInCart(test.id);
  const discount = Math.round(((test.originalPrice - test.price) / test.originalPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card className="group h-full hover:-translate-y-1 transition-all duration-300 border-border/60 hover:border-primary/30 overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {test.popular && (
                <Badge className="bg-accent/15 text-accent-foreground border-accent/30 text-xs mb-2">
                  ⭐ Popular
                </Badge>
              )}
              <Link to={`/tests/${test.id}`}>
                <h3 className="font-display font-semibold text-base lg:text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                  {test.name}
                </h3>
              </Link>
            </div>
            <Badge variant="secondary" className="text-sm ml-2 shrink-0">
              {test.parameters} params
            </Badge>
          </div>

          <p className="text-sm lg:text-base text-muted-foreground mb-4 line-clamp-2 flex-1">
            {test.description}
          </p>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {test.turnaround}
            </span>
            <span className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4" />
              {test.sampleType}
            </span>
            {test.fasting && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                Fasting
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-border/50">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">₹{test.price}</span>
                <span className="text-sm text-muted-foreground line-through">₹{test.originalPrice}</span>
              </div>
              <span className="text-xs font-medium text-primary">{discount}% off</span>
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
