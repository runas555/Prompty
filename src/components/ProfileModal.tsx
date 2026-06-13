import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { X, AlertCircle, Camera, Check } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bio: string, avatar: string) => Promise<boolean>;
  currentBio: string;
  currentAvatar: string;
}

export default function ProfileModal({ isOpen, onClose, onSave, currentBio, currentAvatar }: ProfileModalProps) {
  const { t } = useLanguage();
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ promptsCount: 0, commentsCount: 0, likesReceived: 0 });

  useEffect(() => {
    if (isOpen) {
      setBio(currentBio);
      setAvatar(currentAvatar);
      setError("");
      fetchStats();
    }
  }, [currentBio, currentAvatar, isOpen]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {}
  };

  if (!isOpen) return null;

  // Логика клиентского сжатия загружаемой фотографии через HTML5 Canvas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите файл изображения (png/jpg/webp).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 128; // Сжимаем до компактного размера 128х128 для мгновенного сохранения в БД
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          // Квадратный кроп по центру кадра
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          
          // Получаем Base64 сжатой jpeg-картинки (70% качества)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setAvatar(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const success = await onSave(bio.trim(), avatar);
      if (success) {
        onClose();
      } else {
        setError(t("profileDbError"));
      }
    } catch (err: any) {
      setError(t("profileConnectError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 overflow-hidden bottom-0 sm:bottom-auto absolute sm:relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-2">{t("profileTitle")}</h3>
        <p className="text-xs text-slate-500 mb-5">{t("profileSub")}</p>

        {/* Секция статистики */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/50 border border-slate-850 p-3 rounded-xl mb-5 text-center">
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.promptsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{t("profilePrompts")}</div>
          </div>
          <div>
            <div className="text-sm font-bold text-cyan-400">{stats.likesReceived}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{t("profileLikes")}</div>
          </div>
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.commentsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{t("profileComments")}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900 p-3 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Загрузчик Аватара */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar Preview" 
                  className="h-16 w-16 rounded-xl object-cover border border-slate-850 shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-600">
                  <Camera className="h-6 w-6" />
                </div>
              )}
              <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center cursor-pointer transition-opacity">
                <Camera className="h-5 w-5 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">{t("profilePhoto")}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{t("profilePhotoSub")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("profileBioLabel")}</label>
            <textarea
              placeholder={t("profileBioPlaceholder")}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              maxLength={150}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold"
            >
              {t("modalCancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all"
            >
              {loading ? t("profileSaving") : t("profileSaveSuccess")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}