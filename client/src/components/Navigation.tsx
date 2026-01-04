import { MessageSquare, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import logoImg from "@/assets/logo.jpg";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const safeNavigate = (href: string) => {
    setMobileMenuOpen(false);

    // 🔹 Changer de page
    setLocation(href);

    // 🔹 Scroll vers le top ou vers un id précis après un petit délai
    setTimeout(() => {
      // Si href contient une ancre (#)
      const hashIndex = href.indexOf("#");
      if (hashIndex !== -1) {
        const id = href.slice(hashIndex + 1);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }

      // Sinon scroll vers le haut
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100); // délai pour s'assurer que le DOM est monté
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/features#features-top", label: "Features" },
    { href: "/groups", label: "Task Groups" },
    { href: "/contact", label: "Contact" },
    { href: "/beta", label: "Beta" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div
            onClick={() => safeNavigate("/")}
            className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2 transition-all cursor-pointer"
            data-testid="link-home"
          >
            <img
              src={logoImg}
              alt="CalmlyAI Logo"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-xl font-semibold">CalmlyAI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                onClick={() => safeNavigate(link.href)}
                data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Button>
            ))}
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              onClick={() => safeNavigate("/features#features-top")}
              data-testid="button-get-started-nav"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2 animate-in fade-in">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => safeNavigate(link.href)}
                data-testid={`mobile-link-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Button>
            ))}

            <Button
              className="w-full"
              onClick={() => safeNavigate("/features#features-top")}
              data-testid="button-get-started-mobile"
            >
              Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
