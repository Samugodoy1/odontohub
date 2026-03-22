import React from 'react';
import { Plus, History, Save, X, Info } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export type ToothStatus = 
  | 'healthy' 
  | 'decay' 
  | 'filling' 
  | 'crown' 
  | 'root_canal_done' 
  | 'root_canal_needed' 
  | 'implant' 
  | 'extraction_done' 
  | 'extraction_needed' 
  | 'fracture' 
  | 'wear' 
  | 'facet' 
  | 'prosthesis' 
  | 'missing';

interface ToothRecord {
  id?: number;
  tooth_number: number;
  procedure: string;
  notes: string;
  date: string;
  dentist_name?: string;
}

interface ToothData {
  status: ToothStatus;
  notes: string;
}

interface OdontogramProps {
  data: Record<number, ToothData>;
  history?: ToothRecord[];
  onChange?: (toothNumber: number, toothData: ToothData) => void;
  onAddHistory?: (record: Omit<ToothRecord, 'id'>) => Promise<void>;
  onSelectProcedure?: (toothNumber: number, procedure: string) => void;
  readOnly?: boolean;
}

const toothNumbers = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [38, 37, 36, 35, 34, 33, 32, 31],
  lowerRight: [41, 42, 43, 44, 45, 46, 47, 48],
};

const statusColors: Record<ToothStatus, string> = {
  healthy: 'bg-white border-slate-300 text-slate-700',
  decay: 'bg-red-600 border-red-800 text-white',
  filling: 'bg-blue-600 border-blue-800 text-white',
  crown: 'bg-amber-600 border-amber-800 text-white',
  root_canal_done: 'bg-primary border-emerald-950 text-white',
  root_canal_needed: 'bg-orange-500 border-orange-700 text-white',
  implant: 'bg-indigo-600 border-indigo-800 text-white',
  extraction_done: 'bg-slate-800 border-slate-950 text-white',
  extraction_needed: 'bg-yellow-300 border-yellow-500 text-amber-900',
  fracture: 'bg-rose-700 border-rose-900 text-white',
  wear: 'bg-zinc-500 border-zinc-700 text-white',
  facet: 'bg-cyan-600 border-cyan-800 text-white',
  prosthesis: 'bg-purple-600 border-purple-800 text-white',
  missing: 'bg-slate-200 border-slate-400 text-slate-600',
};

const statusLabels: Record<ToothStatus, string> = {
  healthy: 'Saudável',
  decay: 'Cárie',
  filling: 'Restauração',
  crown: 'Coroa',
  root_canal_done: 'Canal Realizado',
  root_canal_needed: 'Canal Necessário',
  implant: 'Implante',
  extraction_done: 'Extração Realizada',
  extraction_needed: 'Extração Necessária',
  fracture: 'Fratura',
  wear: 'Desgaste',
  facet: 'Faceta',
  prosthesis: 'Prótese',
  missing: 'Ausente',
};

