import { Routes, Route, Navigate } from 'react-router-dom'
import { CustomerLayout } from '@/components'
import {
  LandingPage,
  MenuPage,
  AboutPage,
  ContactPage,
} from '@/pages/customer'

export function CustomerRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Redirect unknown routes to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
