export type AnalyticsTicket = {
  rawId: number;
  ticketNumber: string;
  subject: string;
  requester: string;
  assignedAgent: string;
  product: string;
  channel: string;
  priority: string;
  status: string;
  date: string;
};

export type AnalyticsFilterTab = "all" | "open" | "in-progress" | "resolved";
