import { Link } from 'react-router-dom'
import { MessageCircle, MapPin, Phone, ExternalLink } from 'lucide-react'

const exploreLinks = [
  { label: 'Menu', path: '/menu' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

const connectLinks = [
  { label: 'WhatsApp', href: 'https://wa.me/919489370369', icon: MessageCircle },
  { label: 'Instagram', href: 'https://instagram.com/nellai_aanantham', icon: ExternalLink },
]

const legalLinks = [
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Terms of Service', path: '/terms' },
]

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] py-16 px-6 md:px-12 w-full">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        {/* Brand Column */}
        <div className="md:col-span-4 flex flex-col space-y-6">
          <div className="text-3xl font-['Playfair_Display'] italic text-[#ffb0cd] leading-none">
            Nellai Aanantham
          </div>
          <p className="text-neutral-100/60 text-sm max-w-xs leading-relaxed font-['Inter']">
            Where Every Bite Gives You Aanantham. Crafting traditional flavors with modern precision since 1994.
          </p>
          <div className="flex gap-4">
            <a
              href="https://wa.me/919489370369"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-100/60 hover:text-[#ffb0cd] transition-colors duration-150"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com/nellai_aanantham"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-100/60 hover:text-[#ffb0cd] transition-colors duration-150"
              title="Instagram"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Explore Column */}
        <div className="md:col-span-2 flex flex-col space-y-6">
          <h3 className="font-['Playfair_Display'] text-white/87 text-lg font-medium">Explore</h3>
          <nav className="flex flex-col space-y-4">
            {exploreLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="text-neutral-100/60 font-['Inter'] text-sm hover:underline hover:text-white transition-all duration-150 w-fit"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Connect Column */}
        <div className="md:col-span-3 flex flex-col space-y-6">
          <h3 className="font-['Playfair_Display'] text-white/87 text-lg font-medium">Connect</h3>
          <div className="flex flex-col space-y-4">
            {connectLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-neutral-100/60 font-['Inter'] text-sm hover:underline hover:text-white transition-all duration-150 w-fit"
                >
                  <Icon className="w-4 h-4 text-[#ffb0cd]" />
                  {link.label}
                </a>
              )
            })}
            <div className="flex items-start gap-3 text-neutral-100/60 font-['Inter'] text-sm">
              <Phone className="w-4 h-4 text-[#ffb0cd] mt-0.5" />
              <span>+91 94893 70369</span>
            </div>
            <div className="flex items-start gap-3 text-neutral-100/60 font-['Inter'] text-sm">
              <MapPin className="w-4 h-4 text-[#ffb0cd] mt-0.5" />
              <span>Nellai, Tamil Nadu, India</span>
            </div>
          </div>
        </div>

        {/* Legal Column */}
        <div className="md:col-span-3 flex flex-col space-y-6">
          <h3 className="font-['Playfair_Display'] text-white/87 text-lg font-medium">Legal</h3>
          <nav className="flex flex-col space-y-4">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="text-neutral-100/60 font-['Inter'] text-sm hover:underline hover:text-white transition-all duration-150 w-fit"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 space-y-2">
            <span className="text-neutral-100/38 text-xs uppercase tracking-widest block">
              FSSAI License
            </span>
            <span className="font-mono text-sm text-[#ffb0cd] font-medium tracking-wider">
              22426282000173
            </span>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="md:col-span-12 pt-12 mt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-100/38 text-xs font-['Inter'] tracking-wider uppercase">
            © {new Date().getFullYear()} Nellai Aanantham. All Rights Reserved.
          </p>
          <p className="text-neutral-100/38 text-xs font-['Inter'] tracking-wider">
            Handcrafted with ❤️ in Nellai
          </p>
        </div>
      </div>
    </footer>
  )
}
