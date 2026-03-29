import { Link } from 'react-router-dom'
import { useState } from 'react'
import { HeroSection } from '@/components/customer'
import { ArrowUpRight, History, ChevronRight, Cake } from 'lucide-react'

// Product data for featured items
const featuredProducts = {
  cakes: {
    title: 'Signature Cakes',
    description: 'Custom masterpieces for your most cherished moments.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=1000&fit=crop',
  },
  brownies: {
    title: 'Fudgy Brownies',
    description: 'Rich, dark chocolate indulgence with a crinkle top.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=600&fit=crop',
  },
  drinks: {
    title: 'Cold Brews',
    description: 'Refreshing artisanal beverages.',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop',
  },
}

export function LandingPage() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Newsletter subscription logic would go here
    alert(`Thank you for subscribing with ${email}!`)
    setEmail('')
  }

  return (
    <>
      {/* Hero Section */}
      <HeroSection
        badge="Artisanal Excellence Since 1994"
        title="Crafting"
        highlightedText="Joy in Every Bite."
        subtitle="Experience the finest Tamil heritage sweets and contemporary French patisserie, blended perfectly for your celebrations."
        backgroundImage="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
      />

      {/* Category Section (Bento Grid) */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl text-[#201a1c] font-bold mb-4">
            Our Curated Collections
          </h2>
          <div className="h-1 w-24 bg-[#b00068] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[700px]">
          {/* Cakes: Large Primary Item */}
          <Link
            to="/menu?category=cakes"
            className="md:col-span-2 md:row-span-2 bg-white rounded-xl shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] overflow-hidden group cursor-pointer"
          >
            <div className="relative h-full min-h-[400px]">
              <img
                src={featuredProducts.cakes.image}
                alt="Artisanal Cakes"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201a1c]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="font-['Playfair_Display'] text-4xl text-white mb-2">
                  {featuredProducts.cakes.title}
                </h3>
                <p className="text-white/70 mb-6 max-w-xs">
                  {featuredProducts.cakes.description}
                </p>
                <span className="text-[#fcd400] flex items-center font-bold">
                  Explore Collection
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </span>
              </div>
            </div>
          </Link>

          {/* Brownies: Secondary */}
          <Link
            to="/menu?category=brownies"
            className="md:col-span-2 bg-[#fdf0f2] rounded-xl shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] overflow-hidden group cursor-pointer flex flex-col md:flex-row"
          >
            <div className="flex-1 p-8 flex flex-col justify-center">
              <h3 className="font-['Playfair_Display'] text-2xl text-[#201a1c] mb-2">
                {featuredProducts.brownies.title}
              </h3>
              <p className="text-[#584049] text-sm mb-4">
                {featuredProducts.brownies.description}
              </p>
              <span className="text-[#b00068] font-semibold flex items-center">
                Shop Now
                <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </div>
            <div className="flex-1 h-48 md:h-auto overflow-hidden">
              <img
                src={featuredProducts.brownies.image}
                alt="Gourmet Brownies"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </Link>

          {/* Drinks: Small */}
          <Link
            to="/menu?category=drinks"
            className="md:col-span-1 bg-[#f2e5e7] rounded-xl shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] overflow-hidden group cursor-pointer relative min-h-[200px]"
          >
            <img
              src={featuredProducts.drinks.image}
              alt="Specialty Coffee"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-[#201a1c]/30" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className="font-['Playfair_Display'] text-xl text-white">
                {featuredProducts.drinks.title}
              </h3>
            </div>
          </Link>

          {/* About Us: Small Text-focused */}
          <Link
            to="/about"
            className="md:col-span-1 bg-[#d62083] rounded-xl shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] p-6 flex flex-col justify-between group cursor-pointer min-h-[200px]"
          >
            <div className="text-white">
              <History className="w-10 h-10 mb-4" />
              <h3 className="font-['Playfair_Display'] text-xl mb-2">Our Heritage</h3>
              <p className="text-white/80 text-sm">
                A legacy of sweetness since 1994, from Nellai to the world.
              </p>
            </div>
            <div className="flex justify-end">
              <ArrowUpRight className="w-6 h-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Newsletter / Social Section */}
      <section className="bg-[#fdf0f2] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Cake className="w-12 h-12 text-[#b00068] mx-auto mb-6" />
          <h2 className="font-['Playfair_Display'] text-4xl text-[#201a1c] font-bold mb-6">
            Join the Confection Connection
          </h2>
          <p className="text-[#584049] mb-10 leading-relaxed">
            Subscribe to receive secret recipes, early access to seasonal launches, and a 10% discount on your first online order.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 px-6 py-4 rounded-xl bg-white border-none focus:ring-2 focus:ring-[#b00068] shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)]"
            />
            <button
              type="submit"
              className="bg-[#b00068] text-white px-10 py-4 rounded-xl font-bold shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] hover:bg-[#d62083] transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