export const Odontogram: React.FC<OdontogramProps> = ({ 
  data = {}, 
  history = [], 
  onChange, 
  onAddHistory,
  onSelectProcedure,
  readOnly = false 
}) => {
  const [selectedTooth, setSelectedTooth] = React.useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newRecord, setNewRecord] = React.useState({
    procedure: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    status: 'healthy' as ToothStatus
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleToothClick = (num: number) => {
    setSelectedTooth(num);
    const tooth = data[num] || { status: 'healthy', notes: '' };
    setNewRecord(prev => ({ ...prev, status: tooth.status, procedure: '' }));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (selectedTooth === null || !onAddHistory) return;
    
    setIsSaving(true);
    try {
      // 1. Add to history
      await onAddHistory({
        tooth_number: selectedTooth,
        procedure: newRecord.procedure || statusLabels[newRecord.status],
        notes: newRecord.notes,
        date: newRecord.date
      });

      // 2. Update current status in odontogram
      if (onChange) {
        onChange(selectedTooth, { 
          status: newRecord.status, 
          notes: newRecord.notes 
        });
      }

      setIsModalOpen(false);
      setNewRecord({
        procedure: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        status: 'healthy'
      });
    } catch (error) {
      console.error('Error saving tooth record:', error);
      alert('Erro ao salvar registro do dente.');
    } finally {
      setIsSaving(false);
    }
  };

  const toothHistory = selectedTooth !== null 
    ? history.filter(h => h.tooth_number === selectedTooth)
    : [];

  const renderTooth = (num: number) => {
    const tooth = data[num] || { status: 'healthy', notes: '' };
    const isSelected = selectedTooth === num;

    return (
      <div key={num} className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => handleToothClick(num)}
          className={`
            w-12 h-[4.1rem] sm:w-[3.15rem] sm:h-[4.45rem] rounded-[18px] border-[1.5px] flex items-center justify-center text-[11px] sm:text-[12px] font-extrabold tracking-tight transition-all duration-200 active:scale-[0.98]
            ${statusColors[tooth.status]}
            ${isSelected ? 'ring-2 ring-primary scale-[1.08] z-10 shadow-[0_16px_28px_rgba(12,155,114,0.24)]' : 'hover:scale-[1.03] hover:shadow-[0_10px_18px_rgba(15,23,42,0.10)]'}
          `}
        >
          {num}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-7 p-2 sm:p-3 bg-transparent rounded-none shadow-none border-none">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg sm:text-[22px] font-extrabold tracking-[-0.015em] text-slate-950">Visão dentária</h3>
          <p className="text-xs sm:text-sm leading-6 text-slate-700">Selecione o dente para atualizar procedimentos e evolução.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 overflow-x-auto pb-3 bg-gradient-to-b from-white/60 to-transparent rounded-[28px]">
        {/* Upper Jaw */}
        <div className="flex justify-center gap-1.5 min-w-max">
          <div className="flex gap-1.5 border-r border-slate-200 pr-3">
            {toothNumbers.upperRight.map(renderTooth)}
          </div>
          <div className="flex gap-1.5 pl-3">
            {toothNumbers.upperLeft.map(renderTooth)}
          </div>
        </div>

        {/* Lower Jaw */}
        <div className="flex justify-center gap-1.5 min-w-max">
          <div className="flex gap-1.5 border-r border-slate-200 pr-3">
            {[...toothNumbers.lowerRight].reverse().map(renderTooth)}
          </div>
          <div className="flex gap-1.5 pl-3">
            {[...toothNumbers.lowerLeft].reverse().map(renderTooth)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-4 border-t border-slate-200/80">
        {(Object.entries(statusLabels) as [ToothStatus, string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/80 border border-slate-200/80 transition-all duration-200 hover:bg-white hover:shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full border-none ${statusColors[status].split(' ')[0]}`} />
            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider leading-tight">{label}</span>
          </div>
        ))}
      </div>

      {/* Tooth Detail Modal */}
      {isModalOpen && selectedTooth !== null && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F7F8FA] rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border-none">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-none ${statusColors[data[selectedTooth]?.status || 'healthy'].split(' ')[0]}`}>
                  {selectedTooth}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">Dente {selectedTooth}</h3>
                  <p className="text-sm text-[#64748B]">Histórico Clínico e Procedimentos</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Current Status */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Info size={18} className="text-primary" />
                  <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-xs">Status Atual</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.entries(statusLabels) as [ToothStatus, string][]).map(([status, label]) => (
                    <button
                      key={status}
                      onClick={() => setNewRecord(prev => ({ ...prev, status }))}
                      className={`
                        px-3 py-2 rounded-xl text-[10px] font-bold transition-all border-none text-center
                        ${newRecord.status === status 
                          ? `${statusColors[status].split(' ')[0]} ${statusColors[status].split(' ')[2]} ring-2 ring-offset-1 ring-primary` 
                          : 'bg-white text-[#64748B] hover:bg-slate-50'}
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Clinical History */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <History size={18} className="text-primary" />
                  <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-xs">Histórico Clínico</h4>
                </div>
                {toothHistory.length > 0 ? (
                  <div className="space-y-3">
                    {toothHistory.map((record, idx) => (
                      <div key={record.id || idx} className="p-4 rounded-2xl bg-white shadow-sm flex justify-between items-start gap-4 border-none">
                        <div>
                          <p className="font-bold text-[#0F172A]">{record.procedure}</p>
                          {record.notes && <p className="text-sm text-[#64748B] mt-1 italic">"{record.notes}"</p>}
                          <p className="text-[10px] text-[#94A3B8] mt-2 uppercase font-bold">Dentista: {record.dentist_name || 'Não informado'}</p>
                        </div>
                        <span className="text-xs font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-1 rounded border-none">
                          {formatDate(record.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[#64748B] text-sm">Nenhum registro anterior para este dente.</p>
                  </div>
                )}
              </section>

              {/* Add New Procedure */}
              {!readOnly && (
                <section className="bg-white p-6 rounded-[24px] shadow-sm border-none">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus size={18} className="text-primary" />
                    <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-xs">Adicionar Novo Procedimento</h4>
                  </div>
                  
                  {onSelectProcedure && (
                    <div className="mb-6">
                      <p className="text-[10px] font-bold text-[#64748B] uppercase mb-2">Planejar para Plano de Tratamento</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Restauração', 'Endodontia', 'Coroa', 'Implante', 'Extração'].map(proc => (
                          <button
                            key={proc}
                            onClick={() => onSelectProcedure(selectedTooth, proc)}
                            className="px-3 py-2 bg-[#F8FAFC] text-[#0F172A] rounded-xl text-[10px] font-bold hover:bg-primary hover:text-white transition-all border-none"
                          >
                            {proc}
                          </button>
                        ))}
                      </div>
                      <div className="my-4 border-t border-slate-50" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase ml-1">Procedimento</label>
                      <input 
                        type="text"
                        value={newRecord.procedure}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, procedure: e.target.value }))}
                        placeholder="Ex: Restauração em resina"
                        className="w-full px-4 py-2.5 rounded-xl border-none bg-[#F8FAFC] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase ml-1">Data</label>
                      <input 
                        type="date"
                        value={newRecord.date}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border-none bg-[#F8FAFC] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase ml-1">Observações</label>
                      <textarea 
                        value={newRecord.notes}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Detalhes adicionais sobre o procedimento..."
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border-none bg-[#F8FAFC] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                      />
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50 flex items-center justify-end gap-3 bg-white">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F1F5F9] transition-all border-none"
              >
                Fechar
              </button>
              {!readOnly && (
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:opacity-90 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 border-none"
                >
                  {isSaving ? 'Salvando...' : (
                    <>
                      <Save size={18} />
                      Salvar Registro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
