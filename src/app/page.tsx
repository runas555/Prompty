"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AgentCard, { Agent } from "@/components/AgentCard";
import AgentModal from "@/components/AgentModal";
import HistoryModal from "@/components/HistoryModal";
import { Terminal, Key, User, Lock, AlertCircle, Sparkles } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Состояние авторизации
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Состояния модалок
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistoryAgent, setActiveHistoryAgent] = useState<{ id: string; name: string } | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          fetchAgents();
          return;
        }
      }
      setUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Не удалось загрузить данные");
      }
    } catch (err: any) {
      setError("Ошибка соединения с API базы данных.");
    } finally {
      setLoading(false);
    }
  };

  // Метод входа и регистрации
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Заполните имя пользователя и пароль");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });

      const data = await res.json();

      if (res.ok) {
        if (authMode === "login") {
          setUser(data.user);
          setAuthUsername("");
          setAuthPassword("");
          fetchAgents();
        } else {
          // После успешной регистрации переключаем во вход
          alert("Регистрация успешна! Теперь вы можете войти.");
          setAuthMode("login");
          setAuthPassword("");
        }
      } else {
        setAuthError(data.error || "Произошла ошибка авторизации");
      }
    } catch (err) {
      setAuthError("Ошибка отправки запроса.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Вы уверены, что хотите выйти из аккаунта?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setAgents([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAgent = async (name: string, prompt: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? `/api/agents/${editingAgent.id}` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleRestoreVersion = async (promptText: string): Promise<boolean> => {
    if (!activeHistoryAgent) return false;
    try {
      const currentAgent = agents.find(a => a.id === activeHistoryAgent.id);
      if (!currentAgent) return false;

      const res = await fetch(`/api/agents/${activeHistoryAgent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentAgent.name, prompt: promptText })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Вы уверены, что хотите полностью удалить агента и всю историю изменений?")) return;
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (res.ok) {
        setAgents(agents.filter(a => a.id !== agentId));
      } else {
        const errData = await res.json();
        alert(errData.error || "Ошибка удаления");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.prompt.toLowerCase().includes(q)
    );
  });

  // ЭКРАН 1: Ожидание сессии
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500/30 border-t-cyan-500" />
        <p className="text-sm text-slate-500">Авторизация сессии...</p>
      </div>
    );
  }

  // ЭКРАН 2: Форма Входа и Регистрации
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -inset-px bg-gradient-to-tr from-cyan-500/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center mb-6 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 mb-4">
              <Terminal className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              {authMode === "login" ? "Вход в PromptHistorian" : "Создать аккаунт"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Управление версиями ваших персональных системных промптов
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10">
            {authError && (
              <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Имя пользователя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Введите никнейм"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  disabled={authLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={authLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-cyan-500/10 active:scale-95 transition-all duration-200"
            >
              {authLoading ? "Пожалуйста, подождите..." : authMode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs relative z-10">
            {authMode === "login" ? (
              <p className="text-slate-500">
                Впервые здесь?{" "}
                <button 
                  onClick={() => { setAuthMode("register"); setAuthError(""); }} 
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  Создать профиль
                </button>
              </p>
            ) : (
              <p className="text-slate-500">
                Уже зарегистрированы?{" "}
                <button 
                  onClick={() => { setAuthMode("login"); setAuthError(""); }} 
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  Войти в аккаунт
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН 3: Основная рабочая среда авторизованного пользователя
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        username={user.username}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingAgent(null);
          setIsAddOpen(true);
        }}
        totalAgents={agents.length}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300 mb-6 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-[340px] flex flex-col justify-between animate-pulse">
                <div>
                  <div className="h-5 w-1/2 bg-slate-800 rounded-lg mb-3" />
                  <div className="h-4 w-1/4 bg-slate-800 rounded-lg mb-4" />
                  <div className="h-40 bg-slate-950 rounded-lg border border-slate-900" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl max-w-xl mx-auto p-8 animate-fadeIn">
            <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <Terminal className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchQuery ? "Ничего не найдено" : "Ваш список агентов пуст"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2">
              {searchQuery
                ? "Попробуйте изменить поисковый запрос."
                : "Здесь будут отображаться ваши личные агенты. Создайте первого!"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsAddOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95 border border-slate-700"
              >
                Создать агента
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                highlightText={searchQuery}
                onEdit={(a) => {
                  setEditingAgent(a);
                  setIsAddOpen(true);
                }}
                onOpenHistory={(id) => {
                  setActiveHistoryAgent({ id, name: agent.name });
                  setIsHistoryOpen(true);
                }}
                onDelete={handleDeleteAgent}
              />
            ))}
          </div>
        )}
      </main>

      <AgentModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
        agent={editingAgent}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setActiveHistoryAgent(null);
        }}
        agentId={activeHistoryAgent ? activeHistoryAgent.id : null}
        agentName={activeHistoryAgent ? activeHistoryAgent.name : ""}
        onRestore={handleRestoreVersion}
      />

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 font-medium">
        <p>PromptHistorian &bull; Личное хранилище системных промптов.</p>
      </footer>
    </div>
  );
}