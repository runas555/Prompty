"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar, { CATEGORIES } from "@/components/Sidebar";
import AgentCard, { Agent } from "@/components/AgentCard";
import DetailModal from "@/components/DetailModal";
import AuthModal from "@/components/AuthModal";
import PostModal from "@/components/PostModal";
import ProfileModal from "@/components/ProfileModal";
import { AlertCircle, Terminal, Search, Compass, User, Settings, LogOut, PlusCircle } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeModel, setActiveModel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Сессионные данные
  const [user, setUser] = useState<{ id: string; username: string; bio: string; avatar: string } | null>(null);

  // Навигация для мобильных платформ
  const [mobileTab, setMobileTab] = useState<"feed" | "categories" | "search" | "profile">("feed");

  // Табы ленты (для desktop и mobile)
  const [feedMode, setFeedMode] = useState<"all" | "my" | "liked">("all");

  // Модальные окна
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Активные объекты
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [activeCategory, activeModel, feedMode, user]);

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
    } finally {
      fetchFeed();
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    setError("");
    try {
      // Строим query-параметры на основе выбранной вкладки (All / My / Liked)
      let queryUrl = `/api/agents?category=${activeCategory}&model=${activeModel}`;
      if (feedMode === "my" && user) {
        queryUrl += `&authorId=${user.id}`;
      } else if (feedMode === "liked" && user) {
        queryUrl += `&likedBy=${user.id}`;
      }

      const res = await fetch(queryUrl);
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
      setFeedMode("all");
      fetchFeed();
      setMobileTab("feed");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAgent = async (name: string, prompt: string, category: string, model: string, tags: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? `/api/agents/${editingAgent.id}` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt, category, model, tags })
      });

      if (res.ok) {
        await fetchFeed();
        setMobileTab("feed");
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
          category: activeAgent.category,
          model: activeAgent.model,
          tags: activeAgent.tags
        })
      });

      if (res.ok) {
        await fetchFeed();
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

  const handleSaveProfile = async (bioText: string, avatarBase64: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioText, avatar: avatarBase64 })
      });

      if (res.ok && user) {
        setUser({ ...user, bio: bioText.trim(), avatar: avatarBase64 });
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
      agent.username.toLowerCase().includes(q) ||
      agent.tags.toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setEditingAgent(null);
      setIsPostOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-20 md:pb-0">
      <Header
        user={user}
        onLoginClick={() => setIsAuthOpen(true)}
        onOpenAddModal={handleOpenAddModal}
        totalAgents={agents.length}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
        <Sidebar onSettingsClick={() => setIsProfileOpen(true)}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
        />

        <div className="flex-1 flex flex-col gap-5 md:gap-6">
          
          {/* ================= DESKTOP VIEW PANEL ================= */}
          <div className="hidden md:flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по задачам, тегам (#seo, #react) или авторам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Вкладки Модов ленты на Desktop */}
            {user && (
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setFeedMode("all")}
                  className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all ${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Все публикации
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all ${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Мои промпты
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all ${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Мне понравилось
                </button>
              </div>
            )}

          </div>

          {/* ================= MOBILE VIEW CONTEXTUAL LAYOUT ================= */}
          
          {/* Вкладка 1: Лента промптов (мобильные) */}
          <div className={`md:block ${mobileTab === "feed" ? "block" : "hidden"}`}>
            {error && (
              <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300 mb-4">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Вкладки Модов ленты на Смартфонах */}
            {user && (
              <div className="flex md:hidden border-b border-slate-850 mb-4 overflow-x-auto hide-scrollbar select-none">
                <button
                  onClick={() => setFeedMode("all")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all ${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }`}
                >
                  Все посты
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all ${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }`}
                >
                  Мои промпты
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all ${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }`}
                >
                  Избранное
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-[235px] animate-pulse" />
                ))}
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl p-8 max-w-lg mx-auto">
                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                  <Terminal className="h-7 w-7 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Ничего не найдено</h3>
                <p className="text-sm text-slate-500 mt-1">Опубликуйте первый промпт в этой вкладке!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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

          {/* Вкладка 2: Выбор категорий (мобильные) */}
          <div className={`md:hidden bg-slate-900/40 border border-slate-800 rounded-2xl p-5 glass ${mobileTab === "categories" ? "block" : "hidden"}`}>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Выберите категорию</h3>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setMobileTab("feed");
                    }}
                    className={`flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all active:scale-98 ${
                      isActive
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-950/40 text-slate-300 border border-slate-800/50 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Вкладка 3: Поиск и AI Модели (мобильные) */}
          <div className={`md:hidden flex flex-col gap-4 ${mobileTab === "search" ? "block" : "hidden"}`}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по тегам, задачам или авторам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setMobileTab("feed")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm"
            >
              Перейти к результатам ({filteredAgents.length})
            </button>
          </div>

          {/* Вкладка 4: Мобильный Профиль (мобильные) */}
          <div className={`md:hidden flex flex-col gap-4 ${mobileTab === "profile" ? "block" : "hidden"}`}>
            {user ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 glass">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="h-11 w-11 rounded-xl object-cover border border-slate-850"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold uppercase">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-slate-200">@{user.username}</p>
                    <p className="text-xs text-slate-500">Промпт-инженер</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic leading-relaxed break-words bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  {user.bio || "Биография не указана."}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                    Настройки
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-950/20 text-red-400 py-3 rounded-xl text-xs font-bold border border-red-900/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center glass">
                <p className="text-sm text-slate-400 mb-4">Войдите в личный профиль для публикации и оценки промптов.</p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Авторизоваться
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= MOBILE BOTTOM TAB BAR NAVIGATION ================= */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-950/95 border-t border-slate-850/80 glass pb-safe z-40">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
          <button
            onClick={() => setMobileTab("feed")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all ${
              mobileTab === "feed" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Terminal className="h-5 w-5" />
            <span>Лента</span>
          </button>

          <button
            onClick={() => setMobileTab("categories")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all ${
              mobileTab === "categories" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Compass className="h-5 w-5" />
            <span>Разделы</span>
          </button>

          {user && (
            <button
              onClick={handleOpenAddModal}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-indigo-400 hover:text-indigo-300 transition-all active:scale-95"
            >
              <PlusCircle className="h-7 w-7 fill-indigo-950" />
            </button>
          )}

          <button
            onClick={() => setMobileTab("search")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all ${
              mobileTab === "search" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Search className="h-5 w-5" />
            <span>Поиск</span>
          </button>

          <button
            onClick={() => setMobileTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all ${
              mobileTab === "profile" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <User className="h-5 w-5" />
            <span>Кабинет</span>
          </button>
        </div>
      </div>

      {/* Модальные окна */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(userData) => {
          setUser({ ...userData, bio: "", avatar: "" });
          checkSession();
          setMobileTab("feed");
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

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleSaveProfile}
        currentBio={user ? user.bio : ""}
        currentAvatar={user ? user.avatar : ""}
      />
    </div>
  );
}