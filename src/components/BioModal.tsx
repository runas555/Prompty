import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";

interface BioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bio: string) => Promise<boolean>;
  currentBio: string;
}

export default function BioModal({ isOpen, onClose, onSave, currentBio }: BioModalProps) {
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBio(currentBio);
    setError("");
  }, [currentBio, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const success = await onSave(bio);
      if (success) {
        onClose();
      } else {
        setError("Сбой сохранения биографии.");
      }
    } catch (err: any) {
      setError("Ошибка сети.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 flex flex-col bottom-0 sm:bottom-auto absolute sm:relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-2">Настройка профиля</h3>
        <p className="text-xs text-slate-500 mb-4">Напишите короткую биографию, она отобразится на ваших карточках в ленте.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900 p-3 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <textarea
            placeholder="Ваша роль, навыки или стек ИИ моделей..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            maxLength={150}
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="text-right text-[10px] text-slate-600 font-medium">Максимум 150 символов</div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}