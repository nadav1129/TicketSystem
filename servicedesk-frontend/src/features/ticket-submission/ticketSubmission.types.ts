export type SubmissionStep = 1 | 2 | 3 | 4;

export type ProductCategory = 'Kitchen' | 'Cleaning' | 'Climate' | 'Coffee';

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
};

export type TicketSubject =
  | 'Product arrived damaged'
  | 'Stopped working'
  | 'Missing part'
  | 'Wrong item received'
  | 'Warranty claim'
  | 'Other';

export type TicketSubmissionForm = {
  email: string;
  name: string;
  productId: string;
  subject: TicketSubject | '';
  message: string;
};