import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ book, forfait, transit, adresse, prix }]

  const addItem = (item) => {
    setItems(prev => [...prev, { ...item, cartId: Date.now() + Math.random() }]);
  };

  const removeItem = (cartId) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + (i.prixVal || 0), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}