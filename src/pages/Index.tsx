import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield, Clock, Home, Award, FlaskConical, HeartPulse, Microscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import TestCard from "@/components/TestCard";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import { supabase } from "@/integrations/supabase/client";
import { LabTest, TestCategory } from "@/data/tests";

const features = [
  { icon: Home, title: "Home Collection", desc: "Free sample pickup from your doorstep" },
  { icon: Clock, title: "Quick Reports", desc: "Get results within 24-48 hours" },
  { icon: Shield, title: "NABL Accredited", desc: "ISO certified labs with 99.9% accuracy" },
  { icon: Award, title: "Affordable Prices", desc: "Up to 50% off on all health packages" },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Index = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [popularTests, setPopularTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [testsRes, catsRes] = await Promise.all([
        supabase.from("lab_tests").select("*, test_categories(id, name)").eq("is_active", true).eq("is_popular", true).limit(6),
        supabase.from("test_categories").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setPopularTests((testsRes.data as any[]) || []);
      setCategories((catsRes.data as any[]) || []);
    };
    fetchData();
  }, []);

  const getCategorySlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden py-16 lg:py-28" style={{ background: "var(--hero-gradient)" }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_50%/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(200_60%_50%/0.1),transparent_50%)]" />
        <motion.div className="container relative" style={{ y: heroY, opacity: heroOpacity }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm text-primary-foreground text-sm font-medium px-4 py-2 rounded-full mb-6 border border-primary-foreground/20">
                <Sparkles className="h-4 w-4" />
                Authorized Thyrocare Collection Centre
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-primary-foreground leading-tight mb-6">
                Your Health,{" "}
                <span className="text-accent">Our Priority</span>
              </h1>
              <p className="text-lg text-primary-foreground/80 leading-relaxed mb-4 max-w-lg">
                Book affordable blood tests and comprehensive health packages online. 
                NABL accredited lab with free home sample collection.
              </p>
              <p className="text-xl lg:text-2xl font-bold text-primary-foreground mb-8">
                🏠 Home collection throughout Kanyakumari district
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/tests">
                  <Button size="lg" className="rounded-xl text-base px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                    Book a Test
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/tests?category=health-packages">
                  <Button size="lg" variant="outline" className="rounded-xl text-base px-8 border-primary-foreground/60 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-lg">
                    View Packages
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-6 border-t border-primary-foreground/20">
                {[
                  { val: "500+", label: "Tests Available" },
                  { val: "10K+", label: "Happy Patients" },
                  { val: "99.9%", label: "Accuracy" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-6">
                    {i > 0 && <div className="w-px h-10 bg-primary-foreground/20" />}
                    <div className="text-center">
                      <p className="text-2xl font-bold font-display text-primary-foreground">{stat.val}</p>
                      <p className="text-xs text-primary-foreground/60">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary-foreground/10 rounded-3xl blur-3xl scale-110" />
                <div className="relative bg-primary-foreground/10 backdrop-blur-lg rounded-3xl p-8 border border-primary-foreground/20">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: HeartPulse, label: "Heart Health", gradient: "from-red-500/20 to-red-600/10", iconColor: "text-red-200" },
                      { icon: FlaskConical, label: "Blood Tests", gradient: "from-sky-400/20 to-cyan-500/10", iconColor: "text-sky-200" },
                      { icon: Microscope, label: "Lab Reports", gradient: "from-amber-400/20 to-orange-500/10", iconColor: "text-amber-200" },
                      { icon: Shield, label: "NABL Certified", gradient: "from-emerald-400/20 to-green-500/10", iconColor: "text-emerald-200" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`bg-gradient-to-br ${item.gradient} backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-3 text-center border border-primary-foreground/15 hover:border-primary-foreground/30 transition-all duration-300 hover:-translate-y-1`}
                      >
                        <item.icon className={`h-10 w-10 ${item.iconColor} drop-shadow-lg`} />
                        <span className="text-base font-semibold text-primary-foreground drop-shadow-sm">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card border-y relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-subtle)" }} />
        <motion.div
          className="container relative"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={itemVariant}>
                <Card className="text-center border-0 shadow-none bg-transparent group">
                  <CardContent className="pt-6 pb-4 lg:pt-8 lg:pb-6 px-3 lg:px-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-5 shadow-lg group-hover:shadow-xl transition-shadow duration-300" style={{ background: "var(--gradient-primary)" }}>
                      <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-10 lg:w-10 text-primary-foreground" />
                    </div>
                    <h3 className="font-display font-semibold text-sm sm:text-base lg:text-xl text-foreground mb-1 lg:mb-2">{feature.title}</h3>
                    <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20">
          <div className="container">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={sectionVariants}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">Browse by Category</h2>
              <p className="text-base lg:text-lg text-muted-foreground">Choose from our wide range of diagnostic tests</p>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-5"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={itemVariant}>
                  <Link to={`/tests?category=${getCategorySlug(cat.name)}`}>
                    <Card className="cursor-pointer hover:border-primary/40 transition-all text-center group hover:-translate-y-1 duration-300" style={{ boxShadow: "var(--card-shadow)" }}>
                      <CardContent className="pt-8 pb-6">
                        <span className="text-4xl lg:text-5xl mb-3 block group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                        <h3 className="font-medium text-base lg:text-lg text-foreground">{cat.name}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Popular Tests */}
      {popularTests.length > 0 && (
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-subtle)" }} />
          <div className="container relative">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={sectionVariants}
              className="flex items-end justify-between mb-12"
            >
              <div>
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-2">Popular Tests</h2>
                <p className="text-base lg:text-lg text-muted-foreground">Most booked tests by our patients</p>
              </div>
              <Link to="/tests">
                <Button variant="ghost" className="text-primary text-base">
                  View All <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {popularTests.map((test, i) => (
                <TestCard key={test.id} test={test} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-10 lg:p-16 text-center text-primary-foreground relative overflow-hidden"
            style={{ background: "var(--gradient-premium)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(168_72%_50%/0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(200_60%_50%/0.15),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
                Book Your Health Checkup Today
              </h2>
              <p className="text-primary-foreground/70 max-w-lg mx-auto mb-8 text-lg">
                Don't wait for symptoms. Get a complete health checkup at affordable prices with free home collection.
              </p>
              <Link to="/tests">
                <Button
                  size="lg"
                  className="rounded-xl text-base px-10 font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl"
                >
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
