import { useEffect, useMemo, useState } from 'react';
import TicketSubmissionHeader from './TicketSubmissionHeader';
import TicketSubmissionProgress from './TicketSubmissionProgress';
import Step1Contact from './Step1Contact';
import Step2ProductSelect from './Step2ProductSelect';
import Step3IssueDetails from './Step3IssueDetails';
import Step4ReviewSend from './Step4ReviewSend';
import { apiUrl } from '../../lib/api';
import { Button } from '../../ui/button';
import type {
  Product,
  ProductCategory,
  SubmissionStep,
  TicketSubmissionForm,
} from './ticketSubmission.types';

type TicketSubmissionPanelProps = {
  open: boolean;
  onClose: () => void;
};

type PlatziApiProduct = {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  category?: {
    id: number;
    name: string;
    slug: string;
    image: string;
  };
};

const initialForm: TicketSubmissionForm = {
  email: '',
  name: '',
  productId: '',
  subject: '',
  message: '',
  issueTypeId: '',
};

function formatCategoryLabel(slugOrName: string | undefined): string {
  if (!slugOrName || !slugOrName.trim()) {
    return 'Other';
  }

  return slugOrName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapApiProductToUiProduct(apiProduct: PlatziApiProduct): Product {
  const categorySource =
    apiProduct.category?.slug ||
    apiProduct.category?.name ||
    'other';

  return {
    id: String(apiProduct.id),
    externalId: apiProduct.id,
    name: apiProduct.title,
    category: formatCategoryLabel(categorySource),
    price: Number(apiProduct.price) || 0,
    image: apiProduct.images?.[0] || '',
  };
}

export default function TicketSubmissionPanel({
  open,
  onClose,
}: TicketSubmissionPanelProps) {
  const [step, setStep] = useState<SubmissionStep>(1);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('');
  const [form, setForm] = useState<TicketSubmissionForm>(initialForm);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError('');

        const response = await fetch(
          'https://api.escuelajs.co/api/v1/products?offset=0&limit=24'
        );

        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        const data: PlatziApiProduct[] = await response.json();

        if (cancelled) {
          return;
        }

        const mappedProducts = data.map(mapApiProductToUiProduct);
        const uniqueCategories = Array.from(
          new Set(mappedProducts.map((product) => product.category))
        );

        setProducts(mappedProducts);

        if (uniqueCategories.length > 0) {
          setSelectedCategory((current) =>
            current && uniqueCategories.includes(current)
              ? current
              : uniqueCategories[0]
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setProductsError(
          error instanceof Error ? error.message : 'Failed to load products'
        );
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category)));
  }, [products]);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return form.email.trim() !== '' && form.name.trim() !== '';
    }

    if (step === 2) {
      return form.productId.trim() !== '';
    }

    if (step === 3) {
      return (
        form.issueTypeId.trim() !== '' &&
        form.subject.trim() !== '' &&
        form.message.trim() !== ''
      );
    }

    return true;
  }, [form, step]);

  const updateField = (field: keyof TicketSubmissionForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const nextStep = () => {
    if (step < 4 && canContinue) {
      setStep((current) => (current + 1) as SubmissionStep);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep((current) => (current - 1) as SubmissionStep);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCategory('');
    setForm(initialForm);
    onClose();
  };

  const submit = async () => {
    try {
      const selectedProduct = products.find(
        (product) => product.id === form.productId
      );

      if (!selectedProduct) {
        throw new Error('Selected product was not found.');
      }

      const payload = {
        email: form.email.trim(),
        name: form.name.trim(),
        issueTypeId: Number(form.issueTypeId),
        subject: form.subject.trim(),
        message: form.message.trim(),
        product: {
          externalId: selectedProduct.externalId,
          name: selectedProduct.name,
          category: selectedProduct.category,
          price: selectedProduct.price,
          imageUrl: selectedProduct.image,
        },
      };

      console.log('submit payload:', payload);

      const response = await fetch(apiUrl('/api/tickets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      console.log('create ticket status:', response.status);
      console.log('create ticket response body:', text);

      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      handleClose();
    } catch (error) {
      console.error('submit error:', error);
      throw error;
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-950 text-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <TicketSubmissionHeader onClose={handleClose} />
        <TicketSubmissionProgress currentStep={step} />

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && <Step1Contact form={form} onChange={updateField} />}

          {step === 2 && (
            <Step2ProductSelect
              categories={categories}
              products={products}
              selectedCategory={selectedCategory}
              selectedProductId={form.productId}
              loading={productsLoading}
              error={productsError}
              onSelectCategory={setSelectedCategory}
              onSelectProduct={(productId) => updateField('productId', productId)}
            />
          )}

          {step === 3 && (
            <Step3IssueDetails form={form} onChange={updateField} />
          )}

          {step === 4 && <Step4ReviewSend form={form} products={products} />}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <Button
            type="button"
            onClick={previousStep}
            disabled={step === 1}
            variant="outline"
          >
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
            >
              Cancel
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canContinue}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={submit}
              >
                Send ticket
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
