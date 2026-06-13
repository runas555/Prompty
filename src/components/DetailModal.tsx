import React, { useState, useEffect } from "react";
import { useLanguage, getLocalizedName } from "@/lib/i18n";
import { X, History, MessageSquare, Copy, Check, Clock, Send, Sparkles } from "lucide-react";
import { formatDateTime, getUserGradient } from "@/lib/utils";
import { Agent } from "./AgentCard";

interface Version {
  id: string;
  prompt: string;
  version: number;
  createdAt: number;
}

interface Comment {
  id: string;
  text: string;
  promptVersion: number;
  createdAt: number;
  username: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  currentUser: { id: string; username: string } | null;
  onRestore: (promptText: string) => Promise<boolean>;
  onTriggerLogin: () => void;
}

export default function DetailModal({
  isOpen,
  onClose,
  agent,
  currentUser,
  onRestore,
  onTriggerLogin
}: DetailModalProps) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<"read" | "versions" | "comments">("read");
  const [versions, setVersions] = useState<Version[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && agent) {
      setTab("read");
      fetchVersions();
      fetchComments();
    }
  }, [isOpen, agent]);

  const fetchVersions = async () => {
    if (!agent) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchComments = async () => {
    if (!agent) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  if (!isOpen || !agent) return null;

  const handleCopy = async (promptText: string, verId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = promptText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(verId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onTriggerLogin();
      return;
    }
    if (!commentText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentText,
          promptVersion: agent.version
        })
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (promptText: string) => {
    setActionLoading(true);
    try {
      const success = await onRestore(promptText);
      if (success) {
        await fetchVersions();
        setTab("read");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden shadow-2xl z-10 flex flex-col bottom-0 sm:bottom-auto absolute sm:relative">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${getUserGradient(agent.username)} flex items-center justify-center text-[10px] text-slate-950 font-bold uppercase shrink-0`}>
              {agent.username.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 truncate max-w-lg">{getLocalizedName(agent.name, language)}</h2>
              <p className="text-xs text-slate-500">Автор: @{agent.username} &bull; Версия v{agent.version}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Табы */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          <button
            onClick={() => setTab("read")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "read" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("detailInstruction")}
          </button>
          <button
            onClick={() => setTab("versions")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "versions" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("detailHistory")} ({versions.length})
          </button>
          <button
            onClick={() => setTab("comments")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "comments" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("detailDiscussion")} ({comments.length})
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-950/20">
          
          {/* TAB 1: Просмотр и быстрое копирование */}
          {tab === "read" && (
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("detailCurrentPrompt")}</span>
                <button
                  onClick={() => handleCopy(agent.prompt, "current")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    copiedId === "current" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {copiedId === "current" ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === "current" ? t("detailCopied") : t("detailCopyPrompt")}</span>
                </button>
              </div>
              <div className="flex-1 bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-sm text-slate-200 leading-relaxed overflow-y-auto select-text min-h-80 max-h-96">
                <p className="whitespace-pre-wrap select-text">{agent.prompt}</p>
              </div>
            </div>
          )}

          {/* TAB 2: История версий промпта */}
          {tab === "versions" && (
            <div className="flex flex-col gap-4">
              {loadingVersions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500" />
                  <p className="text-xs text-slate-500">{t("detailLoadingHistory")}</p>
                </div>
              ) : (
                versions.map((ver, idx) => (
                  <div key={ver.id} className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-indigo-400">
                          v{ver.version} {idx === 0 && "(" + t("detailActualVersion") + ")"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(ver.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(ver.prompt, ver.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            copiedId === ver.id ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {copiedId === ver.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>Копировать</span>
                        </button>
                        
                        {idx !== 0 && currentUser?.id === agent.userId && (
                          <button
                            onClick={() => handleRestore(ver.prompt)}
                            disabled={actionLoading}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            {t("detailRestore")}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 border border-slate-900 max-h-40 overflow-y-auto leading-relaxed select-text">
                      <p className="whitespace-pre-wrap select-text">{ver.prompt}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Комментарии и отзывы соцсети */}
          {tab === "comments" && (
            <div className="flex flex-col gap-6">
              {/* Форма ввода комментария */}
              <form onSubmit={handleAddComment} className="flex flex-col gap-3">
                <textarea
                  placeholder={currentUser ? t("detailCommentPlaceholderUser") : t("detailCommentPlaceholderGuest")}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser || actionLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">{t("detailCommentVersionBind")} v{agent.version}</span>
                  {currentUser ? (
                    <button
                      type="submit"
                      disabled={actionLoading || !commentText.trim()}
                      className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {t("detailSend")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onTriggerLogin}
                      className="text-xs text-indigo-400 font-semibold hover:underline"
                    >
                      {t("detailToCommentLogin")}
                    </button>
                  )}
                </div>
              </form>

              {/* Лента обсуждения */}
              <div className="flex flex-col gap-4 border-t border-slate-800/60 pt-5">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500/30 border-t-indigo-500" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-xs text-slate-500">{t("detailNoComments")}</p>
                ) : (
                  comments.map(comm => (
                    <div key={comm.id} className="flex gap-3 bg-slate-900/20 border border-slate-850 p-4 rounded-xl items-start">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${getUserGradient(comm.username)} flex items-center justify-center text-[10px] text-slate-950 font-extrabold uppercase shrink-0`}>
                        {comm.username.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">@{comm.username}</span>
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-900/80 border border-slate-800 px-1.5 py-0.5 rounded">
                              к версии v{comm.promptVersion}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{formatDateTime(comm.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed break-words">{comm.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}