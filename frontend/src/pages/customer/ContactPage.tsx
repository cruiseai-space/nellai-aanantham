import {
  ShoppingBag,
  MessageCircle,
  CreditCard,
  Truck,
  ExternalLink,
  MapPin,
  ArrowRight,
} from 'lucide-react'

const orderSteps = [
  {
    icon: ShoppingBag,
    title: 'Browse Our Collection',
    description:
      'Explore our daily selection of artisanal cakes, brownies, and beverages in our menu.',
    bgColor: 'bg-[#fcd400]',
    textColor: 'text-[#221b00]',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Your Order',
    description:
      'Send your selections to our bakery line. Mention any dietary requirements like eggless or sugar-free preferences.',
    bgColor: 'bg-[#d62083]',
    textColor: 'text-white',
  },
  {
    icon: CreditCard,
    title: 'Secure Payment',
    description:
      'Receive an itemized quote and pay securely via UPI or Card link to confirm your slot in our baking schedule.',
    bgColor: 'bg-[#fcd400]',
    textColor: 'text-[#221b00]',
  },
  {
    icon: Truck,
    title: 'Fresh Pickup or Delivery',
    description:
      'Collect your fresh treats from the bakery or opt for our local delivery service.',
    bgColor: 'bg-[#d62083]',
    textColor: 'text-white',
  },
]

export function ContactPage() {
  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 md:px-12">
      {/* Header Section */}
      <header className="mb-16 md:mb-24 text-center md:text-left">
        <p className="font-['Inter'] text-sm uppercase tracking-widest text-[#b00068] font-semibold mb-4 opacity-87">
          Connect With Us
        </p>
        <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl font-bold tracking-tight text-[#201a1c] leading-tight">
          Bringing the Bakery <br />
          <span className="italic text-[#b00068]">to your door.</span>
        </h1>
      </header>

      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-24">
        {/* How to Order: Timeline Section */}
        <section className="md:col-span-7 bg-white rounded-3xl p-8 md:p-12 shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)]">
          <h2 className="font-['Playfair_Display'] text-3xl font-bold mb-10 text-[#201a1c]">
            How to Order
          </h2>
          <div className="space-y-12 relative">
            {/* Vertical Timeline Connector Line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-px bg-[#e0bec8] opacity-30" />

            {orderSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex items-start gap-6 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full ${step.bgColor} ${step.textColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="pt-2">
                    <h3 className="font-['Playfair_Display'] text-xl font-bold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[#584049] opacity-87 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Contact Cards Section */}
        <div className="md:col-span-5 flex flex-col gap-8">
          {/* WhatsApp Card */}
          <a
            href="https://wa.me/919489370369"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[#b00068] rounded-3xl p-10 flex flex-col justify-between min-h-[280px] text-white shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] overflow-hidden relative transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="relative z-10">
              <MessageCircle className="w-10 h-10 mb-6" strokeWidth={1.5} />
              <h3 className="font-['Playfair_Display'] text-4xl font-bold leading-tight">
                WhatsApp Us
              </h3>
              <p className="mt-4 opacity-80 max-w-[240px]">
                Direct line for orders, customizations, and daily specials.
              </p>
              <p className="mt-2 font-mono text-lg">+91 94893 70369</p>
            </div>
            <div className="relative z-10 mt-8 flex items-center gap-2 font-medium">
              <span>Message Now</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#b00068] via-[#d62083] to-[#b00068] opacity-50" />
          </a>

          {/* Instagram Card */}
          <a
            href="https://instagram.com/nellai_aanantham"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[#f2e5e7] rounded-3xl p-10 flex flex-col justify-between min-h-[280px] text-[#201a1c] shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] relative transition-transform duration-200 hover:scale-[1.02]"
          >
            <div>
              <ExternalLink className="w-10 h-10 mb-6 text-[#b00068]" strokeWidth={1.5} />
              <h3 className="font-['Playfair_Display'] text-4xl font-bold leading-tight">
                Follow on
                <br />
                Instagram
              </h3>
              <p className="mt-4 opacity-60 text-[#584049] max-w-[240px]">
                Behind the scenes of our daily bake and new creations.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 font-medium text-[#b00068]">
              <span>@nellai_aanantham</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </div>
          </a>

          {/* Location Card */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#fcd400]/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#705d00]" />
              </div>
              <h4 className="font-['Playfair_Display'] text-xl font-bold">The Bakery</h4>
            </div>
            <p className="text-[#584049] opacity-87 leading-relaxed mb-4">
              Nellai (Tirunelveli)
              <br />
              Tamil Nadu, India
            </p>
            <div className="w-full h-32 rounded-2xl overflow-hidden bg-[#f2e5e7]">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=200&fit=crop"
                alt="Map location"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Special Inquiries Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-[#fdf0f2] rounded-[2rem] p-12 mb-24">
        <div className="order-2 md:order-1">
          <img
            src="https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&h=600&fit=crop"
            alt="Artisanal pastry"
            className="rounded-3xl w-full h-[400px] object-cover shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)]"
          />
        </div>
        <div className="order-1 md:order-2 space-y-8">
          <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#201a1c]">
            Special Inquiries?
          </h2>
          <p className="text-[#584049] text-lg leading-relaxed opacity-87">
            For bulk orders, wedding catering, or corporate gift boxes, please reach out via
            WhatsApp. We respond to all professional requests within 24 hours.
          </p>
          <a
            href="https://wa.me/919489370369"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex px-8 py-4 bg-[#b00068] text-white rounded-xl font-medium transition-transform duration-200 hover:scale-95 min-w-[200px] min-h-[44px] items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Us
          </a>
        </div>
      </section>
    </div>
  )
}
