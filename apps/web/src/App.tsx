import { Link, Route, Routes } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminPage } from './pages/AdminPage';
import { HomePage } from './pages/HomePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProductPage } from './pages/ProductPage';
import { useCart } from './hooks/useCart';

function Shell({ children }: { children: React.ReactNode }) {
  const { data: cart } = useCart();
  const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" />
          <div>
            <strong>Máximo Respeito</strong>
            <span>Roupas, carrinho e checkout</span>
          </div>
        </Link>
        <nav className="nav-links">
          <a
            href="/#categorias"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                const element = document.getElementById('categorias');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  window.location.hash = '#categorias';
                }
              }
            }}
          >
            Categorias
          </a>
          <Link to="/carrinho">
            Carrinho
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/admin">Login</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<HomePage />} />
        <Route path="/produto/:id" element={<ProductPage />} />
        <Route path="/carrinho" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pedidos" element={<PlaceholderPage title="Pedidos" description="Área para o cliente acompanhar pedidos criados." />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Shell>
  );
}

