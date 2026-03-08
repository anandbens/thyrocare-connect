import React, { createContext, useContext, useState, useCallback } from "react";
import { LabTest } from "@/data/tests";

export interface CartItem {
  test: LabTest;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (test: LabTest) => void;
  removeItem: (testId: string) => void;
  clearCart: () => void;
  isInCart: (testId: string) => boolean;
  totalAmount: number;
  totalSavings: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((test: LabTest) => {
    setItems((prev) => {
      if (prev.find((item) => item.test.id === test.id)) return prev;
      return [...prev, { test, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((testId: string) => {
    setItems((prev) => prev.filter((item) => item.test.id !== testId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (testId: string) => items.some((item) => item.test.id === testId),
    [items]
  );

  const totalAmount = items.reduce((sum, item) => sum + item.test.price, 0);
  const totalSavings = items.reduce(
    (sum, item) => sum + (item.test.originalPrice - item.test.price),
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, isInCart, totalAmount, totalSavings, itemCount: items.length }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
