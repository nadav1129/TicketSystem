import { X } from 'lucide-react';
import { Button } from '../../ui/button';

type TicketSubmissionHeaderProps = {
  onClose?: () => void;
};

export default function TicketSubmissionHeader({ onClose }: TicketSubmissionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
      <div>
        <div className="text-sm font-medium text-slate-500">New support request</div>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">Submit a Ticket</h2>
        <p className="mt-2 text-sm text-slate-500">
          Complete the four-step flow to report a faulty product.
        </p>
      </div>

      <Button
        type="button"
        onClick={onClose}
        variant="outline"
        size="icon"
        className="text-slate-500 hover:text-slate-700"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
