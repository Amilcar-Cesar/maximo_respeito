import { useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCartItem, checkoutCart, fetchCart, removeCartItem, updateCartItem } from '../services/cart.service';
import { CartDTO } from '../types/cart';

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) => addCartItem(variantId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}

export function useUpdateCartItemDebounced() {
  const queryClient = useQueryClient();
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const originalCartRef = useRef<Record<string, CartDTO>>({});
  const activeMutationsRef = useRef<Record<string, number>>({});

  const mutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    onError: (err, { itemId }) => {
      const hasPending = (activeMutationsRef.current[itemId] ?? 0) > 1 || timeoutsRef.current[itemId];
      if (!hasPending) {
        const original = originalCartRef.current[itemId];
        if (original) {
          queryClient.setQueryData(['cart'], original);
        }
      }
    },
    onSettled: (data, error, { itemId }) => {
      if (activeMutationsRef.current[itemId] !== undefined) {
        activeMutationsRef.current[itemId] = Math.max(0, activeMutationsRef.current[itemId] - 1);
      }

      const hasPending = (activeMutationsRef.current[itemId] ?? 0) > 0 || timeoutsRef.current[itemId];
      if (!hasPending) {
        delete originalCartRef.current[itemId];
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    }
  });

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    const currentCart = queryClient.getQueryData<CartDTO>(['cart']);
    const currentItem = currentCart?.items.find((item) => item.id === itemId);
    if (!currentItem) return;

    const maxStock = currentItem.stock ?? Infinity;
    const targetQuantity = Math.max(0, Math.min(quantity, maxStock));

    if (!timeoutsRef.current[itemId]) {
      if (currentCart) {
        originalCartRef.current[itemId] = currentCart;
      }
    }

    queryClient.setQueryData<CartDTO>(['cart'], (old) => {
      if (!old) return old;
      
      const updatedItems = old.items.map(item => {
        if (item.id === itemId) {
          const itemSubtotal = (Number(item.unitPrice) * targetQuantity).toFixed(2);
          return { ...item, quantity: targetQuantity, subtotal: itemSubtotal };
        }
        return item;
      });

      const subtotalNum = updatedItems.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
      const subtotal = subtotalNum.toFixed(2);
      const total = subtotal;

      return {
        ...old,
        items: updatedItems,
        subtotal,
        total
      };
    });

    if (timeoutsRef.current[itemId]) {
      clearTimeout(timeoutsRef.current[itemId]);
    }

    timeoutsRef.current[itemId] = setTimeout(() => {
      activeMutationsRef.current[itemId] = (activeMutationsRef.current[itemId] ?? 0) + 1;
      mutation.mutate({ itemId, quantity: targetQuantity });
      delete timeoutsRef.current[itemId];
    }, 400);
  }, [queryClient, mutation]);

  const cancelUpdate = useCallback((itemId: string) => {
    if (timeoutsRef.current[itemId]) {
      clearTimeout(timeoutsRef.current[itemId]);
      delete timeoutsRef.current[itemId];
    }
    delete originalCartRef.current[itemId];
    delete activeMutationsRef.current[itemId];
  }, []);

  return {
    updateQuantity,
    cancelUpdate,
    isPending: mutation.isPending
  };
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartDTO>(['cart']);

      if (previousCart) {
        const updatedItems = previousCart.items.filter(item => item.id !== itemId);
        const subtotalNum = updatedItems.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
        const subtotal = subtotalNum.toFixed(2);
        
        queryClient.setQueryData<CartDTO>(['cart'], {
          ...previousCart,
          items: updatedItems,
          subtotal,
          total: subtotal
        });
      }

      return { previousCart };
    },
    onError: (err, itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}

export function useCheckoutCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkoutCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}
