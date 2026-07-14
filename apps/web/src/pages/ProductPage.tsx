import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useCatalog';
import { useCart, useAddCartItem } from '../hooks/useCart';
import { getDisplayImages } from '../utils/product-images';

export function ProductPage() {
  const { id = '' } = useParams();
  const productQuery = useProduct(id);
  const addCartItemMutation = useAddCartItem();
  const cartQuery = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
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

  useEffect(() => {
    if (selectedVariant) {
      setSelectedColor((prevColor) => prevColor === selectedVariant.color ? prevColor : selectedVariant.color);
      setSelectedSize((prevSize) => prevSize === selectedVariant.size ? prevSize : selectedVariant.size);
    }
  }, [selectedVariant]);

  // Extract unique colors available across all variants
  const colors = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map((v) => v.color)));
  }, [product]);

  // Get unique sizes available for the currently selected color
  const sizesForSelectedColor = useMemo(() => {
    if (!product || !selectedColor) return [];
    return Array.from(
      new Set(
        product.variants
          .filter((v) => v.color === selectedColor)
          .map((v) => v.size)
      )
    );
  }, [product, selectedColor]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    
    // Find sizes available for this color
    const availableSizes = product?.variants
      .filter((v) => v.color === color)
      .map((v) => v.size) ?? [];
    
    // If the current size is available for the new color, keep it;
    // otherwise, select the first available size.
    let newSize = selectedSize;
    if (!availableSizes.includes(selectedSize)) {
      newSize = availableSizes[0] || '';
      setSelectedSize(newSize);
    }
    
    // Find and select corresponding variant
    const newVariant = product?.variants.find(
      (v) => v.color === color && v.size === newSize
    );
    if (newVariant) {
      setSelectedVariantId(newVariant.id);
    }
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const newVariant = product?.variants.find(
      (v) => v.color === selectedColor && v.size === size
    );
    if (newVariant) {
      setSelectedVariantId(newVariant.id);
    }
  };

  const displayImages = useMemo(
    () => (product ? getDisplayImages(product.images, selectedVariant?.id) : []),
    [product, selectedVariant?.id]
  );

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariant?.id, displayImages.length]);

  const cart = cartQuery.data;
  const existingCartItem = cart?.items.find((item) => item.variantId === selectedVariant?.id);
  const existingQuantity = existingCartItem?.quantity ?? 0;

  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;
  const isStockLimitReached = selectedVariant ? existingQuantity >= selectedVariant.stock : false;

  const isButtonDisabled = !selectedVariant || isOutOfStock || isStockLimitReached || addCartItemMutation.isPending;

  const buttonText = useMemo(() => {
    if (addCartItemMutation.isPending) return 'Adicionando...';
    if (!selectedVariant) return 'Selecione uma opção';
    if (isOutOfStock) return 'Sem estoque';
    if (isStockLimitReached) return 'Limite de estoque atingido';
    return 'Adicionar ao carrinho';
  }, [addCartItemMutation.isPending, selectedVariant, isOutOfStock, isStockLimitReached]);

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
              Selecionada: <strong>{selectedVariant.color} {selectedVariant.size}</strong>
            </p>
          ) : null}

          {product.variants.length > 0 && (
            <div className="variant-select-container">
              <div className="variant-select-group">
                <label htmlFor="variant-color">Cor</label>
                <select
                  id="variant-color"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                >
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="variant-select-group">
                <label htmlFor="variant-size">Tamanho</label>
                <select
                  id="variant-size"
                  value={selectedSize}
                  onChange={(e) => handleSizeChange(e.target.value)}
                >
                  {sizesForSelectedColor.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="button"
            className="primary-button add-to-cart-btn"
            disabled={isButtonDisabled}
            onClick={() => {
              if (selectedVariant) {
                addCartItemMutation.mutate({ variantId: selectedVariant.id, quantity: 1 });
              }
            }}
          >
            {buttonText}
          </button>

          {showSuccessToast && (
            <div className="toast-banner">
              <div>
                <strong>Adicionado!</strong> Item adicionado à sacola.
              </div>
              <div className="toast-actions">
                <Link className="toast-btn-primary" to="/carrinho">Ver Sacola</Link>
                <Link
                  to="/catalogo"
                  className="toast-btn-secondary"
                  onClick={() => {
                    setShowSuccessToast(false);
                    addCartItemMutation.reset();
                  }}
                >
                  Continue comprando
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

