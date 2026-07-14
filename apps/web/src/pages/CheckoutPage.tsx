import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useCheckoutCart } from '../hooks/useCart';
import { FlowStepper } from '../components/FlowStepper';

export function CheckoutPage() {
  const cartQuery = useCart();
  const checkoutMutation = useCheckoutCart();
  const [successMessage, setSuccessMessage] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    const truncated = cleaned.slice(0, 8);
    
    let masked = truncated;
    if (truncated.length > 5) {
      masked = `${truncated.slice(0, 5)}-${truncated.slice(5)}`;
    }
    
    setCep(masked);

    if (truncated.length === 8) {
      try {
        setLoadingCep(true);
        setCepError('');
        const response = await fetch(`https://viacep.com.br/ws/${truncated}/json/`);
        if (!response.ok) throw new Error('Erro ao buscar o CEP');
        const data = await response.json();
        if (data.erro === true || data.erro === 'true') {
          setCepError('CEP não encontrado.');
          return;
        }
        setAddress(data.logradouro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
      } catch (err) {
        console.error(err);
        setCepError('Erro ao buscar o CEP.');
      } finally {
        setLoadingCep(false);
      }
    }
  };

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
    setCep('');
    setAddress('');
    setCity('');
    setState('');
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
              <label>
                CEP
                <div style={{ position: 'relative' }}>
                  <input
                    name="shippingPostalCode"
                    required
                    value={cep}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                  />
                  {loadingCep && (
                    <span style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.8rem',
                      color: 'var(--accent)'
                    }}>
                      Buscando...
                    </span>
                  )}
                </div>
                {cepError && (
                  <span style={{ fontSize: '0.8rem', color: '#ff4d4d', marginTop: '2px' }}>
                    {cepError}
                  </span>
                )}
              </label>
              <label className="full-span">
                Logradouro e número
                <input
                  name="shippingAddressLine"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
              <label>
                Cidade
                <input
                  name="shippingCity"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label>
                Estado
                <input
                  name="shippingState"
                  required
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
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
