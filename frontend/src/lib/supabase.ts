import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not found. Auth features will not work.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type Database = {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string
          name: string
          category: string | null
          unit: string
          current_stock: number
          min_stock: number
          cost_per_unit: number
          supplier: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ingredients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ingredients']['Insert']>
      }
      batches: {
        Row: {
          id: string
          ingredient_id: string
          quantity: number
          purchase_date: string
          expiry_date: string | null
          batch_number: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['batches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['batches']['Insert']>
      }
      recipes: {
        Row: {
          id: string
          name: string
          description: string | null
          yield_quantity: number
          yield_unit: string
          category: string | null
          preparation_time: number | null
          instructions: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          recipe_id: string | null
          price: number
          category: string | null
          current_stock: number
          min_stock: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string | null
          delivery_date: string
          delivery_time: string | null
          status: string
          total_amount: number
          advance_paid: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
    }
  }
}
