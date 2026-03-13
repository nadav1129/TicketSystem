import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Bot,
  Clock3,
  Loader2,
  MessageSquareText,
  Paperclip,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";

type MessageRole = "assistant" | "user" | "system";

type ChatMessage = {
  id: number;
  role: MessageRole;
  author: string;
  text: string;
  time: string;
};

type ChatAskResponse = {
  question: string;
  intent: string;
  answer: string;
  data?: unknown;
  success: boolean;
  error?: string | null;
};

const CHAT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

const initialMessages: ChatMessage[] = [];

function getCurrentTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMessageContainerClass(role: MessageRole) {
  if (role === "assistant") {
    return "border-emerald-500/20 bg-emerald-500/10";
  }

  if (role === "system") {
    return "border-zinc-700 bg-zinc-900/80";
  }

  return "border-zinc-700 bg-zinc-950";
}

async function askChat(question: string): Promise<ChatAskResponse> {
  const response = await fetch("http://localhost:8080/api/chat/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  let payload: ChatAskResponse | null = null;

  try {
    payload = (await response.json()) as ChatAskResponse;
  } catch {
    throw new Error("Chat service returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to send chat message.");
  }

  if (!payload.success) {
    throw new Error(payload.error || "Chat service could not process the request.");
  }

  return payload;
}

export default function ChatSupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  const stats = [
    { label: "Session status", value: isSending ? "Thinking" : "Live", icon: ShieldCheck },
    { label: "Model", value: "Prompt API", icon: Sparkles },
    { label: "Avg. reply", value: "API based", icon: Clock3 },
    { label: "Messages", value: String(messages.length), icon: MessageSquareText },
  ];

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessageId = Date.now();
    const userMessageTime = getCurrentTimeLabel();

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        author: "You",
        text: trimmed,
        time: userMessageTime,
      },
    ]);

    setInput("");
    setIsSending(true);

    try {
      const result = await askChat(trimmed);

      setMessages((current) => [
        ...current,
        {
          id: userMessageId + 1,
          role: "assistant",
          author: "Agilite Support AI",
          text: result.answer,
          time: getCurrentTimeLabel(),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while contacting the chat service.";

      setMessages((current) => [
        ...current,
        {
          id: userMessageId + 1,
          role: "system",
          author: "System",
          text: message,
          time: getCurrentTimeLabel(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <AppLayot
      title="Chat Support"
      subtitle="AI-assisted customer conversations with quick triage, context panels, and ticket conversion."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="rounded-full px-3 py-1">
            {isSending ? "Waiting for reply" : "Live assistant"}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsTicketPanelOpen(true)}
            className="rounded-2xl"
          >
            Create ticket
          </Button>
          <Button className="rounded-2xl">
            Escalate to agent
          </Button>
        </div>
      }
    >
      <section className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="rounded-3xl border-slate-200">
                <CardContent className="p-5 pt-5">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight">
                    {item.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.65fr_0.75fr]">
          <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50/40 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                      AI Support Workspace
                    </Badge>
                    <Badge variant="info" className="rounded-full px-3 py-1 text-xs">
                      {isSending ? "Busy" : "Online"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-semibold tracking-tight">
                    Customer conversation
                  </CardTitle>
                  <CardDescription className="max-w-2xl">
                    A focused support screen for guided troubleshooting, customer context,
                    and backend-driven model responses.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-2xl">
                    Save summary
                  </Button>
                  <Button className="rounded-2xl">
                    Share with agent
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="grid min-h-[720px] grid-rows-[1fr_auto]">
                <div className="h-[560px] overflow-y-auto px-6 py-6">
                  <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                    {messages.map((message) => {
                      const isUser = message.role === "user";
                      const isSystem = message.role === "system";

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
                              {isSystem ? (
                                <span className="text-xs font-semibold text-zinc-300">S</span>
                              ) : (
                                <Bot className="h-4 w-4 text-emerald-300" />
                              )}
                            </div>
                          )}

                          <div
                            className={`max-w-[82%] rounded-3xl border px-4 py-3 shadow-sm ${getMessageContainerClass(message.role)}`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-sm font-medium">{message.author}</span>
                              <span className="text-xs text-zinc-400">{message.time}</span>
                            </div>
                            <p className="text-sm leading-6 text-zinc-200">
                              {message.text}
                            </p>
                          </div>

                          {isUser && (
                            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-100 text-zinc-900">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isSending && (
                      <div className="flex gap-3 justify-start">
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
                          <Bot className="h-4 w-4 text-emerald-300" />
                        </div>

                        <div className="max-w-[82%] rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 shadow-sm">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-sm font-medium">Agilite Support AI</span>
                            <span className="text-xs text-zinc-400">{getCurrentTimeLabel()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-zinc-200">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking...
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-5">
                  <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                    <div className="rounded-3xl border border-slate-200 bg-zinc-900 p-3">
                      <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder="Write a support message..."
                        disabled={isSending}
                        className="min-h-[112px] resize-none border-0 bg-transparent px-1 py-1 text-zinc-100 shadow-none focus-visible:ring-0 disabled:opacity-60"
                      />

                      <div className="mt-3 flex flex-col gap-3 border-t border-zinc-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="rounded-2xl" disabled={isSending}>
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Input
                            value="Knowledge base + product context enabled"
                            readOnly
                            className="h-9 max-w-xs rounded-2xl border-zinc-700 bg-zinc-950 text-xs text-zinc-400"
                          />
                        </div>

                        <Button
                          onClick={() => void handleSend()}
                          className="rounded-2xl px-5"
                          disabled={isSending}
                        >
                          {isSending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <SendHorizontal className="mr-2 h-4 w-4" />
                          )}
                          {isSending ? "Sending..." : "Send message"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {/* keep your right column as-is */}
          </div>
        </div>
      </section>

      {isTicketPanelOpen && (
        <TicketSubmitionPannel
          open={isTicketPanelOpen}
          onClose={() => setIsTicketPanelOpen(false)}
        />
      )}
    </AppLayot>
  );
}