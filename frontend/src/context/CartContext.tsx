import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for our cart items and context
export interface CartItem {
  id: string;
  name: string;
  partNumber: string;
  price: number;
  quantity: number;
  image?: string;
  compatibility?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: 0,
  tax: 0,
  total: 0,
});

// Tax rate (8% default)
const TAX_RATE = 0.08;

// Provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize cart state from localStorage or empty array
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('mechanicsCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Calculate cart totals
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mechanicsCart', JSON.stringify(items));
  }, [items]);

  // Add item to cart
  const addItem = (item: CartItem) => {
    setItems(prevItems => {
      // Check if the item already exists in the cart
      const existingItem = prevItems.find(i => i.id === item.id);
      
      if (existingItem) {
        // Increase quantity of existing item
        return prevItems.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + item.quantity } 
            : i
        );
      } else {
        // Add new item to cart
        return [...prevItems, item];
      }
    });
  };

  // Remove item from cart
  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Clear the entire cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addItem, 
        removeItem, 
        updateQuantity, 
        clearCart, 
        itemCount,
        subtotal,
        tax,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for using the cart context
export const useCart = () => useContext(CartContext);

export default CartContext; 