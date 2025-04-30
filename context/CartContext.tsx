"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// --- Types ---
export type CartItem = {
  productId: string; // Use the generated product ID
  storeId: string;   // Keep track of which store it belongs to
  title: string;
  price: number;
  imageUrl?: string; // Optional image for cart display
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void; // Accept full CartItem including quantity
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
};

// --- Context ---
const CartContext = createContext<CartContextType | undefined>(undefined);

// --- Provider ---
type CartProviderProps = {
  children: ReactNode;
};

const CART_STORAGE_KEY = 'myAppCart';

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // Prevent hydration mismatch

  // Load cart from localStorage on initial mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
        // Optionally clear corrupted storage
        // localStorage.removeItem(CART_STORAGE_KEY);
    }
    setIsLoaded(true); // Mark as loaded after attempting to read localStorage
  }, []);

  // Save cart to localStorage whenever it changes (and after initial load)
  useEffect(() => {
    if (isLoaded) { // Only save after initial load
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
             console.error("Failed to save cart to localStorage:", error);
        }
    }
  }, [cartItems, isLoaded]);

  const addToCart = useCallback((itemToAdd: CartItem) => { // Accept full CartItem
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === itemToAdd.productId && item.storeId === itemToAdd.storeId);

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + itemToAdd.quantity // Add the new quantity to existing
        };
        return updatedItems;
      } else {
        // Add new item with the specified quantity
        return [...prevItems, itemToAdd];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) => prevItems.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, quantity) } // Ensure quantity doesn't go below 0
          : item
      ).filter(item => item.quantity > 0) // Remove item if quantity is 0
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Prevent rendering children until localStorage is loaded
  if (!isLoaded) {
    return null; // Or a loading indicator
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

// --- Hook ---
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
