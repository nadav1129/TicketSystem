import type { Product, ProductCategory, TicketSubject } from './ticketSubmission.types';

export const issueTypeOptions = [
  { id: '1', label: 'Damaged Item' },
  { id: '2', label: 'Wrong Item' },
  { id: '3', label: 'Missing Parts' },
  { id: '4', label: 'Billing Problem' },
  { id: '5', label: 'Technical Problem' },
  { id: '6', label: 'Warranty Request' },
  { id: '7', label: 'Other' },
];