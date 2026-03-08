import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="text-background/80" style={{ background: "var(--gradient-premium)" }}>
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg font-display">
                D
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-background">Daniel Homoeo Clinic</h3>
                <p className="text-xs text-background/50">Authorized Thyrocare Partner</p>
              </div>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              Your trusted partner for accurate and affordable diagnostic testing. NABL accredited lab with ISO certification.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Book a Test", href: "/tests" },
                { label: "Health Packages", href: "/tests?category=health-packages" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-background/60 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background mb-4">Popular Tests</h4>
            <ul className="space-y-2 text-sm">
              {["Thyroid Profile", "Complete Blood Count", "Lipid Profile", "Vitamin D", "HbA1c"].map((test) => (
                <li key={test}>
                  <Link to="/tests" className="text-background/60 hover:text-primary transition-colors">
                    {test}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <span className="text-background/60">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <span className="text-background/60">info@danielclinic.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span className="text-background/60">123, Main Road, Madurai, Tamil Nadu - 625001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-background/40">
          <p>© {new Date().getFullYear()} Daniel Homoeo Clinic. All rights reserved.</p>
          <p>Powered by <a href="https://www.ecoyte.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ecoyte Business Solutions Private Limited</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
