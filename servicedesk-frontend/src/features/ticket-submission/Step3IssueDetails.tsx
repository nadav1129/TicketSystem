import { issueTypeOptions } from './ticketSubmission.data';
import type { TicketSubmissionForm } from './ticketSubmission.types';
import { Select } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

type Step3IssueDetailsProps = {
  form: TicketSubmissionForm;
  onChange: (field: keyof TicketSubmissionForm, value: string) => void;
};

export default function Step3IssueDetails({ form, onChange }: Step3IssueDetailsProps) {
  const handleSubjectChange = (value: string) => {
    const selected = issueTypeOptions.find((item) => item.id === value);

    onChange('issueTypeId', value);
    onChange('subject', selected ? selected.label : '');
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Issue details</h3>
        <p className="mt-1 text-sm text-slate-500">Choose a subject and describe the dispute.</p>
      </div>

      <label className="block">
        <div className="mb-2 text-sm font-medium text-slate-700">Subject</div>
        <Select
          value={form.issueTypeId}
          onChange={(e) => handleSubjectChange(e.target.value)}
        >
          <option value="">Select a subject</option>
          {issueTypeOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </label>

      <label className="block">
        <div className="mb-2 text-sm font-medium text-slate-700">Message</div>
        <Textarea
          value={form.message}
          onChange={(e) => onChange('message', e.target.value)}
          placeholder="Describe what happened, when it started, and what resolution you expect..."
          rows={8}
          className="rounded-[24px]"
        />
      </label>
    </div>
  );
}
