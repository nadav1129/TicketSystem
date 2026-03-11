import type { Product, ProductCategory, TicketSubject } from './ticketSubmission.types';

export const categories: ProductCategory[] = ['Kitchen', 'Cleaning', 'Climate', 'Coffee'];

export const products: Product[] = [
  { id: 'p1', name: 'Smart Blender X2', category: 'Kitchen', price: 399, image: 'SB' },
  { id: 'p2', name: 'Air Fryer Duo', category: 'Kitchen', price: 549, image: 'AF' },
  { id: 'p3', name: 'Vacuum Cleaner S9', category: 'Cleaning', price: 699, image: 'VC' },
  { id: 'p4', name: 'Air Purifier Pro', category: 'Climate', price: 899, image: 'AP' },
  { id: 'p5', name: 'Portable Heater Go', category: 'Climate', price: 249, image: 'PH' },
  { id: 'p6', name: 'Coffee Machine Elite', category: 'Coffee', price: 1199, image: 'CM' },
];

export const subjects: TicketSubject[] = [
  'Product arrived damaged',
  'Stopped working',
  'Missing part',
  'Wrong item received',
  'Warranty claim',
  'Other',
];