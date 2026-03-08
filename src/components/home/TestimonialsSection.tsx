import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  customer_name: string;
  customer_location: string | null;
  rating: number;
  review: string;
}

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id, customer_name, customer_location, rating, review")
        .eq("is_active", true)
        .order("sort_order")
        .limit(6);
      setTestimonials(data || []);
    };
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-card border-y relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-subtle)" }} />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
            What Our Patients Say
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            Trusted by thousands of families across Madurai
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="h-full border-border/60 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300" style={{ boxShadow: "var(--card-shadow)" }}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`h-4 w-4 ${si < t.rating ? "fill-accent text-accent" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <div className="relative flex-1 mb-4">
                    <Quote className="h-8 w-8 text-primary/10 absolute -top-1 -left-1" />
                    <p className="text-base text-muted-foreground leading-relaxed pl-4">
                      {t.review}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <p className="font-display font-semibold text-foreground">{t.customer_name}</p>
                    {t.customer_location && (
                      <p className="text-sm text-muted-foreground">{t.customer_location}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
