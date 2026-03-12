import ProductCard from './ProductCard';
import type { Product, ProductCategory } from './ticketSubmission.types';
import { Button } from '../../ui/button';

type Step2ProductSelectProps = {
  categories: ProductCategory[];
  products: Product[];
  selectedCategory: ProductCategory;
  selectedProductId: string;
  loading?: boolean;
  error?: string;
  onSelectCategory: (category: ProductCategory) => void;
  onSelectProduct: (productId: string) => void;
};

export default function Step2ProductSelect({
  categories,
  products,
  selectedCategory,
  selectedProductId,
  loading = false,
  error,
  onSelectCategory,
  onSelectProduct,
}: Step2ProductSelectProps) {
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Select product</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Choose a category and then the product involved in the issue.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading products...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              size="sm"
              className={`rounded-full ${
                selectedCategory === category
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProductId === product.id}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No categories were found.
        </div>
      )}

      {!loading && !error && categories.length > 0 && filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No products found in this category.
        </div>
      )}
    </div>
  );
}
