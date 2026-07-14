import { useState, useEffect } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleCloseMenu = () => setIsMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" onClick={handleCloseMenu}>
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

        {/* Hamburger Menu Button */}
        <button
          className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </header>

      {/* Drawer Overlay & Content */}
      <div className={`drawer-overlay ${isMenuOpen ? 'open' : ''}`} onClick={handleCloseMenu}>
        <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <span className="drawer-title">Menu</span>
            <button className="drawer-close-btn" onClick={handleCloseMenu} aria-label="Fechar menu">
              &times;
            </button>
          </div>
          <nav className="drawer-nav">
            <a
              href="/#categorias"
              onClick={(e) => {
                handleCloseMenu();
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
            <Link to="/carrinho" onClick={handleCloseMenu}>
              Carrinho
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
            <Link to="/checkout" onClick={handleCloseMenu}>Checkout</Link>
            <Link to="/admin" onClick={handleCloseMenu}>Login</Link>
          </nav>
        </div>
      </div>
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

