import { useMemo, useState } from 'react';
import TicketSubmissionHeader from './TicketSubmissionHeader';
import TicketSubmissionProgress from './TicketSubmissionProgress';
import Step1Contact from './Step1Contact';
import Step2ProductSelect from './Step2ProductSelect';
import Step3IssueDetails from './Step3IssueDetails';
import Step4ReviewSend from './Step4ReviewSend';
import type { ProductCategory, SubmissionStep, TicketSubmissionForm } from './ticketSubmission.types';

type TicketSubmissionPanelProps = {
  open: boolean;
  onClose: () => void;
};

const initialForm: TicketSubmissionForm = {
  email: '',
  name: '',
  productId: '',
  subject: '',
  message: '',
};

export default function TicketSubmissionPanel({
  open,
  onClose,
}: TicketSubmissionPanelProps) {
  const [step, setStep] = useState<SubmissionStep>(1);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Kitchen');
  const [form, setForm] = useState<TicketSubmissionForm>(initialForm);

  const canContinue = useMemo(() => {
    if (step === 1) return form.email.trim() !== '' && form.name.trim() !== '';
    if (step === 2) return form.productId.trim() !== '';
    if (step === 3) return form.subject.trim() !== '' && form.message.trim() !== '';
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
    setSelectedCategory('Kitchen');
    setForm(initialForm);
    onClose();
  };

  const submit = () => {
    console.log('Ticket submitted', form);
    handleClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <TicketSubmissionHeader onClose={handleClose}/>
        <TicketSubmissionProgress currentStep={step} />

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && <Step1Contact form={form} onChange={updateField} />}

          {step === 2 && (
            <Step2ProductSelect
              selectedCategory={selectedCategory}
              selectedProductId={form.productId}
              onSelectCategory={setSelectedCategory}
              onSelectProduct={(productId) => updateField('productId', productId)}
            />
          )}

          {step === 3 && <Step3IssueDetails form={form} onChange={updateField} />}

          {step === 4 && <Step4ReviewSend form={form} />}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={previousStep}
            disabled={step === 1}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinue}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Send ticket
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}