import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppLayot from "../../components/AppLayot";

type ViewerType = "agent" | "customer";
type TicketStatusCode =
  | "open"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed";
type TicketPriorityCode = "low" | "medium" | "high" | "urgent";

type LocationState = {
  allowReply?: boolean;
  source?: string;
  viewerType?: ViewerType;
  viewerUserId?: number;
  viewerName?: string;
  ticketNumber?: number;
};

type TicketReply = {
  id: number;
  senderUserId: number;
  authorType: ViewerType;
  authorName: string;
  message: string;
  createdAt: string;
};

type TicketDetailsDto = {
  id: number;
  ticketNumber: number;
  statusCode: TicketStatusCode;
  statusName: string;
  priorityCode: TicketPriorityCode;
  priorityName: string;
  createdAt: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  assignedAgentId?: number | null;
  assignedAgentName: string;
  productId?: number | null;
  productName: string;
  productCategory: string;
  productPrice?: number | null;
  productImageUrl: string;
  subject: string;
  initialMessage: string;
  customerRating?: number | null;
  customerRatingComment?: string | null;
  replies: TicketReply[];
};

const priorityOptions: Array<{ code: TicketPriorityCode; name: string }> = [
  { code: "low", name: "Low" },
  { code: "medium", name: "Medium" },
  { code: "high", name: "High" },
  { code: "urgent", name: "Urgent" },
];

