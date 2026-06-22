// Top navigation bar: nav links, Apply Now menu, mobile menu
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Check if we're on a sitter-related page
  const isSitterPage = location.pathname.startsWith('/for-sitters') ||
                       location.pathname.startsWith('/sitting');

  // Colors based on page type
  const accentColor = isSitterPage ? '#E8A0BF' : '#8BA99E';

  const navLinks = [
    { path: "/", label: "Our Program" },
    { path: "/about", label: "About Us" },
    { path: "/become-nanny", label: "Nanny Services" },
    { path: "/for-sitters", label: "Sitter Services" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-2 md:top-3 left-1 md:left-3 right-1 md:right-3 z-50">
        <div
          className="relative flex h-14 md:h-16 items-center justify-between rounded-xl md:rounded-2xl px-4 md:px-8 border shadow-lg overflow-hidden"
          style={{
            background: `repeating-linear-gradient(
              90deg,
              #D3D3D3 0px,
              #D3D3D3 12px,
              ${accentColor} 12px,
              ${accentColor} 24px
            )`,
            borderColor: '#C0C0C0'
          }}
        >
          {/* White fade on left for logo */}
          <div
            className="absolute left-0 top-0 bottom-0 w-80 z-[1]"
            style={{
              background: 'linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 50%, transparent 100%)'
            }}
          ></div>

          {/* Grey overlay for softer look */}
          <div className="absolute inset-0 bg-gray-100/30"></div>

          {/* Logo */}
          <Link to="/" className="relative z-10">
            <img
              src="/FinalLogo.jpg"
              alt="Club Nanny"
              className="h-8 md:h-10"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 relative z-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-xs xl:text-sm font-medium transition-colors"
                style={{
                  color: isActive(link.path) ? accentColor : '#4A4A4A'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                onMouseLeave={(e) => e.currentTarget.style.color = isActive(link.path) ? accentColor : '#4A4A4A'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Apply Button with Dropdown */}
          <div className="hidden lg:flex items-center gap-3 relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="text-[#4A4A4A] rounded-full bg-white hover:bg-gray-100 shadow-sm">
                  Apply Now <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/become-nanny" className="w-full cursor-pointer">
                    Nanny Services
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/for-sitters" className="w-full cursor-pointer">
                    Sitter Services
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[#4A4A4A] relative z-10"
            style={{ '--hover-bg': `${accentColor}10` } as React.CSSProperties}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border border-gray-100 py-3 space-y-2 mt-2 rounded-xl px-3 shadow-lg" style={{ backgroundColor: 'white' }}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-2 text-sm font-normal transition-colors rounded-xl px-3"
                style={{
                  color: isActive(link.path) ? accentColor : 'rgba(74,74,74,0.8)',
                  backgroundColor: isActive(link.path) ? `${accentColor}15` : 'transparent',
                  fontWeight: isActive(link.path) ? 500 : 400
                }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
              <Button className="w-full text-white rounded-full text-sm py-2" style={{ backgroundColor: accentColor }} asChild>
                <Link to="/become-nanny" onClick={() => setIsOpen(false)}>Nanny Services</Link>
              </Button>
              <Button className="w-full text-[#4A4A4A] rounded-full text-sm py-2" variant="outline" style={{ borderColor: accentColor }} asChild>
                <Link to="/for-sitters" onClick={() => setIsOpen(false)}>Sitter Services</Link>
              </Button>
            </div>
          </div>
        )}
    </nav>
  );
}
