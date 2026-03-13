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
import { useTheme } from "../../theme/theme-provider";
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


const initialMessages: ChatMessage[] = [];

function getCurrentTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMessageContainerClass(role: MessageRole, isLightTheme: boolean) {
  if (isLightTheme) {
    if (role === "assistant") {
      return "border-emerald-200 bg-emerald-50";
    }

    if (role === "system") {
      return "border-[#cad5cc] bg-[#edf2ed]";
    }

    return "border-[#c4d1c6] bg-[#d9e4db]";
  }

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
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
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

  const topStatusBadgeClass = isLightTheme
    ? "rounded-full border border-[#bdd0c0] bg-[#dce8de] px-3 py-1 text-[#2a3a2d]"
    : "rounded-full px-3 py-1";
  const workspaceBadgeClass = isLightTheme
    ? "rounded-full border border-[#c3d2c6] bg-[#dfe9e1] px-3 py-1 text-xs text-[#314033]"
    : "rounded-full px-3 py-1 text-xs";
  const onlineBadgeClass = isLightTheme
    ? "rounded-full border border-[#b9d9c7] bg-[#e0f1e8] px-3 py-1 text-xs text-[#1d6b45]"
    : "rounded-full px-3 py-1 text-xs";
  const outlineButtonClass = isLightTheme
    ? "rounded-2xl border-[#bfd0c2] bg-[#f7faf7] text-[#1d2a20] hover:bg-[#edf3ee]"
    : "rounded-2xl";
  const primaryButtonClass = isLightTheme
    ? "rounded-2xl border-[#6d7d71] bg-[#6f7f73] text-white hover:bg-[#647266]"
    : "rounded-2xl";
  const statCardClass = isLightTheme
    ? "rounded-3xl border-[#cad7cf] bg-[#f7faf7]/95 text-slate-900 shadow-[0_16px_36px_rgba(124,145,130,0.10)]"
    : "rounded-3xl border-slate-700 bg-slate-800/80 text-slate-50";
  const statLabelClass = isLightTheme
    ? "mb-3 flex items-center gap-2 text-sm text-[#667566]"
    : "mb-3 flex items-center gap-2 text-sm text-slate-300";
  const shellCardClass = isLightTheme
    ? "overflow-hidden rounded-3xl border-[#cad7cf] bg-[#eef4ef]/95 text-slate-900 shadow-[0_18px_42px_rgba(124,145,130,0.12)]"
    : "overflow-hidden rounded-3xl border-slate-700 bg-slate-800/95 text-slate-50 shadow-sm";
  const shellHeaderClass = isLightTheme
    ? "border-b border-[#cad7cf] bg-[#e8efe9] px-6 py-5"
    : "border-b border-slate-700 bg-slate-800 px-6 py-5";
  const shellDescriptionClass = isLightTheme
    ? "max-w-2xl text-[#617062]"
    : "max-w-2xl text-slate-300";
  const transcriptAreaClass = isLightTheme
    ? "h-[560px] overflow-y-auto bg-[#f8fbf8] px-6 py-6"
    : "h-[560px] overflow-y-auto px-6 py-6";
  const botAvatarClass = isLightTheme
    ? "mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#c9d4cb] bg-[#eff4ef]"
    : "mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900";
  const userAvatarClass = isLightTheme
    ? "mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#c3d0c5] bg-[#dce6dd] text-[#203025]"
    : "mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-100 text-zinc-900";
  const composerShellClass = isLightTheme
    ? "border-t border-[#cad7cf] bg-[#e8efe9] px-6 py-5"
    : "border-t border-slate-700 bg-slate-800/90 px-6 py-5";
  const composerPanelClass = isLightTheme
    ? "rounded-3xl border border-[#c7d4c9] bg-[#f8fbf8] p-3 shadow-[0_12px_28px_rgba(128,147,132,0.10)]"
    : "rounded-3xl border border-slate-700 bg-zinc-950/95 p-3";
  const textareaClass = isLightTheme
    ? "min-h-[112px] resize-none border-0 bg-transparent px-1 py-1 text-[#152117] placeholder:text-[#70806f] shadow-none focus-visible:ring-0 disabled:opacity-60"
    : "min-h-[112px] resize-none border-0 bg-transparent px-1 py-1 text-zinc-100 shadow-none focus-visible:ring-0 disabled:opacity-60";
  const composerDividerClass = isLightTheme
    ? "mt-3 flex flex-col gap-3 border-t border-[#d5ded6] pt-3 sm:flex-row sm:items-center sm:justify-between"
    : "mt-3 flex flex-col gap-3 border-t border-zinc-800 pt-3 sm:flex-row sm:items-center sm:justify-between";
  const ghostIconButtonClass = isLightTheme
    ? "rounded-2xl border border-transparent text-[#5c6b5d] hover:bg-[#ebf1ec]"
    : "rounded-2xl";
  const knowledgeInputClass = isLightTheme
    ? "h-9 max-w-xs rounded-2xl border-[#c7d4c9] bg-[#e5ece6] text-xs text-[#5d6b5d]"
    : "h-9 max-w-xs rounded-2xl border-zinc-700 bg-zinc-950 text-xs text-zinc-400";
  const thinkingBubbleClass = isLightTheme
    ? "max-w-[82%] rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm"
    : "max-w-[82%] rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 shadow-sm";
  const messageTextClass = isLightTheme
    ? "text-sm leading-6 text-[#1d2a20]"
    : "text-sm leading-6 text-zinc-200";
  const messageMetaClass = isLightTheme ? "text-xs text-[#6a786a]" : "text-xs text-zinc-400";
  const iconTintClass = isLightTheme ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-emerald-300";
  const sendingRowTextClass = isLightTheme
    ? "flex items-center gap-2 text-sm text-[#1d2a20]"
    : "flex items-center gap-2 text-sm text-zinc-200";

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
          <Badge variant="success" className={topStatusBadgeClass}>
            {isSending ? "Waiting for reply" : "Live assistant"}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsTicketPanelOpen(true)}
            className={outlineButtonClass}
          >
            Create ticket
          </Button>
          <Button className={primaryButtonClass}>
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
              <Card key={item.label} className={statCardClass}>
                <CardContent className="p-5 pt-5">
                  <div className={statLabelClass}>
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
          <Card className={shellCardClass}>
            <CardHeader className={shellHeaderClass}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={workspaceBadgeClass}>
                      AI Support Workspace
                    </Badge>
                    <Badge variant="info" className={onlineBadgeClass}>
                      {isSending ? "Busy" : "Online"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-semibold tracking-tight">
                    Customer conversation
                  </CardTitle>
                  <CardDescription className={shellDescriptionClass}>
                    A focused support screen for guided troubleshooting, customer context,
                    and backend-driven model responses.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" className={outlineButtonClass}>
                    Save summary
                  </Button>
                  <Button className={primaryButtonClass}>
                    Share with agent
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="grid min-h-[720px] grid-rows-[1fr_auto]">
                <div className={transcriptAreaClass}>
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
                            <div className={botAvatarClass}>
                              {isSystem ? (
                                <span
                                  className={
                                    isLightTheme
                                      ? "text-xs font-semibold text-[#506050]"
                                      : "text-xs font-semibold text-zinc-300"
                                  }
                                >
                                  S
                                </span>
                              ) : (
                                <Bot className={iconTintClass} />
                              )}
                            </div>
                          )}

                          <div
                            className={`max-w-[82%] rounded-3xl border px-4 py-3 shadow-sm ${getMessageContainerClass(message.role, isLightTheme)}`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-sm font-medium">{message.author}</span>
                              <span className={messageMetaClass}>{message.time}</span>
                            </div>
                            <p className={messageTextClass}>
                              {message.text}
                            </p>
                          </div>

                          {isUser && (
                            <div className={userAvatarClass}>
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isSending && (
                      <div className="flex gap-3 justify-start">
                        <div className={botAvatarClass}>
                          <Bot className={iconTintClass} />
                        </div>

                        <div className={thinkingBubbleClass}>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-sm font-medium">Agilite Support AI</span>
                            <span className={messageMetaClass}>{getCurrentTimeLabel()}</span>
                          </div>
                          <div className={sendingRowTextClass}>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking...
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className={composerShellClass}>
                  <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                    <div className={composerPanelClass}>
                      <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder="Write a support message..."
                        disabled={isSending}
                        className={textareaClass}
                      />

                      <div className={composerDividerClass}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={ghostIconButtonClass}
                            disabled={isSending}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Input
                            value="Knowledge base + product context enabled"
                            readOnly
                            className={knowledgeInputClass}
                          />
                        </div>

                        <Button
                          onClick={() => void handleSend()}
                          className={`${primaryButtonClass} px-5`}
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
