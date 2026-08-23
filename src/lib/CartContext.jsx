import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const CartContext = createContext(null);

const toCartItem = (record) => ({
  id: record.id,
  cartId: record.cart_id,
  book: record.book,
  forfait: record.forfait,
  transit: record.transit,
  adresse: record.adresse,
  selectedCity: record.selectedCity,
  selectedRelay: record.selectedRelay,
  prixVal: record.prixVal || 0,
  comparative: record.comparative,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u?.email) return;
      const savedItems = await base44.entities.CartItem.filter({ user_email: u.email }, '-created_date', 100);
      setItems((savedItems || []).map(toCartItem));
    }).catch(() => {});
  }, []);

  const addItem = async (item) => {
    const cartId = String(Date.now() + Math.random());
    const nextItem = { ...item, cartId };
    setItems(prev => [...prev, nextItem]);
    if (user?.email) {
      try {
        const saved = await base44.entities.CartItem.create({
          user_email: user.email,
          cart_id: cartId,
          book: item.book,
          forfait: item.forfait,
          transit: item.transit,
          adresse: item.adresse,
          selectedCity: item.selectedCity,
          selectedRelay: item.selectedRelay,
          prixVal: item.prixVal,
          comparative: item.comparative,
        });
        setItems(prev => prev.map(i => i.cartId === cartId ? toCartItem(saved) : i));
      } catch (error) {
        setItems(prev => prev.filter(i => i.cartId !== cartId));
        throw error;
      }
    }
  };

  const removeItem = async (cartId) => {
    const target = items.find(i => i.cartId === cartId);
    setItems(prev => prev.filter(i => i.cartId !== cartId));
    if (target?.id) {
      try {
        await base44.entities.CartItem.delete(target.id);
      } catch (error) {
        setItems(prev => prev.some(i => i.cartId === cartId) ? prev : [...prev, target]);
        throw error;
      }
    }
  };

  const clearCart = async () => {
    const previousItems = items;
    const ids = items.map(i => i.id).filter(Boolean);
    setItems([]);
    try {
      await Promise.all(ids.map(id => base44.entities.CartItem.delete(id)));
    } catch (error) {
      setItems(previousItems);
      throw error;
    }
  };

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