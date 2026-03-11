import type { Product } from './ticketSubmission.types';

type ProductCardProps = {
  product: Product;
  selected: boolean;
  onSelect: (productId: string) => void;
};

export default function ProductCard({ product, selected, onSelect }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 ${
        selected ? 'border-slate-900 bg-slate-50 shadow-md' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-4 flex h-24 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-600">
        {product.image}
      </div>
      <div className="font-semibold text-slate-900">{product.name}</div>
      <div className="mt-1 text-sm text-slate-500">{product.category}</div>
      <div className="mt-3 text-sm font-medium text-slate-700">₪{product.price}</div>
    </button>
  );
}