interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image?: string
  category: string
  badge?: 'bestseller' | 'new'
}

export function ProductCard({
  name,
  description,
  price,
  image,
  badge,
}: ProductCardProps) {
  const placeholderImage = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop'

  return (
    <div className="group cursor-pointer">
      {/* Image Container */}
      <div className="aspect-square rounded-xl overflow-hidden mb-4 relative shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)] transition-all duration-150 ease-out group-hover:scale-[1.02] group-hover:shadow-[0_4px_12px_hsla(0,0%,0%,0.08)]">
        <img
          src={image || placeholderImage}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {badge && (
          <div
            className={`
              absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md
              ${
                badge === 'bestseller'
                  ? 'bg-[#fcd400]/90 text-[#221b00]'
                  : 'bg-[#b00068]/90 text-white'
              }
            `}
          >
            {badge === 'bestseller' ? 'Best Seller' : 'New'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-['Playfair_Display'] font-bold text-[#201a1c] leading-tight">
            {name}
          </h3>
          <p className="text-[#584049] text-sm mt-1 leading-relaxed opacity-80 line-clamp-2">
            {description}
          </p>
        </div>
        <span className="text-[#b00068] font-bold text-lg whitespace-nowrap">
          ₹{price}
        </span>
      </div>

      {/* Add to Cart Button - appears on hover */}
      <button className="mt-4 w-full min-h-[44px] bg-gradient-to-br from-[#b00068] to-[#d62083] text-white rounded-lg font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        Order via WhatsApp
      </button>
    </div>
  )
}
