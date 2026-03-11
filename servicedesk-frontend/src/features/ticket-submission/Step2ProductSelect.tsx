import ProductCard from './ProductCard';
import { categories, products } from './ticketSubmission.data';
import type { ProductCategory } from './ticketSubmission.types';

type Step2ProductSelectProps = {
  selectedCategory: ProductCategory;
  selectedProductId: string;
  onSelectCategory: (category: ProductCategory) => void;
  onSelectProduct: (productId: string) => void;
};

export default function Step2ProductSelect({
  selectedCategory,
  selectedProductId,
  onSelectCategory,
  onSelectProduct,
}: Step2ProductSelectProps) {
  const filteredProducts = products.filter((product) => product.category === selectedCategory);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Select product</h3>
        <p className="mt-1 text-sm text-slate-500">Choose a category and then the product involved in the issue.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedCategory === category
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

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
    </div>
  );
}