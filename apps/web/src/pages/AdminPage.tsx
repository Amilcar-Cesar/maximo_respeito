import { useEffect, useState } from 'react';
import { AdminProductForm, createEmptyProductForm, type AdminProductFormValues } from '../components/AdminProductForm';
import {
  useAdminCategories,
  useAdminProducts,
  useCreateAdminCategory,
  useCreateAdminProduct,
  useDeleteAdminCategory,
  useDeleteAdminProduct,
  useUpdateAdminCategory,
  useUpdateAdminProduct
} from '../hooks/useAdmin';
import { useAdminSession } from '../hooks/useAdminSession';
import type { AdminProductFormPayload } from '../services/admin.service';

function toProductFormValues(product: {
  name: string;
  description: string | null;
  basePrice: string;
  categoryId: string | null;
  isActive: boolean;
  variants: AdminProductFormValues['variants'];
  images: AdminProductFormValues['images'];
}): AdminProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    basePrice: product.basePrice,
    categoryId: product.categoryId ?? '',
    isActive: product.isActive,
    variants: product.variants.length > 0 ? product.variants : createEmptyProductForm().variants,
    images: product.images.length > 0 ? product.images : createEmptyProductForm().images
  };
}

function toProductPayload(values: AdminProductFormValues): AdminProductFormPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    basePrice: values.basePrice,
    categoryId: values.categoryId || null,
    isActive: values.isActive,
    variants: values.variants
      .filter((variant) => variant.size.trim() && variant.color.trim())
      .map((variant) => ({
        ...variant,
        size: variant.size.trim(),
        color: variant.color.trim(),
        sku: variant.sku?.trim() || null,
        priceOverride: variant.priceOverride?.trim() || null
      })),
    images: values.images
      .filter((image) => image.imageUrl.trim())
      .map((image, index) => ({
        ...image,
        imageUrl: image.imageUrl.trim(),
        position: image.position ?? index,
        variantId: image.variantId?.trim() || null
      }))
  };
}

