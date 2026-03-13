import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Bot,
  Clock3,
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

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    author: "Agilite Support AI",
    text: "Hello Nadav, I can help with troubleshooting, policy questions, and converting this conversation into a support ticket when needed.",
    time: "09:41",
  },
  {
    id: 2,
    role: "system",
    author: "System",
    text: "Conversation context loaded: customer profile, last 3 tickets, and active product registrations.",
    time: "09:41",
  },
  {
    id: 3,
    role: "user",
    author: "You",
    text: "My oven keeps stopping after 5 minutes. Can you help me understand if this is a known issue?",
    time: "09:42",
  },
  {
    id: 4,
    role: "assistant",
    author: "Agilite Support AI",
    text: "Yes. I can guide you through a quick diagnosis first, then open a ticket with the relevant product details if needed. Let us start with the model and any error indicator you see.",
    time: "09:42",
  },
];

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

export default function ChatSupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const stats = [
    { label: "Session status", value: "Live", icon: ShieldCheck },
    { label: "Model", value: "gpt-4o-mini", icon: Sparkles },
    { label: "Avg. reply", value: "12 sec", icon: Clock3 },
    { label: "Messages", value: String(messages.length), icon: MessageSquareText },
  ];

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const userMessageTime = getCurrentTimeLabel();
    const nextId = messages.length + 1;

    setMessages((current) => [
      ...current,
      {
        id: nextId,
        role: "user",
        author: "You",
        text: trimmed,
        time: userMessageTime,
      },
      {
        id: nextId + 1,
        role: "assistant",
        author: "Agilite Support AI",
        text: "Mock response: this composer is now wired into the app shell and ready for a future backend/chat streaming integration.",
        time: getCurrentTimeLabel(),
      },
    ]);

    setInput("");
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayot
      title="Chat Support"
      subtitle="AI-assisted customer conversations with quick triage, context panels, and ticket conversion."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="rounded-full px-3 py-1">
            Live assistant
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
                      Online
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-semibold tracking-tight">
                    Customer conversation
                  </CardTitle>
                  <CardDescription className="max-w-2xl">
                    A focused support screen for guided troubleshooting, customer context,
                    and future streaming model responses.
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
                        className="min-h-[112px] resize-none border-0 bg-transparent px-1 py-1 text-zinc-100 shadow-none focus-visible:ring-0"
                      />

                      <div className="mt-3 flex flex-col gap-3 border-t border-zinc-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="rounded-2xl">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Input
                            value="Knowledge base + product context enabled"
                            readOnly
                            className="h-9 max-w-xs rounded-2xl border-zinc-700 bg-zinc-950 text-xs text-zinc-400"
                          />
                        </div>

                        <Button onClick={handleSend} className="rounded-2xl px-5">
                          <SendHorizontal className="mr-2 h-4 w-4" />
                          Send message
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Session summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {stats.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                      >
                        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{item.label}</span>
                        </div>
                        <p className="text-lg font-semibold tracking-tight">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Customer context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <p className="font-medium">Nadav Hadar</p>
                  <p className="mt-1 text-muted-foreground">nadav@example.com</p>
                  <p className="mt-3 text-muted-foreground">
                    Registered products: 4
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Last ticket: TK-2048 - Resolved 6 days ago
                  </p>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Suggested actions
                  </p>

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start rounded-2xl">
                      Ask for product serial number
                    </Button>
                    <Button variant="outline" className="w-full justify-start rounded-2xl">
                      Surface warranty policy
                    </Button>
                    <Button variant="outline" className="w-full justify-start rounded-2xl">
                      Offer troubleshooting checklist
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-2xl"
                      onClick={() => setIsTicketPanelOpen(true)}
                    >
                      Convert chat into ticket
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Knowledge hints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  Recent issue pattern detected for heating devices after firmware 2.1.4.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  Similar cases were solved by verifying thermal lock status and power stability.
                </div>
              </CardContent>
            </Card>
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
