"use client"

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';

// --- Validation Schema for Shipping ---
const shippingSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  address: z.string().min(1, "Street address is required."),
  city: z.string().min(1, "City is required."),
  postalCode: z.string().min(1, "Postal code is required."),
  country: z.string().min(1, "Country is required."),
  // Basic email validation
  email: z.string().email("Please enter a valid email address."),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

// --- Component ---
export default function CheckoutPage() {
  const { cartItems, itemCount, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { // Optional: Pre-fill if user data is available
        fullName: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        email: "",
    }
  });

  const handlePlaceOrder: SubmitHandler<ShippingFormValues> = async (data: ShippingFormValues) => { // Add type for data
    setIsProcessing(true);
    setProcessingError(null);
    console.log("Placing order with shipping details:", data);
    console.log("Cart items:", cartItems);

    // Simulate order processing (e.g., API call to backend)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // --- Placeholder for actual order submission ---
      // const response = await fetch('/api/orders', { method: 'POST', body: JSON.stringify({ shipping: data, items: cartItems }) });
      // if (!response.ok) throw new Error("Failed to place order.");

      // On successful order placement:
      clearCart(); // Clear the cart
      setOrderPlaced(true); // Show success message

    } catch (error: any) {
      console.error("Order placement failed:", error);
      setProcessingError(error.message || "An unexpected error occurred while placing your order.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Render Logic ---

  // Success Screen
  if (orderPlaced) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl text-center">
        <Card className="py-10">
            <CardHeader>
                 <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                 <CardTitle className="text-2xl font-bold">Order Placed Successfully!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
                <Button onClick={() => router.push('/')}>Continue Shopping</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  // Empty Cart Redirect (or message)
  if (itemCount === 0 && !isProcessing) {
     // Redirect back to cart page which shows "empty cart" message
     // Or show a message here directly
     useEffect(() => { router.push('/store/cart'); }, [router]);
     return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin"/></div>; // Loading indicator while redirecting
  }


  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Shipping Details Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handlePlaceOrder)} id="checkout-form" className="space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" {...register("fullName")} className={errors.fullName ? "border-red-500" : ""} />
                  {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>}
                </div>
                 {/* Email */}
                 <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" {...register("email")} className={errors.email ? "border-red-500" : ""} />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                </div>
                {/* Address */}
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" {...register("address")} className={errors.address ? "border-red-500" : ""} />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
                </div>
                {/* City */}
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} className={errors.city ? "border-red-500" : ""} />
                  {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>}
                </div>
                {/* Postal Code & Country (inline) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" {...register("postalCode")} className={errors.postalCode ? "border-red-500" : ""} />
                        {errors.postalCode && <p className="text-sm text-red-600 mt-1">{errors.postalCode.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" {...register("country")} className={errors.country ? "border-red-500" : ""} />
                        {errors.country && <p className="text-sm text-red-600 mt-1">{errors.country.message}</p>}
                    </div>
                </div>

                 {/* Placeholder for Payment Section */}
                 <div className="pt-4">
                    <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
                    <div className="p-4 border rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                        Payment gateway integration is not implemented in this demo. Clicking "Place Order" will simulate a successful order.
                    </div>
                 </div>

                 {/* Error Message */}
                 {processingError && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Order Error</AlertTitle>
                        <AlertDescription>{processingError}</AlertDescription>
                    </Alert>
                 )}

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cartItems.map(item => (
                <div key={item.productId} className="flex justify-between items-center text-sm">
                  <span className="truncate w-2/3">{item.title} (x{item.quantity})</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-3" />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Shipping</span>
                <span>Free</span> {/* Placeholder */}
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Taxes</span>
                <span>$0.00</span> {/* Placeholder */}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="checkout-form" className="w-full" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? 'Processing...' : 'Place Order'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
