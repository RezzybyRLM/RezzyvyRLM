'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface CartItem {
  id: string
  user_id: string
  package_name: string
  package_type: string
  price: number
  quantity: number
  metadata: any
  created_at: string
  updated_at: string
}

export interface AddToCartData {
  package_name: string
  package_type: string
  price: number
  quantity?: number
  metadata?: any
}

export async function getCartItems(): Promise<CartItem[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await (supabase as any)
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch cart items: ${error.message}`)
  }

  return data || []
}

export async function addToCart(item: AddToCartData): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if item already exists in cart
  const { data: existingItem } = await (supabase as any)
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('package_name', item.package_name)
    .eq('package_type', item.package_type)
    .single()

  if (existingItem) {
    // Update quantity if item exists
    const updateData = { 
      quantity: (existingItem as any).quantity + (item.quantity || 1),
      updated_at: new Date().toISOString()
    }
    const { error } = await (supabase as any)
      .from('cart_items')
      .update(updateData)
      .eq('id', (existingItem as any).id)

    if (error) {
      throw new Error(`Failed to update cart item: ${error.message}`)
    }
  } else {
    // Insert new item
    const { error } = await (supabase as any)
      .from('cart_items')
      .insert({
        user_id: user.id,
        package_name: item.package_name,
        package_type: item.package_type,
        price: item.price,
        quantity: item.quantity || 1,
        metadata: item.metadata || {}
      })

    if (error) {
      throw new Error(`Failed to add item to cart: ${error.message}`)
    }
  }

  revalidatePath('/cart')
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  if (quantity <= 0) {
    await removeFromCart(itemId)
    return
  }

  const updateData = { 
    quantity,
    updated_at: new Date().toISOString()
  }
  const { error } = await (supabase as any)
    .from('cart_items')
    .update(updateData)
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to update cart item: ${error.message}`)
  }

  revalidatePath('/cart')
}

export async function removeFromCart(itemId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase as any)
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to remove item from cart: ${error.message}`)
  }

  revalidatePath('/cart')
}

export async function clearCart(): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase as any)
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to clear cart: ${error.message}`)
  }

  revalidatePath('/cart')
}

export async function getCartItemCount(): Promise<number> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return 0
  }

  const { count, error } = await (supabase as any)
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to get cart count:', error)
    return 0
  }

  return count || 0
}

export async function getCartTotal(): Promise<number> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return 0
  }

  const { data, error } = await (supabase as any)
    .from('cart_items')
    .select('price, quantity')
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to get cart total:', error)
    return 0
  }

  return data?.reduce((total: number, item: any) => total + (item.price * item.quantity), 0) || 0
}
