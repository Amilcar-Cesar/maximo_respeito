import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useCheckoutCart } from '../hooks/useCart';
import { FlowStepper } from '../components/FlowStepper';

export function CheckoutPage() {
  const cartQuery = useCart();
  const checkoutMutation = useCheckoutCart();
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const order = await checkoutMutation.mutateAsync({
      fullName: String(formData.get('fullName') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      cpf: String(formData.get('cpf') ?? ''),
      shippingAddressLine: String(formData.get('shippingAddressLine') ?? ''),
      shippingCity: String(formData.get('shippingCity') ?? ''),
      shippingState: String(formData.get('shippingState') ?? ''),
      shippingPostalCode: String(formData.get('shippingPostalCode') ?? ''),
      paymentMethod: String(formData.get('paymentMethod') ?? 'pix') as 'pix' | 'credit_card'
    });

    setSuccessMessage(`Pedido ${order.id} criado com sucesso.`);
    event.currentTarget.reset();
  };

  if (successMessage) {
    const orderIdMatch = successMessage.match(/Pedido ([a-f0-9-]+) criado/);
    const orderId = orderIdMatch ? orderIdMatch[1] : '';

    return (
      <main className="page-shell">
        <FlowStepper currentStep="confirmation" />
        <section className="surface-card confirmation-card">
          <div className="success-icon">✓</div>
          <h1>Pedido Confirmado!</h1>
          <p className="success-subtitle">Obrigado pela sua compra. Seu pedido foi registrado com sucesso.</p>
          <div className="order-details-box">
            <p style={{ marginBottom: '12px' }}>
              <strong>Código do Pedido:</strong> <br />
              <code style={{ fontSize: '1.1rem', color: 'var(--accent-strong)' }}>{orderId || 'Novo Pedido'}</code>
            </p>
            <p>Enviamos os detalhes da confirmação e atualizações de entrega para o seu e-mail cadastrado.</p>
          </div>
          <div className="confirmation-actions">
            <Link className="primary-button" to="/">Voltar para a Home</Link>
            <Link className="secondary-button" to="/catalogo">Continuar Comprando</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <FlowStepper currentStep="checkout" />
      <section className="surface-card checkout-grid">
        <div>
          <div className="section-heading">
            <h1>Checkout</h1>
            <span>Pré-cadastro e endereço</span>
          </div>
          <p className="muted-copy">Finalize a compra com os dados do cliente e do endereço de entrega.</p>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Nome completo
                <input name="fullName" required minLength={3} />
              </label>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Telefone
                <input name="phone" required />
              </label>
              <label>
                CPF
                <input name="cpf" required />
              </label>
              <label className="full-span">
                Endereço
                <input name="shippingAddressLine" required />
              </label>
              <label>
                Cidade
                <input name="shippingCity" required />
              </label>
              <label>
                Estado
                <input name="shippingState" required maxLength={2} />
              </label>
              <label>
                CEP
                <input name="shippingPostalCode" required />
              </label>
              <label className="full-span">
                Pagamento
                <select name="paymentMethod" defaultValue="pix">
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão</option>
                </select>
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending ? 'Processando...' : 'Confirmar pedido'}
            </button>
          </form>

          {successMessage ? <p className="success-banner">{successMessage}</p> : null}
          {checkoutMutation.error ? <p className="error-banner">Não foi possível concluir o checkout.</p> : null}
        </div>

        <aside className="cart-summary">
          <h2>Itens</h2>
          {cartQuery.data?.items.map((item) => (
            <div className="summary-row compact" key={item.id}>
              <span>{item.productName}</span>
              <strong>x{item.quantity}</strong>
            </div>
          ))}
          <div className="summary-row">
            <span>Total</span>
            <strong>R$ {Number(cartQuery.data?.total ?? 0).toFixed(2)}</strong>
          </div>
          <Link className="secondary-button" to="/carrinho">Voltar ao carrinho</Link>
        </aside>
      </section>
    </main>
  );
}
