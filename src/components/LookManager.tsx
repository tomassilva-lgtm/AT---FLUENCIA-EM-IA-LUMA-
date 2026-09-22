import React, { useState, useEffect } from 'react';
import { ColorGradeSettings, SavedLook } from '../types';
import { Bookmark, Download, Upload, Trash2, Check, Copy, FolderHeart, Plus } from 'lucide-react';

interface LookManagerProps {
  currentSettings: ColorGradeSettings;
  onApplySettings: (settings: ColorGradeSettings) => void;
  getCanvasThumbnail?: () => string | undefined;
}

const STORAGE_KEY = 'colortestlab_saved_looks_v1';

export const LookManager: React.FC<LookManagerProps> = ({
  currentSettings,
  onApplySettings,
  getCanvasThumbnail,
}) => {
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [newLookName, setNewLookName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLooks(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }
  }, []);

  const saveToStorage = (updated: SavedLook[]) => {
    setLooks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const handleSaveCurrentLook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLookName.trim()) return;

    const thumb = getCanvasThumbnail ? getCanvasThumbnail() : undefined;

    const newLook: SavedLook = {
      id: 'look-' + Date.now(),
      name: newLookName.trim(),
      createdAt: Date.now(),
      settings: { ...currentSettings },
      thumbnail: thumb,
    };

    const updated = [newLook, ...looks];
    saveToStorage(updated);
    setNewLookName('');
    setIsSaving(false);
  };

  const handleDelete = (id: string) => {
    const updated = looks.filter((l) => l.id !== id);
    saveToStorage(updated);
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(looks, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-test-lab-looks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCurrent = () => {
    const payload = {
      name: 'Grading Customizado',
      createdAt: new Date().toISOString(),
      gradeSettings: currentSettings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `look-grade-${Date.now()}.look.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentSettings, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          // Array of looks
          saveToStorage([...parsed, ...looks]);
        } else if (parsed.gradeSettings) {
          // Single look export format
          onApplySettings(parsed.gradeSettings);
        } else if (parsed.exposure !== undefined) {
          // Direct ColorGradeSettings object
          onApplySettings(parsed);
        }
      } catch (err) {
        console.error('Failed to parse Look JSON', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div id="look-manager-panel" className="flex flex-col gap-3 text-xs">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-2">
        <button
          id="btn-open-save-look"
          type="button"
          onClick={() => setIsSaving(!isSaving)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] font-semibold transition-colors cursor-pointer shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Salvar Look Atual</span>
        </button>

        <button
          type="button"
          onClick={handleCopyJSON}
          title="Copiar JSON de ajustes para a área de transferência"
          className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-[#222131] hover:bg-[#3b3756] border border-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] transition-colors cursor-pointer"
        >
          {copySuccess ? <Check className="w-3.5 h-3.5 text-[#dcd2fa]" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">JSON</span>
        </button>

        <button
          type="button"
          onClick={handleExportCurrent}
          title="Exportar look atual como arquivo .look.json"
          className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-[#222131] hover:bg-[#3b3756] border border-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar</span>
        </button>

        <label
          title="Importar arquivo de look .json"
          className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-[#222131] hover:bg-[#3b3756] border border-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Importar</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </label>
      </div>

      {/* Save Input Form */}
      {isSaving && (
        <form
          onSubmit={handleSaveCurrentLook}
          className="flex flex-col gap-2 p-3 bg-[#222131] border border-[#dcd2fa]/50 rounded-xl"
        >
          <span className="text-xs font-semibold text-[#f5f3fe]">
            Salvar Preset de Look
          </span>
          <input
            id="input-look-name"
            type="text"
            required
            placeholder="Ex: Suspense Noturno Urbano..."
            value={newLookName}
            onChange={(e) => setNewLookName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-[#0f1014] border border-[#3b3756] text-[#f5f3fe] placeholder-[#5a5575] text-xs focus:outline-none focus:border-[#dcd2fa]"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSaving(false)}
              className="px-2.5 py-1 text-xs text-[#9a96b4] hover:text-[#f5f3fe] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-save-look"
              type="submit"
              className="px-3 py-1 text-xs rounded-md bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] font-semibold cursor-pointer shadow"
            >
              Confirmar e Salvar
            </button>
          </div>
        </form>
      )}

      {/* Saved Looks List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-[#9a96b4]">
          <div className="flex items-center gap-1.5">
            <FolderHeart className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span>Looks Salvos do Projeto ({looks.length})</span>
          </div>
          {looks.length > 0 && (
            <button
              type="button"
              onClick={handleExportAll}
              className="hover:text-[#dcd2fa] cursor-pointer"
            >
              Backup da Galeria (.json)
            </button>
          )}
        </div>

        {looks.length === 0 ? (
          <div className="p-4 text-center rounded-xl border border-dashed border-[#3b3756] bg-[#222131]/40 text-[#9a96b4]">
            Nenhum look salvo ainda. Ajuste os controles e clique em &quot;Salvar Look Atual&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
            {looks.map((look) => (
              <div
                key={look.id}
                className="flex items-center justify-between p-2 rounded-xl bg-[#222131] border border-[#3b3756] hover:border-[#dcd2fa]/50 transition-colors group"
              >
                <div
                  onClick={() => onApplySettings(look.settings)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                >
                  {look.thumbnail ? (
                    <img
                      src={look.thumbnail}
                      alt={look.name}
                      className="w-10 h-7 object-cover rounded border border-[#3b3756]"
                    />
                  ) : (
                    <div className="w-10 h-7 rounded bg-[#0f1014] border border-[#3b3756] flex items-center justify-center text-[10px] text-[#9a96b4]">
                      LOOK
                    </div>
                  )}

                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-xs text-[#f5f3fe] group-hover:text-[#dcd2fa] truncate">
                      {look.name}
                    </span>
                    <span className="text-[10px] text-[#9a96b4]">
                      {new Date(look.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(look.id)}
                    title="Excluir look"
                    className="p-1 text-[#9a96b4] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
