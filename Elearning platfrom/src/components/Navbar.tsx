import { Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Courses", href: "/#courses" },
    { name: "Categories", href: "/#categories" },
    { name: "Analytics", href: "/analytics" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="accent">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-center">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button variant="accent" className="w-full justify-center">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