export function AdminPage() {
  const session = useAdminSession();
  const categoriesQuery = useAdminCategories(session.isAuthenticated);
  const productsQuery = useAdminProducts(session.isAuthenticated);
  const createCategoryMutation = useCreateAdminCategory();
  const updateCategoryMutation = useUpdateAdminCategory();
  const deleteCategoryMutation = useDeleteAdminCategory();
  const createProductMutation = useCreateAdminProduct();
  const updateProductMutation = useUpdateAdminProduct();
  const deleteProductMutation = useDeleteAdminProduct();

  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [productForm, setProductForm] = useState<AdminProductFormValues>(createEmptyProductForm);
  const [editingProductId, setEditingProductId] = useState('');

  useEffect(() => {
    if (!editingCategoryId) {
      return;
    }

    const target = categoriesQuery.data?.find((category) => category.id === editingCategoryId);
    if (target) {
      setCategoryName(target.name);
      setCategorySlug(target.slug);
    }
  }, [categoriesQuery.data, editingCategoryId]);

  useEffect(() => {
    if (!editingProductId) {
      return;
    }

    const target = productsQuery.data?.find((product) => product.id === editingProductId);
    if (target) {
      setProductForm(toProductFormValues(target));
    }
  }, [productsQuery.data, editingProductId]);

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategorySlug('');
    setEditingCategoryId('');
  };

  const resetProductForm = () => {
    setProductForm(createEmptyProductForm());
    setEditingProductId('');
  };

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await session.login({ username: loginUsername, password: loginPassword });
  };

  const submitCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { name: categoryName, slug: categorySlug };

    try {
      if (editingCategoryId) {
        await updateCategoryMutation.mutateAsync({ id: editingCategoryId, payload });
      } else {
        await createCategoryMutation.mutateAsync(payload);
      }

      resetCategoryForm();
    } catch {
      // mutation error is shown below
    }
  };

  const submitProduct = async () => {
    const payload = toProductPayload(productForm);

    try {
      if (editingProductId) {
        await updateProductMutation.mutateAsync({ id: editingProductId, payload });
      } else {
        await createProductMutation.mutateAsync(payload);
      }

      resetProductForm();
    } catch {
      // mutation error is shown below
    }
  };

  const getMutationErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar à API. Verifique se o backend está rodando em http://localhost:3333.';
    }

    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
      const message = response?.data?.error?.message;
      if (message) {
        return message;
      }
    }

    return 'Não foi possível salvar. Confira os dados e tente novamente.';
  };

  if (!session.isAuthenticated) {
    return (
      <main className="page-shell admin-page">
        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>Entrar no painel</h1>
            </div>
            <span>Protegido por token</span>
          </div>
          <p className="hero-text">Faça login para gerenciar categorias e produtos.</p>
        </section>

        <section className="surface-card login-card">
          <form className="stack-form" onSubmit={submitLogin}>
            <input placeholder="Usuário" value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} />
            <input placeholder="Senha" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={session.loginMutation.isPending}>
                {session.loginMutation.isPending ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
          {session.loginMutation.isError ? (
            <p className="error-banner">
              {session.loginMutation.error instanceof Error &&
              'code' in session.loginMutation.error &&
              session.loginMutation.error.code === 'ERR_NETWORK'
                ? 'Não foi possível conectar à API. Verifique se o backend está rodando.'
                : 'Credenciais inválidas.'}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell admin-page">
      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Gestão de catálogo</h1>
          </div>
          <div className="row-actions">
            <span>{session.username}</span>
            <button type="button" className="ghost-button" onClick={session.logout}>Sair</button>
          </div>
        </div>
        <p className="hero-text">Crie, edite e remova categorias e produtos. As alterações atualizam a vitrine pública.</p>
      </section>

      <section className="admin-grid">
        <article className="surface-card">
          <div className="section-heading">
            <h2>Categorias</h2>
            <span>{categoriesQuery.data?.length ?? 0} itens</span>
          </div>

          <form className="category-form stack-form" onSubmit={submitCategory}>
            {editingCategoryId && (
              <div className="edit-mode-banner">
                <span>Você está editando a categoria: <strong>{categoryName}</strong></span>
                <button type="button" className="ghost-button" onClick={resetCategoryForm}>Cancelar</button>
              </div>
            )}
            <label className="form-field">
              <span>Nome da categoria</span>
              <input placeholder="Camisetas" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            </label>
            <label className="form-field">
              <span>Slug</span>
              <input placeholder="camisetas" value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                {editingCategoryId ? 'Atualizar categoria' : 'Criar categoria'}
              </button>
              <button className="secondary-button" type="button" onClick={resetCategoryForm}>Limpar</button>
            </div>
          </form>

          {createCategoryMutation.isError || updateCategoryMutation.isError ? (
            <p className="error-banner">
              {getMutationErrorMessage(createCategoryMutation.error ?? updateCategoryMutation.error)}
            </p>
          ) : null}

          <div className="admin-list">
            {categoriesQuery.data?.map((category) => (
              <div className="admin-row" key={category.id}>
                <div>
                  <strong>{category.name}</strong>
                  <p>{category.slug}</p>
                </div>
                <div className="row-actions">
                  <button type="button" className="ghost-button" onClick={() => {
                    setEditingCategoryId(category.id);
                    setCategoryName(category.name);
                    setCategorySlug(category.slug);
                    setTimeout(() => {
                      document.querySelector('.category-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}>Editar</button>
                  <button type="button" className="ghost-button" onClick={() => deleteCategoryMutation.mutate(category.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card admin-wide">
          <div className="section-heading">
            <h2>Produtos</h2>
            <span>{productsQuery.data?.length ?? 0} itens</span>
          </div>

          <AdminProductForm
            categories={categoriesQuery.data ?? []}
            values={productForm}
            editing={Boolean(editingProductId)}
            isSubmitting={createProductMutation.isPending || updateProductMutation.isPending}
            onChange={setProductForm}
            onSubmit={submitProduct}
            onReset={resetProductForm}
          />

          {createProductMutation.isError || updateProductMutation.isError ? (
            <p className="error-banner">
              {getMutationErrorMessage(createProductMutation.error ?? updateProductMutation.error)}
            </p>
          ) : null}

          <div className="admin-list">
            {productsQuery.data?.map((product) => (
              <div className="admin-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.categoryName ?? 'Sem categoria'} · R$ {Number(product.basePrice).toFixed(2)}</p>
                </div>
                <div className="row-actions">
                  <button type="button" className="ghost-button" onClick={() => {
                    setEditingProductId(product.id);
                    setProductForm(toProductFormValues(product));
                    setTimeout(() => {
                      document.querySelector('.product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}>Editar</button>
                  <button type="button" className="ghost-button" onClick={() => deleteProductMutation.mutate(product.id)}>Desativar</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
