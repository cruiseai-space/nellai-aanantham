import { Clock, Leaf, Sparkles, Shield } from 'lucide-react'

const values = [
  {
    icon: Clock,
    title: 'Homemade Daily',
    description:
      'Every sunrise brings a new batch of goodness, baked fresh in small quantities to ensure peak flavor and texture.',
  },
  {
    icon: Leaf,
    title: 'Fresh Ingredients',
    description:
      'We source locally, choosing organic produce and seasonal fruits to maintain our commitment to sustainability and health.',
  },
  {
    icon: Sparkles,
    title: 'Custom Orders',
    description:
      'From bespoke celebration cakes to dietary-specific pastries, we craft unique experiences tailored exactly to your celebrations.',
  },
]

export function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="px-8 py-20 text-center">
        <h1 className="font-['Playfair_Display'] text-6xl md:text-8xl text-[#b00068] font-bold tracking-tighter mb-4">
          Our Story
        </h1>
        <div className="w-24 h-1 bg-[#fcd400] mx-auto rounded-full" />
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 space-y-8">
          <div className="space-y-6 max-w-[70ch]">
            <h2 className="font-['Playfair_Display'] text-4xl text-[#201a1c] leading-tight">
              From Nellai with Love
            </h2>
            <p className="text-[#201a1c]/87 text-lg">
              The journey of Nellai Aanantham began in the vibrant heart of Nellai (Tirunelveli), 
              where the aroma of freshly toasted spices and slow-fermented dough filled our family 
              kitchen. We represent a bridge between heritage and modern precision, bringing age-old 
              South Indian baking techniques into the contemporary light.
            </p>
            <p className="text-[#201a1c]/87 text-lg">
              Our commitment to artisanal quality means every loaf, pastry, and sweet is treated as 
              a masterpiece. We eschew industrial shortcuts in favor of patience, sourcing the finest 
              local grains and organic sugars to ensure that every bite tells a story of tradition, 
              refined for the modern palate.
            </p>
            <p className="text-[#201a1c]/87 text-lg italic font-['Playfair_Display'] text-xl">
              "Where Every Bite Gives You Aanantham"
            </p>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="rounded-2xl overflow-hidden aspect-[4/5] shadow-2xl shadow-[#b00068]/5">
            <img
              src="https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&h=1000&fit=crop"
              alt="Traditional yet modern bakery kitchen"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((value) => {
            const Icon = value.icon
            return (
              <div
                key={value.title}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-start gap-4 border border-[#e0bec8]/10"
              >
                <div className="w-12 h-12 rounded-xl bg-[#fdf0f2] flex items-center justify-center text-[#b00068]">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-['Playfair_Display'] text-xl text-[#201a1c] font-bold mb-2">
                    {value.title}
                  </h3>
                  <p className="text-[#201a1c]/60 text-sm">{value.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Trust Section - FSSAI */}
      <section className="max-w-7xl mx-auto px-8 py-16 border-t border-[#e0bec8]/20">
        <div className="bg-[#fdf0f2] p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-white p-4 rounded-full shadow-inner">
              <Shield className="w-10 h-10 text-[#b00068]" />
            </div>
            <div>
              <h4 className="font-['Playfair_Display'] text-2xl text-[#201a1c] font-bold">
                FSSAI Licensed
              </h4>
              <p className="text-[#201a1c]/60">
                Meeting the highest standards of food safety and hygiene.
              </p>
            </div>
          </div>
          <div className="bg-white px-8 py-4 rounded-xl border border-[#b00068]/10">
            <span className="text-[#201a1c]/60 text-xs uppercase tracking-widest block mb-1">
              License Number
            </span>
            <span className="font-mono text-xl text-[#b00068] font-bold tracking-wider">
              22426282000173
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
