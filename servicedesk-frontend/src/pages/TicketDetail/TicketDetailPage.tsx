import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type ViewerType = "agent" | "customer";
type TicketStatus = "Open" | "In Progress" | "Waiting for Parts" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

type ConversationReply = {
  id: string;
  authorType: "agent" | "customer";
  authorName: string;
  message: string;
  createdAt: string;
};

type TicketDetails = {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  productId: string;
  subject: string;
  message: string;
  replies: ConversationReply[];
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

const products: Product[] = [
  {
    id: "p1",
    name: "TurboBlend Pro",
    category: "Kitchen",
    price: 149,
    image: "🧃",
  },
  {
    id: "p2",
    name: "SteamChef XL",
    category: "Kitchen",
    price: 219,
    image: "🍲",
  },
  {
    id: "p3",
    name: "FreshBrew Mini",
    category: "Coffee",
    price: 89,
    image: "☕",
  },
];

const initialTicket: TicketDetails = {
  id: "#6201",
  status: "Open",
  priority: "High",
  createdAt: "2026-03-11",
  customer: {
    name: "Dana Levy",
    email: "dana.levy@example.com",
  },
  productId: "p1",
  subject: "Stopped working",
  message:
    "Hello, the blender powers on correctly but stops after around 10 seconds of use. I already tried changing the socket and cleaning the jar connection area. Please advise.",
  replies: [
    {
      id: "r1",
      authorType: "customer",
      authorName: "Dana Levy",
      message:
        "Hello, the blender powers on correctly but stops after around 10 seconds of use.",
      createdAt: "2026-03-11 09:42",
    },
    {
      id: "r2",
      authorType: "agent",
      authorName: "Shira Azulay",
      message:
        "Thanks for the details. Please confirm whether the lid is fully locked and whether the issue happens on all speed levels.",
      createdAt: "2026-03-11 10:05",
    },
    {
      id: "r3",
      authorType: "customer",
      authorName: "Dana Levy",
      message:
        "Yes, the lid is fully locked. The same issue happens on all speed levels.",
      createdAt: "2026-03-11 10:18",
    },
  ],
};

export default function TicketDetailsPage() {
  const navigate = useNavigate();

  const { viewerType, ticketId } = useParams<{
    viewerType: ViewerType;
    ticketId: string;
  }>();

  const currentViewerType: ViewerType =
    viewerType === "customer" ? "customer" : "agent";

  const isAgent = currentViewerType === "agent";
  const normalizedTicketId = ticketId ? `#${ticketId}` : initialTicket.id;

  const [ticket, setTicket] = useState<TicketDetails>({
    ...initialTicket,
    id: normalizedTicketId,
  });
  const [replyText, setReplyText] = useState("");

  const product = useMemo(
    () => products.find((item) => item.id === ticket.productId),
    [ticket.productId],
  );

  const handleSubmitReply = () => {
    const value = replyText.trim();
    if (!value) return;

    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newReply: ConversationReply = {
      id: `r${ticket.replies.length + 1}`,
      authorType: isAgent ? "agent" : "customer",
      authorName: isAgent ? "Shira Azulay" : ticket.customer.name,
      message: value,
      createdAt,
    };

    setTicket((current) => ({
      ...current,
      status: current.status === "Closed" ? current.status : "In Progress",
      replies: [...current.replies, newReply],
    }));

    setReplyText("");
  };

  const handleCloseTicket = () => {
    setTicket((current) => ({
      ...current,
      status: "Closed",
    }));
  };

  const statusClass = (status: TicketStatus) => {
    if (status === "Open") return "bg-blue-100 text-blue-700";
    if (status === "In Progress") return "bg-indigo-100 text-indigo-700";
    if (status === "Waiting for Parts") return "bg-violet-100 text-violet-700";
    return "bg-slate-200 text-slate-700";
  };

  const priorityClass = (priority: TicketPriority) => {
    if (priority === "Low") return "bg-emerald-100 text-emerald-700";
    if (priority === "Medium") return "bg-amber-100 text-amber-700";
    if (priority === "High") return "bg-orange-100 text-orange-700";
    return "bg-rose-100 text-rose-700";
  };

  return (
    <AppLayout
      title="Ticket Details"
      subtitle="View the full support request, customer and product details, and continue the conversation."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(isAgent ? "/tickets" : "/my-tickets")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back
          </button>
          {isAgent ? (
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <span className="text-slate-500">Priority</span>
              <select
                value={ticket.priority}
                onChange={(e) =>
                  setTicket((current) => ({
                    ...current,
                    priority: e.target.value as TicketPriority,
                  }))
                }
                className={`rounded-full border-0 px-2 py-0.5 text-xs font-semibold outline-none ${priorityClass(ticket.priority)}`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>
          ) : null}

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(ticket.status)}`}
          >
            {ticket.status}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {ticket.id}
          </span>
        </div>
      }
    >
      <section className="space-y-6 p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="text-lg font-semibold text-slate-900">
                  Ticket summary
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Review the same core details captured during ticket
                  submission.
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="mb-4">
                  <div className="text-base font-semibold text-slate-900">
                    Ticket info
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Status and creation metadata
                  </div>
                </div>

                <div className="space-y-4">
                  <ReceiptRow label="Ticket ID" value={ticket.id} />
                  <ReceiptRow label="Status" value={ticket.status} />
                  <ReceiptRow label="Priority" value={ticket.priority} />
                  <ReceiptRow label="Date created" value={ticket.createdAt} />
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="mb-4">
                  <div className="text-base font-semibold text-slate-900">
                    Customer info
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Requester identity and contact details
                  </div>
                </div>

                <div className="space-y-4">
                  <ReceiptRow label="Full name" value={ticket.customer.name} />
                  <ReceiptRow
                    label="Email address"
                    value={ticket.customer.email}
                  />
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="mb-4">
                  <div className="text-base font-semibold text-slate-900">
                    Product info
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Related product from the ticket preview
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 text-5xl">
                    {product?.image || "📦"}
                  </div>

                  <div className="space-y-4">
                    <ReceiptRow label="Product" value={product?.name || "—"} />
                    <ReceiptRow
                      label="Category"
                      value={product?.category || "—"}
                    />
                    <ReceiptRow
                      label="Price"
                      value={product ? `$${product.price}` : "—"}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="mb-4">
                  <div className="text-base font-semibold text-slate-900">
                    Issue details
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Subject and full customer message
                  </div>
                </div>

                <div className="space-y-4">
                  <ReceiptRow label="Subject" value={ticket.subject} />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-700">
                    Full message
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {ticket.message}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="text-lg font-semibold text-slate-900">
                  Conversation
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Read all replies and continue the thread.
                </div>
              </div>

              <div className="max-h-[430px] space-y-4 overflow-y-auto px-6 py-5">
                {ticket.replies.map((reply) => {
                  const replyIsAgent = reply.authorType === "agent";

                  return (
                    <div
                      key={reply.id}
                      className={`flex ${replyIsAgent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-[24px] px-4 py-3 shadow-sm ${
                          replyIsAgent
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-900"
                        }`}
                      >
                        <div
                          className={`text-xs font-semibold ${
                            replyIsAgent ? "text-slate-200" : "text-slate-500"
                          }`}
                        >
                          {reply.authorName}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {reply.message}
                        </div>
                        <div
                          className={`mt-3 text-xs ${
                            replyIsAgent ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {reply.createdAt}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 px-6 py-5">
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-slate-700">
                    Write reply
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    rows={5}
                    className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                  />
                </label>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {isAgent ? (
                    <button
                      type="button"
                      onClick={handleCloseTicket}
                      disabled={ticket.status === "Closed"}
                      className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Close ticket
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitReply}
                    disabled={replyText.trim() === ""}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Submit reply
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-700">
                Ticket actions
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-500">
                Submitting a reply appends it to the conversation thread.
                {isAgent ? (
                  <>
                    {" "}
                    Closing the ticket changes its status to{" "}
                    <span className="font-medium">Closed</span>.
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

type AppLayoutProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

function AppLayout({ title, subtitle, action, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-3xl font-semibold tracking-tight text-slate-900">
                  {title}
                </div>
                {subtitle ? (
                  <div className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {subtitle}
                  </div>
                ) : null}
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

type ReceiptRowProps = {
  label: string;
  value: string;
};

function ReceiptRow({ label, value }: ReceiptRowProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-6">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
