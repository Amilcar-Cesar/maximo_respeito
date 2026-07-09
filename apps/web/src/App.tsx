import { Link, Route, Routes } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminPage } from './pages/AdminPage';
import { HomePage } from './pages/HomePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProductPage } from './pages/ProductPage';

function Shell({ children }: { children: React.ReactNode }) {
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
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/carrinho">Carrinho</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/admin">Admin</Link>
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
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/produto/:id" element={<ProductPage />} />
        <Route path="/carrinho" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pedidos" element={<PlaceholderPage title="Pedidos" description="Área para o cliente acompanhar pedidos criados." />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Shell>
  );
}
