import type { Product, TicketSubmissionForm } from './ticketSubmission.types';

type Step4ReviewSendProps = {
  form: TicketSubmissionForm;
  products: Product[];
};

export default function Step4ReviewSend({
  form,
  products,
}: Step4ReviewSendProps) {
  const product = products.find((item) => item.id === form.productId);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Review your ticket</h3>
        <p className="mt-1 text-sm text-slate-500">
          Please review your information before sending the request.
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="text-lg font-semibold text-slate-900">
            Support request summary
          </div>
          <div className="mt-1 text-sm text-slate-500">
            The support team will receive the following ticket details.
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-slate-900">
                Contact info
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Basic requester information
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ReceiptRow label="Full name" value={form.name || '—'} />
            <ReceiptRow label="Email address" value={form.email || '—'} />
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="mb-4">
            <div className="text-base font-semibold text-slate-900">
              Product info
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Selected product for this ticket
            </div>
          </div>

          <div className="space-y-4">
            <ReceiptRow label="Product" value={product?.name || '—'} />
            <ReceiptRow
              label="Price"
              value={product ? `$${product.price}` : '—'}
            />
            <ReceiptRow label="Category" value={product?.category || '—'} />
          </div>

          {product?.image && (
            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-slate-700">
                Product image
              </div>
              <img
                src={product.image}
                alt={product.name}
                className="h-40 w-40 rounded-2xl border border-slate-200 object-cover"
              />
            </div>
          )}
        </div>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="mb-4">
            <div className="text-base font-semibold text-slate-900">
              Issue details
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Subject and customer description
            </div>
          </div>

          <div className="space-y-4">
            <ReceiptRow label="Subject" value={form.subject || '—'} />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-700">Message</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {form.message || '—'}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            By sending this ticket, a new support request will be created and added
            to the team queue.
          </div>
        </div>
      </div>
    </div>
  );
}

type ReceiptRowProps = {
  label: string;
  value: string;
};

function ReceiptRow({ label, value }: ReceiptRowProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-6">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}