import { Link } from 'react-router-dom';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart';

export function CartPage() {
  const cartQuery = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  if (cartQuery.isLoading) {
    return <main className="page-shell">Carregando carrinho...</main>;
  }

  const cart = cartQuery.data;

  return (
    <main className="page-shell">
      <section className="surface-card cart-layout">
        <div className="section-heading">
          <h1>Carrinho</h1>
          <span>{cart?.items.length ?? 0} itens</span>
        </div>

        {!cart?.items.length ? (
          <div className="empty-state">
            <h2>Seu carrinho está vazio.</h2>
            <p>Escolha um produto no catálogo para começar o checkout.</p>
            <Link className="primary-button" to="/catalogo">Ir para o catálogo</Link>
          </div>
        ) : (
          <div className="cart-list">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-media">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : <div className="image-placeholder" />}
                </div>
                <div className="cart-item-copy">
                  <h2>{item.productName}</h2>
                  <p>{item.size} · {item.color}</p>
                  <strong>R$ {Number(item.unitPrice).toFixed(2)}</strong>
                </div>
                <div className="cart-item-actions">
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                  >
                    +
                  </button>
                  <button type="button" className="ghost-button" onClick={() => removeMutation.mutate(item.id)}>
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <aside className="cart-summary">
          <h2>Resumo</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>R$ {Number(cart?.subtotal ?? 0).toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>Total</span>
            <strong>R$ {Number(cart?.total ?? 0).toFixed(2)}</strong>
          </div>
          <Link className="primary-button" to="/checkout">Ir para checkout</Link>
        </aside>
      </section>
    </main>
  );
}
