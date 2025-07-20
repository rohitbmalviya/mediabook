import Link from "next/link";
import { Stethoscope } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors mb-3"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
                <Stethoscope className="text-primary-foreground" size={14} />
              </div>
              <span className="font-semibold">MediBook</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-48">
              Connecting patients with trusted doctors. Book appointments in
              minutes.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Product
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/doctors", label: "Find Doctors" },
                { href: "/register", label: "Sign Up" },
                { href: "/login", label: "Log In" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Company
            </h3>
            <ul className="space-y-2">
              {[
                { href: "#", label: "About Us" },
                { href: "#", label: "Careers" },
                { href: "#", label: "Blog" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Legal</h3>
            <ul className="space-y-2">
              {[
                { href: "#", label: "Privacy Policy" },
                { href: "#", label: "Terms of Service" },
                { href: "#", label: "Cookie Policy" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MediBook. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            This is a portfolio demo — not for real medical use.
          </p>
        </div>
      </div>
    </footer>
  );
}
