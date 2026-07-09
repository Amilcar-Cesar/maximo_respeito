import type { AdminCategoryDTO, AdminProductImageInput, AdminProductVariantInput } from '../types/admin';

export interface AdminProductFormValues {
  name: string;
  description: string;
  basePrice: string;
  categoryId: string;
  isActive: boolean;
  variants: AdminProductVariantInput[];
  images: AdminProductImageInput[];
}

interface AdminProductFormProps {
  categories: AdminCategoryDTO[];
  values: AdminProductFormValues;
  editing: boolean;
  isSubmitting: boolean;
  onChange: (values: AdminProductFormValues) => void;
  onSubmit: () => void;
  onReset: () => void;
}

function createEmptyVariant(): AdminProductVariantInput {
  return {
    size: '',
    color: '',
    sku: null,
    priceOverride: null,
    stock: 0,
    isActive: true
  };
}

function createEmptyImage(position: number): AdminProductImageInput {
  return {
    imageUrl: '',
    position,
    variantId: null
  };
}

export function createEmptyProductForm(): AdminProductFormValues {
  return {
    name: '',
    description: '',
    basePrice: '0.00',
    categoryId: '',
    isActive: true,
    variants: [createEmptyVariant()],
    images: [createEmptyImage(0)]
  };
}

export function AdminProductForm({
  categories,
  values,
  editing,
  isSubmitting,
  onChange,
  onSubmit,
  onReset
}: AdminProductFormProps) {
  const updateField = <K extends keyof AdminProductFormValues>(key: K, value: AdminProductFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  const updateVariant = (index: number, patch: Partial<AdminProductVariantInput>) => {
    const variants = values.variants.map((variant, variantIndex) =>
      variantIndex === index ? { ...variant, ...patch } : variant
    );
    onChange({ ...values, variants });
  };

  const updateImage = (index: number, patch: Partial<AdminProductImageInput>) => {
    const images = values.images.map((image, imageIndex) =>
      imageIndex === index ? { ...image, ...patch } : image
    );
    onChange({ ...values, images });
  };

  const addVariant = () => {
    onChange({ ...values, variants: [...values.variants, createEmptyVariant()] });
  };

  const removeVariant = (index: number) => {
    if (values.variants.length === 1) {
      onChange({ ...values, variants: [createEmptyVariant()] });
      return;
    }

    onChange({ ...values, variants: values.variants.filter((_, variantIndex) => variantIndex !== index) });
  };

  const addImage = () => {
    onChange({ ...values, images: [...values.images, createEmptyImage(values.images.length)] });
  };

  const removeImage = (index: number) => {
    if (values.images.length === 1) {
      onChange({ ...values, images: [createEmptyImage(0)] });
      return;
    }

    const images = values.images
      .filter((_, imageIndex) => imageIndex !== index)
      .map((image, position) => ({ ...image, position }));

    onChange({ ...values, images });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="product-form stack-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <div className="form-section-header">
          <h3>Informações básicas</h3>
          <p>Dados principais exibidos na vitrine do catálogo.</p>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span>Nome do produto</span>
            <input
              required
              placeholder="Ex.: Camiseta Oversized Areia"
              value={values.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Preço base (R$)</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="129.90"
              value={values.basePrice}
              onChange={(event) => updateField('basePrice', event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Categoria</span>
            <select value={values.categoryId} onChange={(event) => updateField('categoryId', event.target.value)}>
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field-checkbox">
            <span>Status</span>
            <span className="checkbox-row">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => updateField('isActive', event.target.checked)}
              />
              Produto ativo na vitrine
            </span>
          </label>

          <label className="form-field full-span">
            <span>Descrição</span>
            <textarea
              placeholder="Descreva o material, caimento e diferenciais do produto."
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <div>
            <h3>Variantes</h3>
            <p>Defina tamanho, cor, estoque e SKU de cada opção vendável.</p>
          </div>
          <button type="button" className="secondary-button" onClick={addVariant}>
            + Adicionar variante
          </button>
        </div>

        <div className="repeatable-list">
          {values.variants.map((variant, index) => (
            <article className="repeatable-card" key={`variant-${index}`}>
              <div className="repeatable-card-header">
                <strong>Variante {index + 1}</strong>
                <button type="button" className="ghost-button" onClick={() => removeVariant(index)}>
                  Remover
                </button>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Tamanho</span>
                  <input
                    required
                    placeholder="P, M, G ou 38"
                    value={variant.size}
                    onChange={(event) => updateVariant(index, { size: event.target.value })}
                  />
                </label>

                <label className="form-field">
                  <span>Cor</span>
                  <input
                    required
                    placeholder="Preto, Areia..."
                    value={variant.color}
                    onChange={(event) => updateVariant(index, { color: event.target.value })}
                  />
                </label>

                <label className="form-field">
                  <span>SKU</span>
                  <input
                    placeholder="CAM-AREIA-M"
                    value={variant.sku ?? ''}
                    onChange={(event) => updateVariant(index, { sku: event.target.value || null })}
                  />
                </label>

                <label className="form-field">
                  <span>Estoque</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={variant.stock}
                    onChange={(event) => updateVariant(index, { stock: Number(event.target.value) || 0 })}
                  />
                </label>

                <label className="form-field">
                  <span>Preço alternativo (opcional)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Usa o preço base se vazio"
                    value={variant.priceOverride ?? ''}
                    onChange={(event) =>
                      updateVariant(index, { priceOverride: event.target.value || null })
                    }
                  />
                </label>

                <label className="form-field form-field-checkbox">
                  <span>Disponibilidade</span>
                  <span className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(event) => updateVariant(index, { isActive: event.target.checked })}
                    />
                    Variante ativa
                  </span>
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <div>
            <h3>Imagens</h3>
            <p>URLs públicas das fotos do produto, em ordem de exibição.</p>
          </div>
          <button type="button" className="secondary-button" onClick={addImage}>
            + Adicionar imagem
          </button>
        </div>

        <div className="repeatable-list">
          {values.images.map((image, index) => (
            <article className="repeatable-card" key={`image-${index}`}>
              <div className="repeatable-card-header">
                <strong>Imagem {index + 1}</strong>
                <button type="button" className="ghost-button" onClick={() => removeImage(index)}>
                  Remover
                </button>
              </div>

              <div className="image-form-row">
                <div className="image-preview-box">
                  {image.imageUrl ? (
                    <img src={image.imageUrl} alt={`Prévia ${index + 1}`} className="image-preview-thumb" />
                  ) : (
                    <div className="image-placeholder">Prévia</div>
                  )}
                </div>

                <div className="form-grid image-fields">
                  <label className="form-field full-span">
                    <span>URL da imagem</span>
                    <input
                      required
                      type="url"
                      placeholder="https://..."
                      value={image.imageUrl}
                      onChange={(event) => updateImage(index, { imageUrl: event.target.value })}
                    />
                  </label>

                  <label className="form-field">
                    <span>Posição</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={image.position}
                      onChange={(event) => updateImage(index, { position: Number(event.target.value) || 0 })}
                    />
                  </label>

                  <label className="form-field">
                    <span>ID da variante (opcional)</span>
                    <input
                      placeholder="Vincule a uma cor específica"
                      value={image.variantId ?? ''}
                      onChange={(event) => updateImage(index, { variantId: event.target.value || null })}
                    />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : editing ? 'Atualizar produto' : 'Criar produto'}
        </button>
        <button className="secondary-button" type="button" onClick={onReset}>
          Limpar
        </button>
      </div>
    </form>
  );
}
