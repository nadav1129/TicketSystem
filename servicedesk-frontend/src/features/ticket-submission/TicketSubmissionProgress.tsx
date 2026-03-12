import { Check } from 'lucide-react';
import type { SubmissionStep } from './ticketSubmission.types';

const steps = [
  { id: 1, label: 'Contact info' },
  { id: 2, label: 'Choose product' },
  { id: 3, label: 'Issue details' },
  { id: 4, label: 'Review & send' },
] as const;

type TicketSubmissionProgressProps = {
  currentStep: SubmissionStep;
};

export default function TicketSubmissionProgress({
  currentStep,
}: TicketSubmissionProgressProps) {
  return (
    <div className="border-b border-slate-200 px-6 py-5">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div
              key={step.id}
              className={`flex min-w-0 items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done
                      ? 'bg-sky-500 text-white'
                      : active
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </div>

                <div
                  className={`truncate text-sm font-medium ${
                    active || done ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="mx-4 h-px flex-1 bg-slate-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
