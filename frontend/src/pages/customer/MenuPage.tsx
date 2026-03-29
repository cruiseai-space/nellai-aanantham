import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/customer'
import { Sparkles, Cookie, Coffee } from 'lucide-react'

// Product data - will be replaced with API calls later
const products = [
  // Cakes
  {
    id: 'cake-1',
    name: 'Vanilla Cake',
    description: 'Classic vanilla sponge with smooth buttercream frosting. Perfect for any celebration.',
    price: 750,
    category: 'cakes',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    badge: 'bestseller' as const,
  },
  {
    id: 'cake-2',
    name: 'Pineapple Cake',
    description: 'Fresh pineapple layers with light whipped cream. A tropical delight.',
    price: 850,
    category: 'cakes',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
  },
  {
    id: 'cake-3',
    name: 'Black Forest',
    description: 'Rich chocolate layers with cherry filling and whipped cream.',
    price: 950,
    category: 'cakes',
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&h=400&fit=crop',
  },
  {
    id: 'cake-4',
    name: 'Choco Truffle',
    description: 'Decadent chocolate truffle with dark ganache. For true chocolate lovers.',
    price: 1100,
    category: 'cakes',
    image: 'https://images.unsplash.com/photo-1578775887804-699de7086ff9?w=400&h=400&fit=crop',
    badge: 'new' as const,
  },
  // Brownies
  {
    id: 'brownie-1',
    name: 'Classic Brownie',
    description: 'Fudgy chocolate brownie with a crinkly top. The perfect balance.',
    price: 70,
    category: 'brownies',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop',
    badge: 'bestseller' as const,
  },
  {
    id: 'brownie-2',
    name: 'Double Chocolate',
    description: 'Extra chocolate chips folded into our signature brownie batter.',
    price: 90,
    category: 'brownies',
    image: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=400&h=400&fit=crop',
  },
  {
    id: 'brownie-3',
    name: 'Triple Chocolate',
    description: 'Dark, milk, and white chocolate in every bite. Ultimate indulgence.',
    price: 110,
    category: 'brownies',
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=400&fit=crop',
    badge: 'new' as const,
  },
  // Drinks
  {
    id: 'drink-1',
    name: 'Hot Chocolate',
    description: 'Rich Belgian chocolate with steamed milk and marshmallows.',
    price: 80,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=400&fit=crop',
    badge: 'bestseller' as const,
  },
  {
    id: 'drink-2',
    name: 'Cold Coffee',
    description: 'Smooth cold brew blended with ice cream. Refreshingly delicious.',
    price: 60,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
  },
  {
    id: 'drink-3',
    name: 'Rose Milk',
    description: 'Traditional rose-flavored milk. A nostalgic favorite.',
    price: 50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1544252890-6a5c0cc2f4b1?w=400&h=400&fit=crop',
  },
]

const categories = [
  { id: 'all', label: 'All Items', icon: Sparkles },
  { id: 'cakes', label: 'Cakes', icon: Sparkles },
  { id: 'brownies', label: 'Brownies', icon: Cookie },
  { id: 'drinks', label: 'Drinks', icon: Coffee },
]

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const [activeCategory, setActiveCategory] = useState(initialCategory)

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products
    return products.filter((p) => p.category === activeCategory)
  }, [activeCategory])

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    if (categoryId === 'all') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', categoryId)
    }
    setSearchParams(searchParams)
  }

  return (
    <div className="pt-24 pb-32">
      {/* Hero Section */}
      <section className="px-6 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 lg:col-span-8">
              <span className="text-[#b00068] font-semibold tracking-widest uppercase text-xs mb-4 block">
                Freshly Baked Daily
              </span>
              <h1 className="text-5xl md:text-7xl font-['Playfair_Display'] font-bold text-[#201a1c] leading-tight">
                The Full <span className="italic text-[#b00068]">Signature</span> Collection
              </h1>
            </div>
            <div className="hidden lg:block lg:col-span-4 pb-4">
              <p className="text-[#584049] leading-relaxed opacity-80 text-lg italic">
                Handcrafted with artisanal precision, blending traditional heritage with contemporary fusion flavors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Categories */}
      <div className="sticky top-[72px] z-40 bg-[#fff8f8]/95 backdrop-blur-sm py-4 mb-8">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon
              const isActive = activeCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
                    px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-all
                    ${
                      isActive
                        ? 'bg-[#fcd400] text-[#221b00] shadow-sm'
                        : 'bg-[#f2e5e7] text-[#584049] hover:bg-[#ecdfe1]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              image={product.image}
              category={product.category}
              badge={product.badge}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#584049] text-lg">No products found in this category.</p>
          </div>
        )}
      </section>
    </div>
  )
}
