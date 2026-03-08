import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Home, Award, FlaskConical, HeartPulse, Microscope } from "lucide-react";
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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary to-background py-16 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(168_72%_32%/0.08),transparent_60%)]" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full mb-6">
                <FlaskConical className="h-4 w-4" />
                Authorized Thyrocare Collection Centre
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                Your Health,{" "}
                <span className="text-primary">Our Priority</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Book affordable blood tests and comprehensive health packages online. 
                NABL accredited lab with free home sample collection across Madurai.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/tests">
                  <Button size="lg" className="rounded-xl text-base px-8 shadow-lg shadow-primary/20">
                    Book a Test
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/tests?category=health-packages">
                  <Button size="lg" variant="outline" className="rounded-xl text-base px-8">
                    View Packages
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-6 border-t border-border/50">
                <div className="text-center">
                  <p className="text-2xl font-bold font-display text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Tests Available</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold font-display text-foreground">10K+</p>
                  <p className="text-xs text-muted-foreground">Happy Patients</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold font-display text-foreground">99.9%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                <div className="relative bg-card rounded-3xl p-8 shadow-xl border">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: HeartPulse, label: "Heart Health", color: "text-destructive" },
                      { icon: FlaskConical, label: "Blood Tests", color: "text-primary" },
                      { icon: Microscope, label: "Lab Reports", color: "text-accent" },
                      { icon: Shield, label: "NABL Certified", color: "text-success" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-muted/50 rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
                      >
                        <item.icon className={`h-10 w-10 ${item.color}`} />
                        <span className="text-base font-medium text-foreground">{item.label}</span>
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
      <section className="py-20 bg-card border-y">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center border-0 shadow-none bg-transparent">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-18 h-18 lg:w-20 lg:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <feature.icon className="h-8 w-8 lg:h-10 lg:w-10 text-primary" />
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
                  <Card className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all text-center">
                    <CardContent className="pt-8 pb-6">
                      <span className="text-4xl lg:text-5xl mb-3 block">{cat.icon}</span>
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
      <section className="py-20 bg-muted/30">
        <div className="container">
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
            className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-10 lg:p-16 text-center text-primary-foreground"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
              Book Your Health Checkup Today
            </h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8 text-lg">
              Don't wait for symptoms. Get a complete health checkup at affordable prices with free home collection.
            </p>
            <Link to="/tests">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-xl text-base px-10 font-semibold"
              >
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
