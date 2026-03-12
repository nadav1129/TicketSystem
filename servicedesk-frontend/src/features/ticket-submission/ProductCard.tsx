import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Product } from './ticketSubmission.types';

type ProductCardProps = {
  product: Product;
  selected: boolean;
  onSelect: (productId: string) => void;
};

export default function ProductCard({
  product,
  selected,
  onSelect,
}: ProductCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSelect = () => {
    onSelect(product.id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  };

  const openPreview = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        className={`relative cursor-pointer rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 ${
          selected
            ? 'border-slate-900 bg-slate-50 shadow-md'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-slate-200/70">
          {product.image ? (
            <>
              <button
                type="button"
                onClick={openPreview}
                className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
                aria-label={`Open full image of ${product.name}`}
              >
                <ExpandIcon />
              </button>

              <div className="flex h-44 w-full items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
            </>
          ) : (
            <div className="flex h-44 items-center justify-center text-sm font-medium text-slate-500">
              No image
            </div>
          )}
        </div>

        <div className="line-clamp-2 min-h-[3.5rem] text-[15px] font-semibold leading-7 text-slate-900">
          {product.name}
        </div>

        <div className="mt-1 text-sm text-slate-500">{product.category}</div>

        <div className="mt-3 text-sm font-medium text-slate-700">
          ${product.price}
        </div>
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-slate-100"
              aria-label="Close image preview"
            >
              <CloseIcon />
            </button>

            <div className="flex max-h-[80vh] min-h-[420px] items-center justify-center rounded-2xl bg-slate-100 p-6">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-[72vh] max-w-full object-contain"
              />
            </div>

            <div className="px-2 pb-2 pt-4">
              <div className="text-base font-semibold text-slate-900">
                {product.name}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {product.category}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ExpandIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-4 w-4 text-slate-800"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
      <path d="M3 9V3h6" />
      <path d="M21 15v6h-6" />
      <path d="M3 3l7 7" />
      <path d="M21 21l-7-7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-5 w-5 text-slate-800"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}