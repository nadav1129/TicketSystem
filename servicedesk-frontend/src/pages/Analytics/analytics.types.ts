export type AnalyticsTicket = {
  rawId: number;
  ticketNumber: string;
  requester: string;
  product: string;
  channel: string;
  priority: string;
  status: string;
  date: string;
  sectionType: string;
  target: number;
  limit: number;
  reviewer: string;
};

export type AnalyticsFilterTab = "all" | "in-progress" | "done" | "open";
