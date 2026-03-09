import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import thyrocareLogoDark from "@/assets/thyrocare-logo-dark.jpeg";

const Footer = () => {
  return (
    <footer className="bg-[hsl(217,40%,16%)] text-white/80">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={thyrocareLogoDark} alt="Thyrocare" className="h-16 w-auto object-contain rounded" />
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Your trusted partner for accurate and affordable diagnostic testing. NABL accredited lab with ISO certification.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Book a Test", href: "/tests" },
                { label: "Health Packages", href: "/tests?category=health-packages" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-white/50 hover:text-[hsl(4,76%,61%)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Popular Tests</h4>
            <ul className="space-y-2 text-sm">
              {["Thyroid Profile", "Complete Blood Count", "Lipid Profile", "Vitamin D", "HbA1c"].map((test) => (
                <li key={test}>
                  <Link to="/tests" className="text-white/50 hover:text-[hsl(4,76%,61%)] transition-colors">
                    {test}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-[hsl(4,76%,61%)]" />
                <a href="tel:04652404004" className="text-white/50 hover:text-white transition-colors">04652 404 004</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-[hsl(4,76%,61%)]" />
                <a href="mailto:info@danielclinic.com" className="text-white/50 hover:text-white transition-colors">info@danielclinic.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-[hsl(4,76%,61%)]" />
                <span className="text-white/50">WCC Junction, Distillery Road (SBI Road), Vadasery, Opp. Johnson Opticals, Nagercoil, Tamil Nadu - 629001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Thyrocare Nagercoil. All rights reserved.</p>
          <p>Powered by <a href="https://www.ecoyte.com" target="_blank" rel="noopener noreferrer" className="text-[hsl(4,76%,61%)] hover:underline">Ecoyte Business Solutions Private Limited</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;