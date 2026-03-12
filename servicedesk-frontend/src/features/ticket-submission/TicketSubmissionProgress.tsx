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
    <div className="border-b border-zinc-800 px-6 py-4">
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
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-emerald-600 text-zinc-950'
                      : active
                      ? 'bg-emerald-600 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </div>

                <div
                  className={`truncate text-xs font-medium ${
                    active || done ? 'text-zinc-100' : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="mx-4 h-px flex-1 bg-zinc-800" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
