import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useCatalog';
import { getPrimaryImageUrl } from '../utils/product-images';

export function CatalogPage() {
  const productsQuery = useProducts();

  return (
    <main className="page-shell">
      <section className="surface-card">
        <div className="section-heading">
          <h1>Catálogo</h1>
          <span>{productsQuery.data?.length ?? 0} produtos</span>
        </div>
        <div className="catalog-grid">
          {productsQuery.data?.map((product) => {
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
                <p className="eyebrow">{product.category?.name ?? 'Sem categoria'}</p>
                <h2>{product.name}</h2>
                <p>{product.description ?? 'Produto pronto para detalhamento.'}</p>
                <strong>R$ {Number(product.basePrice).toFixed(2)}</strong>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
