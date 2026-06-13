"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AgentCard, { Agent } from "@/components/AgentCard";
import AgentModal from "@/components/AgentModal";
import HistoryModal from "@/components/HistoryModal";
import { Sparkles, Terminal, FileText, Check, AlertCircle } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Состояния модалок
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistoryAgent, setActiveHistoryAgent] = useState<{ id: string; name: string } | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Считываем токен из локального хранилища при загрузке
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("admin_token_historian") || "";
      setAdminToken(savedToken);
    }
    fetchAgents();
  }, []);

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
      setError("Ошибка при подключении к API. Убедитесь, что сервер запущен.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Метод сохранения / добавления / изменения агента
  const handleSaveAgent = async (name: string, prompt: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? `/api/agents/${editingAgent.id}` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          prompt,
          adminToken
        })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      } else {
        const errData = await res.json();
        alert(errData.error || "Сбой авторизации или ошибка сервера");
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Восстановление старой версии промпта
  const handleRestoreVersion = async (promptText: string): Promise<boolean> => {
    if (!activeHistoryAgent) return false;
    try {
      const currentAgent = agents.find(a => a.id === activeHistoryAgent.id);
      if (!currentAgent) return false;

      const res = await fetch(`/api/agents/${activeHistoryAgent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: currentAgent.name,
          prompt: promptText,
          adminToken
        })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      } else {
        const errData = await res.json();
        alert(errData.error || "Ошибка восстановления версии");
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Удаление агента
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Вы уверены, что хотите полностью удалить этого агента и всю его историю?")) {
      return;
    }

    try {
      const res = await fetch(`/api/agents/${agentId}?adminToken=${encodeURIComponent(adminToken)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setAgents(agents.filter(a => a.id !== agentId));
      } else {
        const errData = await res.json();
        alert(errData.error || "Ошибка при удалении. Проверьте секретный токен.");
      }
    } catch (err) {
      console.error(err);
      alert("Не удалось отправить запрос на удаление.");
    }
  };

  // Фильтрация списка на клиенте (по названию или содержимому промпта)
  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.prompt.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        adminToken={adminToken}
        setAdminToken={setAdminToken}
        onOpenAddModal={() => {
          setEditingAgent(null);
          setIsAddOpen(true);
        }}
        totalAgents={agents.length}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300 mb-6 max-w-2xl mx-auto animate-pulse">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Лоадер скелетонов */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-[340px] flex flex-col justify-between animate-pulse">
                <div>
                  <div className="h-5 w-1/2 bg-slate-800 rounded-lg mb-3" />
                  <div className="h-4 w-1/4 bg-slate-800 rounded-lg mb-4" />
                  <div className="h-40 bg-slate-950 rounded-lg border border-slate-900" />
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-4">
                  <div className="h-8 w-1/3 bg-slate-800 rounded-lg" />
                  <div className="h-8 w-1/4 bg-slate-800 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          /* Пустой экран */
          <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl max-w-xl mx-auto p-8">
            <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <Terminal className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchQuery ? "Совпадений не найдено" : "Каталог агентов пуст"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2 leading-relaxed">
              {searchQuery
                ? "Попробуйте скорректировать условия поиска или очистить поле."
                : "Создайте своего первого ИИ-агента, добавив имя и его системный промпт."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsAddOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95 border border-slate-700"
              >
                Добавить агента
              </button>
            )}
          </div>
        ) : (
          /* Сетка карточек */
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

      {/* Модальное окно Создания / Редактирования */}
      <AgentModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
        agent={editingAgent}
      />

      {/* Модальное окно истории изменений */}
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

      {/* Футер */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 font-medium">
        <p>PromptHistorian &bull; Локальное и облачное хранилище системных промптов.</p>
      </footer>
    </div>
  );
}