import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navItems = [
  { path: '/menu', label: 'Cakes', category: 'cakes' },
  { path: '/menu', label: 'Brownies', category: 'brownies' },
  { path: '/menu', label: 'Drinks', category: 'drinks' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
]

export function NavBar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#fff8f8]/80 backdrop-blur-xl shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] transition-colors duration-300">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#b00068] to-[#d62083] flex items-center justify-center">
            <span className="text-white font-bold text-lg font-['Playfair_Display']">N</span>
          </div>
          <span className="font-['Playfair_Display'] text-2xl font-bold text-[#b00068]">
            Nellai Aanantham
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.category ? `${item.path}?category=${item.category}` : item.path}
              className={`
                font-['Playfair_Display'] text-lg font-medium tracking-tight
                transition-all duration-150
                ${
                  isActive(item.path)
                    ? 'text-[#b00068] border-b-2 border-[#b00068] pb-1'
                    : 'text-[#b00068]/60 hover:text-[#b00068]'
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-[#b00068]/70 hover:text-[#b00068] transition-colors"
          >
            Staff login
          </Link>
          <Link
            to="/contact"
            className="bg-[#d62083] text-white px-8 py-3 rounded-lg font-medium shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] hover:scale-95 duration-150 ease-in-out"
          >
            Order Now
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-[#f2e5e7] transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-[#b00068]" />
          ) : (
            <Menu className="w-6 h-6 text-[#b00068]" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#fff8f8] border-t border-[#e0bec8]/30 px-6 py-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.category ? `${item.path}?category=${item.category}` : item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                block font-['Playfair_Display'] text-lg font-medium
                ${
                  isActive(item.path)
                    ? 'text-[#b00068]'
                    : 'text-[#b00068]/60'
                }
              `}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center text-sm font-medium text-[#b00068]/80 py-2"
          >
            Staff login
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-center bg-[#d62083] text-white px-8 py-3 rounded-lg font-medium"
          >
            Order Now
          </Link>
        </div>
      )}
    </nav>
  )
}
