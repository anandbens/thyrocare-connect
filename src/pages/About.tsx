import { motion } from "framer-motion";
import { Award, Users, Microscope, HeartPulse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";

const stats = [
  { icon: Users, label: "Happy Patients", value: "10,000+" },
  { icon: Microscope, label: "Tests Processed", value: "50,000+" },
  { icon: Award, label: "Years Experience", value: "15+" },
  { icon: HeartPulse, label: "Accuracy Rate", value: "99.9%" },
];

const About = () => {
  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-display font-bold text-foreground mb-6">About Daniel Homoeo Clinic</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Daniel Homoeo Clinic is an authorized Thyrocare collection centre in Madurai, dedicated to providing 
              affordable and accurate diagnostic testing services. With over 15 years of healthcare experience, 
              we bring world-class lab testing to your doorstep.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                      <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-display font-bold text-foreground">Why Choose Us?</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-foreground">NABL Accredited Labs</strong> — All tests processed at Thyrocare's ISO-certified central laboratory</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-foreground">Free Home Collection</strong> — Our trained phlebotomists collect samples from your doorstep</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-foreground">Quick Reports</strong> — Digital reports delivered within 24-48 hours via email</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-foreground">Affordable Pricing</strong> — Up to 50% off on all health packages and individual tests</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
