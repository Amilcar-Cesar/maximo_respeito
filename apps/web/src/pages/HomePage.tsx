import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog';
import { getPrimaryImageUrl } from '../utils/product-images';

interface Slide {
  title: string;
  subtitle: string;
  btnText: string;
  image: string;
  link: string;
}

const SLIDES: Slide[] = [
  {
    title: "BXD",
    subtitle: "CONHEÇA A COLEÇÃO RAIZ",
    btnText: "COMPRAR COLEÇÃO",
    image: "/banner_1.png",
    link: "#categorias"
  },
  {
    title: "MÁXIMO RESPEITO",
    subtitle: "EDITION // URBAN STREETWEAR",
    btnText: "VER PRODUTOS",
    image: "/banner_2.png",
    link: "#categorias"
  }
];

export function HomePage() {
  const categoriesQuery = useCategories();
  const productsQuery = useProducts();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  // Auto-scroll slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000); // changes every 6 seconds
    return () => clearInterval(timer);
  }, []);

  const handleScrollToHash = () => {
    if (window.location.hash === '#categorias') {
      const element = document.getElementById('categorias');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    handleScrollToHash();
    window.addEventListener('hashchange', handleScrollToHash);
    return () => {
      window.removeEventListener('hashchange', handleScrollToHash);
    };
  }, []);

  // Filter products by selected category
  const filteredProducts = productsQuery.data?.filter((product) => {
    if (!selectedCategorySlug) return true;
    return product.category?.slug === selectedCategorySlug;
  }) ?? [];

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <main className="page-shell">
      {/* Hero Banner Carousel */}
      <section className="banner-carousel">
        <div className="carousel-track">
          {SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="slide-overlay" />
              <div className="slide-content">
                <p className="slide-subtitle">{slide.subtitle}</p>
                <h1 className="slide-title">{slide.title}</h1>
                <a
                  className="primary-button slide-cta"
                  href={slide.link}
                  onClick={(e) => {
                    if (slide.link.startsWith('#')) {
                      e.preventDefault();
                      const element = document.getElementById(slide.link.substring(1));
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        window.location.hash = slide.link;
                      }
                    }
                  }}
                >
                  {slide.btnText}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation */}
        <button className="carousel-arrow prev" onClick={handlePrevSlide} aria-label="Anterior">
          ‹
        </button>
        <button className="carousel-arrow next" onClick={handleNextSlide} aria-label="Próximo">
          ›
        </button>

        {/* Carousel Dots */}
        <div className="carousel-dots">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ir para o slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Catalog & Categories Section */}
      <section id="categorias" className="catalog-section">
        <div className="catalog-header">
          <h2>Catálogo de Produtos</h2>
          <p className="catalog-subtitle">
            {productsQuery.isLoading
              ? 'Carregando produtos...'
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
          </p>
        </div>

        {/* Categories Pills */}
        <div className="categories-bar">
          <button
            className={`category-pill ${selectedCategorySlug === null ? 'active' : ''}`}
            onClick={() => setSelectedCategorySlug(null)}
          >
            Todos os Produtos
          </button>
          {categoriesQuery.data?.map((category) => (
            <button
              key={category.id}
              className={`category-pill ${selectedCategorySlug === category.slug ? 'active' : ''}`}
              onClick={() => setSelectedCategorySlug(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="catalog-grid">
          {productsQuery.isLoading ? (
            <div className="catalog-loading">Carregando catálogo de produtos...</div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const imageUrl = getPrimaryImageUrl(product.images);

              return (
                <Link className="catalog-card" key={product.id} to={`/produto/${product.id}`}>
                  <div className="catalog-card-media">
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="image-placeholder">Sem imagem</div>
                    )}
                  </div>
                  <div className="catalog-card-info">
                    <p className="eyebrow">{product.category?.name ?? 'Sem categoria'}</p>
                    <h2>{product.name}</h2>
                    <div className="catalog-card-footer">
                      <strong>R$ {Number(product.basePrice).toFixed(2)}</strong>
                      <span className="view-details">Ver Detalhes →</span>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="catalog-empty">Nenhum produto encontrado nesta categoria.</div>
          )}
        </div>
      </section>
    </main>
  );
}

