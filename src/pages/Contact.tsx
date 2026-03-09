import { useState } from "react";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setLoading(false);
    }, 1000);
  };

  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-5xl">
          <h1 className="text-4xl font-display font-bold text-foreground mb-8">Contact Us</h1>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              {[
                { icon: Phone, label: "Phone", value: "04652 404 004" },
                { icon: Mail, label: "Email", value: "info@danielclinic.com" },
                { icon: MapPin, label: "Address", value: "WCC Junction, Distillery Road (SBI Road), Vadasery, Opp. Johnson Opticals, Nagercoil, Tamil Nadu - 629001" },
                { icon: Clock, label: "Working Hours", value: "Mon - Sat: 7:00 AM - 8:00 PM" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" required placeholder="How can we help you?" rows={4} />
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Google Maps */}
          <div className="mt-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">Find Us on the Map</h2>
            <div className="rounded-xl overflow-hidden border border-border shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3950.0!2d77.4295!3d8.1833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b04f10400000019%3A0x7583d67f507a5abf!2sThyrocare%20Nagercoil%20Branch!5e0!3m2!1sen!2sin!4v1700000000000"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Thyrocare Nagercoil Branch Location"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
