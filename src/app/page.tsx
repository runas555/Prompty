"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AgentCard, { Agent } from "@/components/AgentCard";
import DetailModal from "@/components/DetailModal";
import AuthModal from "@/components/AuthModal";
import PostModal from "@/components/PostModal";
import BioModal from "@/components/BioModal";
import { AlertCircle, Terminal, Search } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Сессия
  const [user, setUser] = useState<{ id: string; username: string; bio: string } | null>(null);

  // Модальные окна
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);

  // Активные объекты
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [activeCategory]);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/agents?category=${activeCategory}`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Ошибка загрузки ленты");
      }
    } catch (err) {
      setError("Не удалось соединиться с сервером базы данных.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Выйти из аккаунта?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      fetchFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAgent = async (name: string, prompt: string, category: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? `/api/agents/${editingAgent.id}` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt, category })
      });

      if (res.ok) {
        await fetchFeed();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleRestoreVersion = async (promptText: string): Promise<boolean> => {
    if (!activeAgent) return false;
    try {
      const res = await fetch(`/api/agents/${activeAgent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeAgent.name,
          prompt: promptText,
          category: activeAgent.category
        })
      });

      if (res.ok) {
        await fetchFeed();
        // Обновляем локально активного агента
        setActiveAgent({
          ...activeAgent,
          prompt: promptText,
          version: activeAgent.version + 1
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Вы уверены, что хотите удалить публикацию?")) return;
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

  const handleLikeToggle = async (agentId: string, currentLikeStatus: boolean) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    // Оптимистичное обновление UI
    setAgents(prevAgents =>
      prevAgents.map(a => {
        if (a.id === agentId) {
          return {
            ...a,
            hasLiked: !currentLikeStatus,
            likeCount: currentLikeStatus ? a.likeCount - 1 : a.likeCount + 1
          };
        }
        return a;
      })
    );

    try {
      const method = currentLikeStatus ? "DELETE" : "POST";
      await fetch(`/api/agents/${agentId}/like`, { method });
    } catch (err) {
      console.error("Ошибка синхронизации лайка:", err);
    }
  };

  const handleSaveBio = async (bioText: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioText })
      });

      if (res.ok && user) {
        setUser({ ...user, bio: bioText.trim() });
        fetchFeed();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.prompt.toLowerCase().includes(q) ||
      agent.username.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        user={user}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingAgent(null);
          setIsPostOpen(true);
        }}
        onOpenBioModal={() => setIsBioOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Боковая панель меню */}
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
        />

        {/* Главная лента */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Панель поиска по сообществу */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск промптов по роли ИИ, тексту или автору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
            />
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 4].map(i => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 h-[360px] animate-pulse" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl p-8 max-w-lg mx-auto">
              <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                <Terminal className="h-7 w-7 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">
                {searchQuery ? "Совпадений не найдено" : "Категория пуста"}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {searchQuery ? "Попробуйте изменить поисковые слова." : "Будьте первым промптером в данной теме!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  currentUser={user}
                  highlightText={searchQuery}
                  onEdit={(a) => {
                    setEditingAgent(a);
                    setIsPostOpen(true);
                  }}
                  onOpenHistory={(a) => {
                    setActiveAgent(a);
                    setIsDetailOpen(true);
                  }}
                  onDelete={handleDeleteAgent}
                  onLikeToggle={handleLikeToggle}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Модальные окна */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(userData) => {
          setUser({ ...userData, bio: "" });
          checkSession();
        }}
      />

      <PostModal
        isOpen={isPostOpen}
        onClose={() => {
          setIsPostOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
        agent={editingAgent}
      />

      <DetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActiveAgent(null);
        }}
        agent={activeAgent}
        currentUser={user}
        onRestore={handleRestoreVersion}
        onTriggerLogin={() => {
          setIsDetailOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <BioModal
        isOpen={isBioOpen}
        onClose={() => setIsBioOpen(false)}
        onSave={handleSaveBio}
        currentBio={user ? user.bio : ""}
      />
    </div>
  );
}