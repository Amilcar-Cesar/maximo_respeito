import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useCatalog';
import { useAddCartItem } from '../hooks/useCart';
import { getDisplayImages } from '../utils/product-images';

export function ProductPage() {
  const { id = '' } = useParams();
  const productQuery = useProduct(id);
  const addCartItemMutation = useAddCartItem();
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (addCartItemMutation.isSuccess) {
      setShowSuccessToast(true);
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
        addCartItemMutation.reset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [addCartItemMutation.isSuccess, addCartItemMutation]);

  const product = productQuery.data;
  const selectedVariant =
    product?.variants.find((variant) => variant.id === selectedVariantId) ?? product?.variants[0] ?? null;
  const displayImages = useMemo(
    () => (product ? getDisplayImages(product.images, selectedVariant?.id) : []),
    [product, selectedVariant?.id]
  );

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariant?.id, displayImages.length]);

  if (productQuery.isLoading) {
    return <main className="page-shell">Carregando produto...</main>;
  }

  if (!product) {
    return <main className="page-shell">Produto não encontrado.</main>;
  }

  return (
    <main className="page-shell">
      <section className="product-detail">
        <div className="product-gallery-wrapper">
          {/* Vertical thumbnails strip */}
          {displayImages.length > 1 && (
            <div className="product-gallery-thumbs">
              {displayImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={index === selectedImageIndex ? 'product-gallery-thumb active' : 'product-gallery-thumb'}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    const el = document.getElementById(`product-image-${index}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                  aria-label={`Ver imagem ${index + 1}`}
                >
                  <img src={image.imageUrl} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Main images area - displaying all images in a grid */}
          <div className={`product-gallery-main images-count-${displayImages.length}`}>
            {displayImages.map((image, index) => (
              <div
                key={image.id}
                id={`product-image-${index}`}
                className={`product-main-image-wrap ${index === selectedImageIndex ? 'active' : ''}`}
              >
                <img src={image.imageUrl} alt={`${product.name} ${index + 1}`} />
              </div>
            ))}
            {displayImages.length === 0 && (
              <div className="image-placeholder">Sem imagem</div>
            )}
          </div>
        </div>

        {/* Sticky Product Info Sidebar */}
        <div className="product-info-sidebar">
          <p className="eyebrow">{product.category?.name ?? 'Sem categoria'}</p>
          <h1>{product.name}</h1>
          <div className="product-pricing">
            <span className="product-price">R$ {Number(product.basePrice).toFixed(2)}</span>
            <span className="pix-price">ou R$ {(Number(product.basePrice) * 0.95).toFixed(2)} no PIX</span>
          </div>

          <div className="divider-line" />

          <p className="product-description">{product.description ?? 'Sem descrição cadastrada.'}</p>

          {selectedVariant ? (
            <p className="product-selection">
              Selecionado: <strong>{selectedVariant.size} · {selectedVariant.color}</strong>
            </p>
          ) : null}

          <div className="variant-list">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={variant.id === selectedVariant?.id ? 'variant-pill active' : 'variant-pill'}
                onClick={() => setSelectedVariantId(variant.id)}
              >
                {variant.size} · {variant.color}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="primary-button add-to-cart-btn"
            disabled={!selectedVariant || addCartItemMutation.isPending}
            onClick={() => {
              if (selectedVariant) {
                addCartItemMutation.mutate({ variantId: selectedVariant.id, quantity: 1 });
              }
            }}
          >
            {addCartItemMutation.isPending ? 'Adicionando...' : 'Adicionar ao carrinho'}
          </button>

          {showSuccessToast && (
            <div className="toast-banner">
              <div>
                <strong>Adicionado!</strong> Item adicionado à sacola.
              </div>
              <div className="toast-actions">
                <Link className="toast-btn-primary" to="/carrinho">Ver Sacola</Link>
                <button
                  type="button"
                  className="toast-btn-secondary"
                  onClick={() => {
                    setShowSuccessToast(false);
                    addCartItemMutation.reset();
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

