import { Outlet } from 'react-router-dom'
import { NavBar, Footer } from './customer'

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#201a1c] font-['Inter']">
      <NavBar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
