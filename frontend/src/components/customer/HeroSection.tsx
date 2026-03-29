import { Link } from 'react-router-dom'
import { MessageCircle, ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  title: string
  highlightedText?: string
  subtitle: string
  badge?: string
  backgroundImage?: string
  showCTAs?: boolean
}

export function HeroSection({
  title,
  highlightedText,
  subtitle,
  badge,
  backgroundImage,
  showCTAs = true,
}: HeroSectionProps) {
  const defaultBgImage = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop'

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImage || defaultBgImage}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(32, 26, 28, 0.8) 0%, rgba(32, 26, 28, 0.4) 50%, rgba(32, 26, 28, 0) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-12 w-full">
        <div className="col-span-12 md:col-span-8 lg:col-span-6">
          {badge && (
            <span className="inline-block px-4 py-1 rounded-full bg-[#fcd400] text-[#221b00] font-semibold text-sm mb-6 uppercase tracking-widest">
              {badge}
            </span>
          )}

          <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-tight mb-8">
            {title}{' '}
            {highlightedText && (
              <span className="text-[#fcd400] italic">{highlightedText}</span>
            )}
          </h1>

          <p className="text-white/87 text-lg md:text-xl mb-12 max-w-lg leading-relaxed">
            {subtitle}
          </p>

          {showCTAs && (
            <div className="flex flex-col sm:flex-row gap-6">
              <a
                href="https://wa.me/919489370369"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#b00068] text-white h-14 px-8 rounded-xl shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] hover:bg-[#d62083] transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Order Now</span>
              </a>
              <Link
                to="/menu"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl hover:bg-white/20 transition-all font-semibold flex items-center justify-center gap-2"
              >
                View Menu
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
