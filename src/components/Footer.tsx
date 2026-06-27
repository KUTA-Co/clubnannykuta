// Site footer: Get Started links, social icons, contact
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail } from "lucide-react";
import { DownloadAppButton } from "@/components/DownloadAppButton";

export function Footer() {
  return (
    <footer className="px-2 md:px-3 pb-2 md:pb-3">
      <div className="rounded-2xl md:rounded-3xl mt-2 md:mt-3" style={{ backgroundColor: '#4A4A4A' }}>
        <div className="container mx-auto px-5 md:px-6 py-10 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-10">

            {/* Brand */}
            <div className="col-span-2 lg:col-span-2 space-y-4 md:space-y-6">
              <Link to="/">
                <img src="/clubnannynobg.png" alt="Club Nanny" className="h-10 md:h-12" style={{ filter: 'brightness(0) invert(1)' }} />
              </Link>
              <p className="text-white/70 leading-relaxed max-w-sm text-sm md:text-base">
                Faith-aligned partnerships connecting families with young ladies and women who serve with purpose, joy, and integrity.
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/share/175nm36ti9/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/clubnannyofficial/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.tiktok.com/@clubnanny" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-3 md:mb-5 text-white text-sm md:text-base">Quick Links</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link to="/" className="text-white/70 hover:text-white transition-colors text-sm md:text-base">Our Program</Link></li>
                <li><Link to="/about" className="text-white/70 hover:text-white transition-colors text-sm md:text-base">About Us</Link></li>
                <li><Link to="/contact" className="text-white/70 hover:text-white transition-colors text-sm md:text-base">Contact</Link></li>
              </ul>
            </div>

            {/* For You */}
            <div>
              <h3 className="font-bold mb-3 md:mb-5 text-white text-sm md:text-base">Get Started</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link to="/become-nanny" className="text-white/70 hover:text-white transition-colors text-sm md:text-base">Nanny Services</Link></li>
                <li><Link to="/for-sitters" className="text-white/70 hover:text-white transition-colors text-sm md:text-base">Sitter Services</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-bold mb-3 md:mb-5 text-white text-sm md:text-base">Contact Us</h3>
              <ul className="space-y-3 md:space-y-4">
                <li>
                  <a href="mailto:Leigh@clubnanny.com" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                    <Mail className="h-4 w-4" />
                    Leigh@clubnanny.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-xs md:text-sm text-white/60">
              © {new Date().getFullYear()} Club Nanny. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <Link to="/privacy" className="text-xs md:text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-xs md:text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
              <div className="flex flex-col items-center gap-1">
                <DownloadAppButton
                  variant="ghost"
                  className="h-auto rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white md:text-sm"
                >
                  Download the App
                </DownloadAppButton>
                <span className="text-[10px] font-bold text-white/60 md:text-xs">
                  Note: The App Download is only required for SITTER SERVICES
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
