import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useCatalog';
import { useAddCartItem } from '../hooks/useCart';
import { getDisplayImages } from '../utils/product-images';

export function ProductPage() {
  const { id = '' } = useParams();
  const productQuery = useProduct(id);
  const addCartItemMutation = useAddCartItem();
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const product = productQuery.data;
  const selectedVariant =
    product?.variants.find((variant) => variant.id === selectedVariantId) ?? product?.variants[0] ?? null;
  const displayImages = useMemo(
    () => (product ? getDisplayImages(product.images, selectedVariant?.id) : []),
    [product, selectedVariant?.id]
  );
  const activeImage = displayImages[selectedImageIndex] ?? displayImages[0] ?? null;

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
      <section className="surface-card product-detail">
        <div className="product-gallery">
          <div className="product-hero-image">
            {activeImage ? (
              <img src={activeImage.imageUrl} alt={product.name} />
            ) : (
              <div className="image-placeholder">Sem imagem</div>
            )}
          </div>
          {displayImages.length > 1 ? (
            <div className="product-thumbnails">
              {displayImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={index === selectedImageIndex ? 'product-thumb active' : 'product-thumb'}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                >
                  <img src={image.imageUrl} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-info">
          <p className="eyebrow">{product.category?.name ?? 'Sem categoria'}</p>
          <h1>{product.name}</h1>
          <p className="product-price">R$ {Number(product.basePrice).toFixed(2)}</p>
          <p>{product.description ?? 'Sem descrição cadastrada.'}</p>
          {selectedVariant ? (
            <p className="product-selection">
              Selecionado: {selectedVariant.size} · {selectedVariant.color}
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
            className="primary-button"
            disabled={!selectedVariant || addCartItemMutation.isPending}
            onClick={() => {
              if (selectedVariant) {
                addCartItemMutation.mutate({ variantId: selectedVariant.id, quantity: 1 });
              }
            }}
          >
            {addCartItemMutation.isPending ? 'Adicionando...' : 'Adicionar ao carrinho'}
          </button>
        </div>
      </section>
    </main>
  );
}
