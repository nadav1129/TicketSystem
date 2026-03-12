import type { TicketSubmissionForm } from './ticketSubmission.types';
import { Input } from '../../ui/input';

type Step1ContactProps = {
  form: TicketSubmissionForm;
  onChange: (field: keyof TicketSubmissionForm, value: string) => void;
};

export default function Step1Contact({ form, onChange }: Step1ContactProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Contact details</h3>
        <p className="mt-1 text-sm text-slate-500">Start by entering the requester information.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <div className="mb-2 text-sm font-medium text-slate-700">Email</div>
          <Input
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="name@example.com"
          />
        </label>

        <label className="block">
          <div className="mb-2 text-sm font-medium text-slate-700">Name</div>
          <Input
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Full name"
          />
        </label>
      </div>
    </div>
  );
}
