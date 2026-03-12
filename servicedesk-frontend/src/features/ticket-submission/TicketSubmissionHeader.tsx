import { X } from 'lucide-react';
import { Button } from '../../ui/button';

type TicketSubmissionHeaderProps = {
  onClose?: () => void;
};

export default function TicketSubmissionHeader({ onClose }: TicketSubmissionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
      <div>
        <div className="text-xs font-medium text-zinc-500">New support request</div>
        <h2 className="mt-1 text-lg font-semibold text-zinc-100">Submit a Ticket</h2>
        <p className="mt-2 text-xs text-zinc-500">
          Complete the four-step flow to report a faulty product.
        </p>
      </div>

      <Button
        type="button"
        onClick={onClose}
        variant="outline"
        size="icon"
        className="h-8 w-8 text-zinc-500 hover:text-zinc-200"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