const agentStatusOptions: Array<{ code: TicketStatusCode; name: string }> = [
  { code: "open", name: "Open" },
  { code: "in_progress", name: "In Progress" },
  { code: "waiting_customer", name: "Waiting Customer" },
  { code: "closed", name: "Closed" },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function statusClass(statusCode: TicketStatusCode) {
  if (statusCode === "open") return "bg-blue-100 text-blue-700";
  if (statusCode === "in_progress") return "bg-indigo-100 text-indigo-700";
  if (statusCode === "waiting_customer") return "bg-violet-100 text-violet-700";
  if (statusCode === "resolved") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-200 text-slate-700";
}

function priorityClass(priorityCode: TicketPriorityCode) {
  if (priorityCode === "low") return "bg-emerald-100 text-emerald-700";
  if (priorityCode === "medium") return "bg-amber-100 text-amber-700";
  if (priorityCode === "high") return "bg-orange-100 text-orange-700";
  return "bg-rose-100 text-rose-700";
}

export default function TicketDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { viewerType: routeViewerType, ticketId } = useParams<{
    viewerType: ViewerType;
    ticketId: string;
  }>();

  const routeState = (location.state ?? {}) as LocationState;

  const viewerType: ViewerType =
    routeState.viewerType === "customer" || routeState.viewerType === "agent"
      ? routeState.viewerType
      : routeViewerType === "customer"
        ? "customer"
        : "agent";

  const viewerUserId = routeState.viewerUserId ?? 0;
  const viewerName = routeState.viewerName ?? "";
  const isViewerMode = routeState.allowReply === false;

  const canReply =
    Boolean(routeState.allowReply) &&
    viewerUserId > 0 &&
    (viewerType === "agent" || viewerType === "customer");

  const isAgent = viewerType === "agent";
  const numericTicketId = Number(ticketId);

  const [ticket, setTicket] = useState<TicketDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [selectedPriority, setSelectedPriority] =
    useState<TicketPriorityCode>("medium");
  const [selectedStatus, setSelectedStatus] =
    useState<TicketStatusCode>("open");
  const [rating, setRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");

  const backPath =
    routeState.source === "my-tickets" ? "/my-tickets" : "/tickets";

  const loadTicket = async () => {
    if (!Number.isFinite(numericTicketId) || numericTicketId <= 0) {
      setError("Invalid ticket id.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const detailsUrl = isViewerMode
        ? `http://localhost:8080/api/ticket-details/${numericTicketId}`
        : `http://localhost:8080/api/ticket-details/${numericTicketId}?viewerUserId=${viewerUserId}&viewerType=${viewerType}`;

      const response = await fetch(detailsUrl);

      if (!response.ok) {
        throw new Error(`Failed to load ticket. Status: ${response.status}`);
      }

      const data: TicketDetailsDto = await response.json();
      setTicket(data);
      setSelectedPriority(data.priorityCode);
      setSelectedStatus(data.statusCode);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [numericTicketId, viewerType, viewerUserId]);

  const allMessages = useMemo(() => {
    if (!ticket) return [];

    const normalizedInitialMessage = (ticket.initialMessage ?? "").trim();
    const hasInitialMessage = normalizedInitialMessage.length > 0;

    const firstMessage = hasInitialMessage
      ? {
          id: -1,
          senderUserId: ticket.customerId,
          authorType: "customer" as const,
          authorName: ticket.customerName,
          message: normalizedInitialMessage,
          createdAt: ticket.createdAt,
        }
      : null;

    const normalizedReplies = ticket.replies.filter(
      (reply) => reply.message.trim().length > 0,
    );

    return firstMessage
      ? [firstMessage, ...normalizedReplies]
      : normalizedReplies;
  }, [ticket]);

  const handleSubmitReply = async () => {
    const message = replyText.trim();
    if (!ticket || !canReply || !message) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        `http://localhost:8080/api/ticket-details/${ticket.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewerUserId,
            viewerType,
            message,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to send reply. Status: ${response.status}`);
      }

      setReplyText("");
      await loadTicket();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriorityChange = async (priorityCode: TicketPriorityCode) => {
    if (!ticket || !isAgent || !canReply) return;

    try {
      setIsSaving(true);
      setError("");
      setSelectedPriority(priorityCode);

      const response = await fetch(
        `http://localhost:8080/api/ticket-details/${ticket.id}/priority`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewerUserId,
            viewerType,
            priorityCode,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update priority. Status: ${response.status}`,
        );
      }

      await loadTicket();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (statusCode: TicketStatusCode) => {
    if (!ticket || !isAgent || !canReply) return;

    try {
      setIsSaving(true);
      setError("");
      setSelectedStatus(statusCode);

      const response = await fetch(
        `http://localhost:8080/api/ticket-details/${ticket.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewerUserId,
            viewerType,
            statusCode,
            note: "Changed from ticket details page",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update status. Status: ${response.status}`);
      }

      await loadTicket();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const submitCloseTicket = async () => {
    if (!ticket || !canReply) return;

    if (!isAgent && (rating < 1 || rating > 5)) {
      setError("Customer closing requires a rating between 1 and 5.");
      return;
    }

    try {
      setIsSaving(true);
      setPendingClose(true);
      setError("");

      const response = await fetch(
        `http://localhost:8080/api/ticket-details/${ticket.id}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewerUserId,
            viewerType,
            rating: isAgent ? null : rating,
            ratingComment: isAgent ? "" : ratingComment.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to close ticket. Status: ${response.status}`);
      }

      setIsRatingModalOpen(false);
      setRating(5);
      setRatingComment("");
      await loadTicket();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setPendingClose(false);
      setIsSaving(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket || !canReply) return;

    if (isAgent) {
      await submitCloseTicket();
      return;
    }

    setIsRatingModalOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout
        title="Ticket Details"
        subtitle="Loading ticket..."
        action={
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back
          </button>
        }
      >
        <section className="p-6 text-sm text-slate-500">Loading...</section>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout
        title="Ticket Details"
        subtitle="Could not load ticket."
        action={
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back
          </button>
        }
      >
        <section className="p-6 text-sm text-rose-700">
          {error || "Ticket was not found."}
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Ticket Details"
      subtitle="View the full support request, customer and product details, and continue the conversation."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back
          </button>

          {isAgent && canReply ? (
            <>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                <span className="text-slate-500">Priority</span>
                <select
                  value={selectedPriority}
                  onChange={(e) =>
                    handlePriorityChange(e.target.value as TicketPriorityCode)
                  }
                  disabled={isSaving}
                  className={`rounded-full border-0 px-2 py-0.5 text-xs font-semibold outline-none ${priorityClass(selectedPriority)}`}
                >
                  {priorityOptions.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                <span className="text-slate-500">Status</span>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as TicketStatusCode)
                  }
                  disabled={
                    isSaving ||
                    ticket.statusCode === "resolved" ||
                    ticket.statusCode === "closed"
                  }
                  className={`rounded-full border-0 px-2 py-0.5 text-xs font-semibold outline-none ${statusClass(selectedStatus)}`}
                >
                  {agentStatusOptions.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(ticket.statusCode)}`}
          >
            {ticket.statusName}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass(ticket.priorityCode)}`}
          >
            {ticket.priorityName}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            #{ticket.ticketNumber}
          </span>

          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
            Viewer: {viewerType} {viewerName ? `• ${viewerName}` : ""}
          </span>
        </div>
      }
    >
      <section className="space-y-6 p-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="text-lg font-semibold text-slate-900">
                  Ticket summary
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Real ticket data from the API.
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="mb-4 text-base font-semibold text-slate-900">
                  Ticket info
                </div>
                <div className="space-y-4">
                  <ReceiptRow
                    label="Ticket ID"
                    value={`#${ticket.ticketNumber}`}
                  />
                  <ReceiptRow label="Status" value={ticket.statusName} />
                  <ReceiptRow label="Priority" value={ticket.priorityName} />
                  <ReceiptRow
                    label="Date created"
                    value={formatDateTime(ticket.createdAt)}
                  />
                  <ReceiptRow
                    label="Assigned agent"
                    value={ticket.assignedAgentName || "—"}
                  />
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="mb-4 text-base font-semibold text-slate-900">
                  Customer info
                </div>
                <div className="space-y-4">
                  <ReceiptRow label="Full name" value={ticket.customerName} />
                  <ReceiptRow
                    label="Email address"
                    value={ticket.customerEmail}
                  />
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="mb-4 text-base font-semibold text-slate-900">
                  Product info
                </div>

                <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                    {ticket.productImageUrl ? (
                      <img
                        src={ticket.productImageUrl}
                        alt={ticket.productName}
                        className="h-full w-full rounded-[24px] object-cover"
                      />
                    ) : (
                      "No image"
                    )}
                  </div>

                  <div className="space-y-4">
                    <ReceiptRow
                      label="Product"
                      value={ticket.productName || "—"}
                    />
                    <ReceiptRow
                      label="Category"
                      value={ticket.productCategory || "—"}
                    />
                    <ReceiptRow
                      label="Price"
                      value={
                        ticket.productPrice == null
                          ? "—"
                          : `$${ticket.productPrice}`
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="mb-4 text-base font-semibold text-slate-900">
                  Issue details
                </div>

                <div className="space-y-4">
                  <ReceiptRow label="Subject" value={ticket.subject} />
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
                  Saved thread for this ticket.
                </div>
              </div>

              <div className="max-h-[430px] space-y-4 overflow-y-auto px-6 py-5">
                {allMessages.length === 0 ? (
                  <div className="text-sm text-slate-500">No messages yet.</div>
                ) : (
                  allMessages.map((reply) => {
                    const replyIsViewer = reply.senderUserId === viewerUserId;

                    return (
                      <div
                        key={reply.id}
                        className={`flex ${replyIsViewer ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-[24px] px-4 py-3 shadow-sm ${
                            replyIsViewer
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-slate-50 text-slate-900"
                          }`}
                        >
                          <div
                            className={`text-xs font-semibold ${
                              replyIsViewer
                                ? "text-slate-200"
                                : "text-slate-500"
                            }`}
                          >
                            {reply.authorName} • {reply.authorType}
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
                            {reply.message}
                          </div>
                          <div
                            className={`mt-3 text-xs ${
                              replyIsViewer
                                ? "text-slate-300"
                                : "text-slate-400"
                            }`}
                          >
                            {formatDateTime(reply.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {canReply ? (
                <div className="border-t border-slate-200 px-6 py-5">
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-slate-700">
                      Write reply
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isAgent
                          ? "Type your reply to the customer..."
                          : "Type your reply to the agent..."
                      }
                      rows={5}
                      disabled={
                        isSaving ||
                        ticket.statusCode === "resolved" ||
                        ticket.statusCode === "closed"
                      }
                      className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleCloseTicket}
                      disabled={
                        isSaving ||
                        !canReply ||
                        ticket.statusCode === "resolved" ||
                        ticket.statusCode === "closed"
                      }
                      className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAgent ? "Close ticket" : "Resolve & rate"}
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitReply}
                      disabled={
                        isSaving ||
                        replyText.trim() === "" ||
                        ticket.statusCode === "resolved" ||
                        ticket.statusCode === "closed"
                      }
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Submit reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200 px-6 py-5 text-sm text-slate-500">
                  Read-only view. Reply is enabled only when entering as a real
                  customer or agent context.
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-700">
                Ticket actions
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-500">
                Agent reply should move the ticket to{" "}
                <span className="font-medium">Waiting Customer</span>. Customer
                reply should move it to{" "}
                <span className="font-medium">In Progress</span>. Agent close
                means <span className="font-medium">Closed</span>. Customer
                close means <span className="font-medium">Resolved</span> with
                rating.
              </div>
            </div>
          </div>
        </div>
      </section>

      {isRatingModalOpen && !isAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-slate-900">
                Rate your support experience
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Thanks for choosing{" "}
                <span className="font-medium text-slate-700">Agilite</span>.
                Before we mark this ticket as resolved, how was your experience?
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`text-4xl transition ${
                    value <= rating ? "text-amber-400" : "text-slate-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Optional comment..."
              rows={4}
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(false)}
                disabled={pendingClose}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitCloseTicket}
                disabled={pendingClose}
                className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {pendingClose ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <AppLayot title={title} subtitle={subtitle} action={action}>
      {children}
    </AppLayot>
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
