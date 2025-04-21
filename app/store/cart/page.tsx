"use client"

import { useState } from "react"
import { VisualizationModal } from "@/components/visualization-modal"
import { Eye } from "lucide-react"
import { CartDropdown } from "@/components/cart-dropdown"

export default function CartPage() {
  const [visualizationModalOpen, setVisualizationModalOpen] = useState(false)

  // Define cart items
  const cartItems = [
    {
      id: "nike-air-max",
      name: "Nike Air Max Nuaxis",
      imageUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nike%20Air%20Max%20Nuaxis.jpg-QZjb3wNhRXllOM8owGO0DRnWCJ1n0p.jpeg",
      price: 129.99,
      quantity: 1,
      size: "10",
      color: "White/Red",
      category: "footwear",
    },
    {
      id: "outworked-hoodie",
      name: "I Outworked You Hoodie",
      imageUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/I%20Outworked%20You%20Hoodie%202.jpg-irrr9cRt2Ksk3iRdJCajlGv6X2uSoz.jpeg",
      price: 65.0,
      quantity: 1,
      size: "L",
      color: "Black",
      category: "apparel",
    },
    {
      id: "airpods-case",
      name: "Rubber Case for AirPods®",
      imageUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Rubber%20Case%20for%20AirPods.jpg-QOQzs7XnmwRvScuapkv7gJvsqvUdV2.jpeg",
      price: 24.0,
      quantity: 1,
      color: "Black",
      category: "accessories",
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">StyleHub</h1>
            <nav className="hidden md:flex space-x-6">
              <a href="/store" className="hover:text-emerald-400 transition">
                Home
              </a>
              <a href="/store#apparel" className="hover:text-emerald-400 transition">
                Apparel
              </a>
              <a href="/store#footwear" className="hover:text-emerald-400 transition">
                Footwear
              </a>
              <a href="/store#accessories" className="hover:text-emerald-400 transition">
                Accessories
              </a>
              <a href="/store#home" className="hover:text-emerald-400 transition">
                Home
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <button aria-label="Search">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <CartDropdown cartItems={cartItems} />
              <button aria-label="Account">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Cart Items (3)</h2>

                  {/* Cart Item 1 */}
                  <div className="flex flex-col md:flex-row border-b border-gray-200 py-4">
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nike%20Air%20Max%20Nuaxis.jpg-QZjb3wNhRXllOM8owGO0DRnWCJ1n0p.jpeg"
                        alt="Nike Air Max Nuaxis"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                    <div className="md:w-2/4 md:px-4">
                      <h3 className="font-bold text-lg mb-1">Nike Air Max Nuaxis</h3>
                      <p className="text-gray-600 text-sm mb-2">Footwear</p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="mr-2">Size: 10</span>
                        <span className="mr-2">|</span>
                        <span>Color: White/Red</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-500 hover:text-emerald-600 text-sm">Remove</button>
                        <span className="text-gray-300">|</span>
                        <button className="text-gray-500 hover:text-emerald-600 text-sm">Save for Later</button>
                      </div>
                    </div>
                    <div className="md:w-1/4 flex flex-col items-end justify-between mt-4 md:mt-0">
                      <span className="font-bold text-lg">$129.99</span>
                      <div className="flex items-center border border-gray-300 rounded-md mt-2">
                        <button className="px-3 py-1 text-gray-600 hover:text-gray-900">-</button>
                        <span className="px-3 py-1 text-gray-900">1</span>
                        <button className="px-3 py-1 text-gray-600 hover:text-gray-900">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Cart Item 2 */}
                  <div className="flex flex-col md:flex-row border-b border-gray-200 py-4">
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/I%20Outworked%20You%20Hoodie%202.jpg-irrr9cRt2Ksk3iRdJCajlGv6X2uSoz.jpeg"
                        alt="I Outworked You Hoodie"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                    <div className="md:w-2/4 md:px-4">
                      <h3 className="font-bold text-lg mb-1">I Outworked You Hoodie</h3>
                      <p className="text-gray-600 text-sm mb-2">Apparel</p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="mr-2">Size: L</span>
                        <span className="mr-2">|</span>
                        <span>Color: Black</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-500 hover:text-emerald-600 text-sm">Remove</button>
                        <span className="text-gray-300">|</span>
                        <button className="text-gray-500 hover:text-emerald-600 text-sm">Save for Later</button>
                      </div>
                    </div>
                    <div className="md:w-1/4 flex flex-col items-end justify-between mt-4 md:mt-0">
                      <span className="font-bold text-lg">$65.00</span>
                      <div className="flex items-center border border-gray-300 rounded-md mt-2">
                        <button className="px-3 py-1 text-gray-600 hover:text-gray-900">-</button>
                        <span className="px-3 py-1 text-gray-900">1</span>
                        <button className="px-3 py-1 text-gray-600 hover:text-gray-900">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Cart Item 3 */}
                  <div className="flex flex-col md:flex-row py-4">
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Rubber%20Case%20for%20AirPods.jpg-QOQzs7XnmwRvScuapkv7gJvsqvUdV2.jpeg"
                        alt="Rubber Case for AirPods"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                    <div className="md:w-2/4 md:px-4">
                      <h3 className="font-bold text-lg mb-1">Rubber Case for AirPods®</h3>
                      <p className="text-gray-600 text-sm mb-2">Accessories</p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span>Color: Black</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-500 hover:text-emerald-600 text-sm">Remove</button>
                        <span className="text-gray-300">|</span>
                        <button className="text-gray-500 hover:text-emerald-600 text-sm">Save for Later</button>
                      </div>
                    </div>
                    <div className="md:w-1/4 flex flex-col items-end justify-between mt-4 md:mt-0">
                      <span className="font-bold text-lg">$24.00</span>
                      <div className="flex items-center border border-gray-300 rounded-md mt-2">
                        <button className="px-3 py-1 text-gray-600 hover:text-gray-900">-</button>
                        <span className="px-3 py-1 text-gray-900">1</span>
                        <button className="px-3 py-1 text-gray-600 hover:text-gray-900">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Saved for Later (2 items)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 flex">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/New%20Era%20-%20San%20Francisco%2049ers%20NFL%20Training%20Camp%209FORTY%20Snapback%20Hat%202.JPG-sz0blh3XcHHHOgpGWUAPSfyJVlHvPU.jpeg"
                      alt="SF 49ers Hat"
                      className="w-24 h-24 object-cover rounded-md mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm mb-1">New Era - SF 49ers NFL Hat</h3>
                      <p className="text-gray-600 text-xs mb-2">$34.99</p>
                      <button className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                        Move to Cart
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 flex">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Costa%20Farms%20Money%20Tree%20Plant.JPG-m9bYCYfCD9JUbP6dl7gJSFyu6TfwZZ.jpeg"
                      alt="Money Tree Plant"
                      className="w-24 h-24 object-cover rounded-md mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm mb-1">Costa Farms Money Tree Plant</h3>
                      <p className="text-gray-600 text-xs mb-2">$39.99</p>
                      <button className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                        Move to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal (3 items)</span>
                      <span className="font-medium">$218.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">$17.52</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>$236.51</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full bg-gray-800 dark:bg-gray-700 text-white py-3 rounded-md hover:bg-gray-900 dark:hover:bg-gray-600 transition mb-3 flex items-center justify-center"
                    onClick={() => setVisualizationModalOpen(true)}
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Visualize All Items
                  </button>

                  <button className="w-full bg-emerald-600 text-white py-3 rounded-md hover:bg-emerald-700 transition mb-4">
                    Proceed to Checkout
                  </button>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium mb-2">Promo Code</h3>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button className="bg-gray-900 text-white px-4 py-2 rounded-r-md hover:bg-gray-800 transition">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
                <div className="p-6">
                  <h2 className="text-lg font-bold mb-4">Accepted Payment Methods</h2>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-gray-100 rounded p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect width="24" height="24" rx="4" fill="#1434CB" />
                        <path d="M11.5 8.5L9 15.5H11L13.5 8.5H11.5Z" fill="white" />
                        <path
                          d="M17 8.5C16.4 8.5 15.5 9 15.5 10C15.5 11.5 17.5 11.5 17.5 13C17.5 14 16.5 14.5 15.5 14.5C14.5 14.5 13.5 14 13.5 14L13 15.5C13 15.5 14 16 15.5 16C17 16 19 15 19 13C19 11.5 17 11.5 17 10C17 9.5 17.5 9 18.5 9C19.5 9 20 9.5 20 9.5L20.5 8C20.5 8 19.5 7.5 18 7.5C16.5 7.5 15.5 8.5 15.5 8.5H17Z"
                          fill="white"
                        />
                        <path
                          d="M7 8.5C5.5 8.5 4 9 4 9L3.5 10.5C3.5 10.5 5 10 6 10C7 10 7.5 10.5 7.5 11C7.5 11.5 7 11.5 6 11.5H5V13H6C7 13 7.5 13.5 7.5 14C7.5 14.5 7 15 6 15C5 15 4 14.5 4 14.5L3.5 16C3.5 16 4.5 16.5 6 16.5C7.5 16.5 9 15.5 9 14C9 13 8.5 12.5 7.5 12C8.5 11.5 9 11 9 10C9 9 8 8.5 7 8.5Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect width="24" height="24" rx="4" fill="#FF5F00" />
                        <circle cx="9" cy="12" r="5" fill="#EB001B" />
                        <circle cx="15" cy="12" r="5" fill="#F79E1B" />
                        <path d="M12 7.5V16.5" stroke="white" strokeWidth="1" />
                      </svg>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect width="24" height="24" rx="4" fill="#003087" />
                        <path d="M7 10H5V14H7V10Z" fill="white" />
                        <path d="M11 10H9V14H11V10Z" fill="white" />
                        <path
                          d="M13 10C13 10 14 9 15.5 9C17 9 18 10 18 10V14C18 14 17 13 15.5 13C14 13 13 14 13 14V10Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect width="24" height="24" rx="4" fill="#006FCF" />
                        <path d="M12 8L13.5 12H10.5L12 8Z" fill="white" />
                        <path d="M12 16L10.5 12H13.5L12 16Z" fill="white" />
                        <path d="M7 10H5V14H7V10Z" fill="white" />
                        <path d="M19 10H17V14H19V10Z" fill="white" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">StyleHub</h3>
              <p className="text-gray-400">Your one-stop shop for fashion, accessories, and home decor.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Shop</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Apparel
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Footwear
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Accessories
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Home
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Customer Service</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Shipping
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Stay Connected</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
              </div>
              <p className="text-gray-400">Subscribe to our newsletter</p>
              <div className="flex mt-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 w-full rounded-l-md focus:outline-none"
                />
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-r-md hover:bg-emerald-700 transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; © 2025 Intel-Arts</p>
          </div>
        </div>
      </footer>

      {/* Visualization Modal */}
      <VisualizationModal
        isOpen={visualizationModalOpen}
        onClose={() => setVisualizationModalOpen(false)}
        productName={cartItems[0].name}
        productImageUrl={cartItems[0].imageUrl}
        productType="clothing"
        productId={cartItems[0].id}
        initialProducts={cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: "",
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl,
        }))}
      />
    </main>
  )
}
