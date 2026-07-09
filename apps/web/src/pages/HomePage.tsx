import { Link } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog';
import { getPrimaryImageUrl } from '../utils/product-images';

export function HomePage() {
  const categoriesQuery = useCategories();
  const productsQuery = useProducts();

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Catálogo de roupas</p>
          <h1>Uma base moderna para vender coleção, montar carrinho e fechar pedidos.</h1>
          <p className="hero-text">
            Estrutura inicial alinhada ao schema Supabase, com backend em camadas e frontend com rotas,
            cache e páginas prontas para evoluir.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/catalogo">Explorar catálogo</Link>
            <Link className="secondary-button" to="/admin">Abrir admin</Link>
          </div>
        </div>
        <div className="hero-panel">
          <span className="stat-label">Itens no catálogo</span>
          <strong>{productsQuery.data?.length ?? 0}</strong>
          <span className="stat-label">Categorias ativas</span>
          <strong>{categoriesQuery.data?.length ?? 0}</strong>
        </div>
      </section>

      <section className="content-grid">
        <article className="surface-card">
          <div className="section-heading">
            <h2>Categorias</h2>
            <span>{categoriesQuery.isLoading ? 'Carregando' : 'Atualizado via API'}</span>
          </div>
          <div className="tag-row">
            {categoriesQuery.data?.map((category) => (
              <span className="tag" key={category.id}>{category.name}</span>
            ))}
          </div>
        </article>

        <article className="surface-card surface-card-wide">
          <div className="section-heading">
            <h2>Produtos recentes</h2>
            <Link to="/catalogo">Ver todos</Link>
          </div>
          <div className="product-list">
            {productsQuery.data?.map((product) => {
              const imageUrl = getPrimaryImageUrl(product.images);

              return (
                <Link className="product-row" key={product.id} to={`/produto/${product.id}`}>
                  <div className="product-row-media">
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="image-placeholder">Sem imagem</div>
                    )}
                  </div>
                  <div className="product-row-copy">
                    <h3>{product.name}</h3>
                    <p>{product.description ?? 'Sem descrição cadastrada'}</p>
                  </div>
                  <strong>R$ {Number(product.basePrice).toFixed(2)}</strong>
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
