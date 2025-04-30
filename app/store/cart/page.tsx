"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ShoppingBag } from 'lucide-react'; // Icons
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, itemCount, totalPrice, clearCart } = useCart();
  const router = useRouter();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 0) { // Allow setting quantity to 0 to remove
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    // Navigate to the checkout page
    // We might pass cart state via context or query params if needed,
    // but for now, checkout page will also read from context/localStorage.
    router.push('/store/checkout');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      {itemCount === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
             <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
             <CardTitle>Your cart is empty</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-gray-600 dark:text-gray-400 mb-6">Looks like you haven't added anything yet.</p>
             <Button onClick={() => router.push('/')}> {/* Or link to last visited store? */}
                Continue Shopping
             </Button>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart Items Table */}
          <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Cart Items ({itemCount})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cartItems.map((item) => (
                        <TableRow key={item.productId}>
                            <TableCell>
                            <Image
                                src={item.imageUrl || '/placeholder.svg'}
                                alt={item.title}
                                width={64}
                                height={64}
                                className="rounded object-cover"
                            />
                            </TableCell>
                            <TableCell className="font-medium">
                                <Link href={`/store/${item.storeId}/product/${item.productId}`} className="hover:text-blue-600">
                                    {item.title}
                                </Link>
                            </TableCell>
                            <TableCell className="text-center">
                            <Input
                                type="number"
                                min="0" // Allow 0 to remove via updateQuantity logic
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value, 10))}
                                className="w-16 h-8 text-center mx-auto"
                            />
                            </TableCell>
                            <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => removeFromCart(item.productId)}
                                title="Remove Item"
                            >
                                <Trash2 size={16} />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="flex justify-end pt-4">
                     <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
                 </CardFooter>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                 <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
                 <hr className="my-2"/>
                 <div className="flex justify-between font-bold text-lg">
                  <span>Estimated Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
