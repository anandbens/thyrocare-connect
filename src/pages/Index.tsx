import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Home, Award, FlaskConical, HeartPulse, Microscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import TestCard from "@/components/TestCard";
import { tests, categories } from "@/data/tests";

const popularTests = tests.filter((t) => t.popular).slice(0, 6);

const features = [
  { icon: Home, title: "Home Collection", desc: "Free sample pickup from your doorstep" },
  { icon: Clock, title: "Quick Reports", desc: "Get results within 24-48 hours" },
  { icon: Shield, title: "NABL Accredited", desc: "ISO certified labs with 99.9% accuracy" },
  { icon: Award, title: "Affordable Prices", desc: "Up to 50% off on all health packages" },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-28" style={{ background: "var(--hero-gradient)" }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_50%/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(200_60%_50%/0.1),transparent_50%)]" />
        <div className="container relative">
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
              <p className="text-lg text-primary-foreground/80 leading-relaxed mb-8 max-w-lg">
                Book affordable blood tests and comprehensive health packages online. 
                NABL accredited lab with free home sample collection across Madurai.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/tests">
                  <Button size="lg" className="rounded-xl text-base px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                    Book a Test
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/tests?category=health-packages">
                  <Button size="lg" variant="outline" className="rounded-xl text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm">
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
                      { icon: HeartPulse, label: "Heart Health", color: "text-red-300" },
                      { icon: FlaskConical, label: "Blood Tests", color: "text-primary-foreground" },
                      { icon: Microscope, label: "Lab Reports", color: "text-accent" },
                      { icon: Shield, label: "NABL Certified", color: "text-emerald-300" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-3 text-center border border-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors"
                      >
                        <item.icon className={`h-10 w-10 ${item.color}`} />
                        <span className="text-base font-medium text-primary-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card border-y relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-subtle)" }} />
        <div className="container relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center border-0 shadow-none bg-transparent group">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-18 h-18 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: "var(--gradient-primary)" }}>
                      <feature.icon className="h-8 w-8 lg:h-10 lg:w-10 text-primary-foreground" />
                    </div>
                    <h3 className="font-display font-semibold text-lg lg:text-xl text-foreground mb-2">{feature.title}</h3>
                    <p className="text-base text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">Browse by Category</h2>
            <p className="text-base lg:text-lg text-muted-foreground">Choose from our wide range of diagnostic tests</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/tests?category=${cat.id}`}>
                  <Card className="cursor-pointer hover:border-primary/40 transition-all text-center group hover:-translate-y-1 duration-300" style={{ boxShadow: "var(--card-shadow)" }}>
                    <CardContent className="pt-8 pb-6">
                      <span className="text-4xl lg:text-5xl mb-3 block group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                      <h3 className="font-medium text-base lg:text-lg text-foreground">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{cat.count} tests</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tests */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-subtle)" }} />
        <div className="container relative">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-2">Popular Tests</h2>
              <p className="text-base lg:text-lg text-muted-foreground">Most booked tests by our patients</p>
            </div>
            <Link to="/tests">
              <Button variant="ghost" className="text-primary text-base">
                View All <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularTests.map((test, i) => (
              <TestCard key={test.id} test={test} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
