'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCartItems, updateCartItemQuantity, removeFromCart, getCartTotal, CartItem } from '@/lib/cart/actions'
import { Skeleton } from '@/components/ui/skeleton-loader'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/auth/login?redirectTo=/cart')
        return
      }

      try {
        const items = await getCartItems()
        setCartItems(items)
      } catch (error) {
        console.error('Failed to load cart items:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase.auth, router])

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdating(id)
    try {
      await updateCartItemQuantity(id, newQuantity)
      setCartItems(items => 
        items.map(item => 
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (id: string) => {
    setUpdating(id)
    try {
      await removeFromCart(id)
      setCartItems(items => items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setUpdating(null)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + tax

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-primary" />
              Shopping Cart
            </h1>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-primary" />
              Shopping Cart
            </h1>
          </div>
          <p className="text-gray-600">
            Review your selected packages and proceed to checkout
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven't added any packages to your cart yet.
              </p>
              <Button asChild>
                <Link href="/">
                  Browse Packages
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center text-2xl">
                        {item.package_type === 'essential' ? '💼' : 
                         item.package_type === 'accelerated' ? '🚀' : 
                         item.package_type === 'definitive' ? '📈' : '📦'}
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.package_name}</h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {item.package_type === 'essential' ? 'One-on-One Consultation, Resume, Bio, Cover Letter, Unlimited Revisions, VCard QR Code' :
                               item.package_type === 'accelerated' ? 'Enhanced package with Reference List, Thank You Letter, Additional Resume' :
                               item.package_type === 'definitive' ? 'Complete career solution with LinkedIn optimization and interview coaching' :
                               'Professional package'}
                            </p>
                            <div className="text-2xl font-bold text-primary">
                              ${item.price}
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {updating === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3 mt-4">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updating === item.id}
                              className="h-8 w-8"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id}
                              className="h-8 w-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-lg font-bold text-gray-900 ml-auto">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Package Items */}
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div>
                        <div className="font-medium">{item.package_name}</div>
                        <div className="text-gray-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (8%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                    <Link href="/checkout">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Proceed to Checkout
                    </Link>
                  </Button>

                  {/* Security Badge */}
                  <div className="text-center pt-4">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      🔒 Secure Checkout
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recommended Packages */}
        {cartItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-lg font-bold mb-2">Definitive Package</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Complete career solution with LinkedIn optimization and interview coaching
                  </p>
                  <div className="text-2xl font-bold text-primary mb-4">$500/month</div>
                  <Button variant="outline" className="w-full">
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-bold mb-2">Career Coaching</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    One-on-one career guidance and interview preparation
                  </p>
                  <div className="text-2xl font-bold text-primary mb-4">$150/session</div>
                  <Button variant="outline" className="w-full">
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-bold mb-2">LinkedIn Optimization</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Professional LinkedIn profile optimization service
                  </p>
                  <div className="text-2xl font-bold text-primary mb-4">$99</div>
                  <Button variant="outline" className="w-full">
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
