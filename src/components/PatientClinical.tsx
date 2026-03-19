import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { NovaEvolucao } from './NovaEvolucao';
import { 
  ClipboardList, 
  Stethoscope, 
  Activity, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock,
  History,
  ArrowLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Odontogram } from './Odontogram';
import { formatDate } from '../utils/dateUtils';

interface PatientClinicalProps {
  patient: any;
  appointments: any[];
  onUpdatePatient: (updatedPatient: any) => Promise<void>;
  onAddEvolution: (evolutionData: any) => Promise<void>;
  setAppActiveTab: (tab: any) => void;
  navigate: any;
}

type Tab = 'resumo' | 'historico' | 'plano';

export const PatientClinical: React.FC<PatientClinicalProps> = ({ 
  patient, 
  appointments,
  onUpdatePatient, 
  onAddEvolution,
  setAppActiveTab,
  navigate: appNavigate
}) => {
  const [isAddingEvolution, setIsAddingEvolution] = useState(false);
  const [isFullPlanOpen, setIsFullPlanOpen] = useState(false);
  const [isOdontoModalOpen, setIsOdontoModalOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Simplified history items
  const historyItems = [
    ...(patient.evolution || []).map((e: any) => ({
      id: `evo-${e.id}`,
      date: e.date,
      label: `${e.procedure} ${e.notes?.includes('Dente:') ? e.notes.split('Dente:')[1].split('.')[0] : ''}`,
      type: 'EVO'
    })),
    ...(appointments || []).filter((a: any) => a.patient_id === patient.id && a.status === 'FINISHED').map((a: any) => ({
      id: `app-${a.id}`,
      date: a.start_time,
      label: 'Consulta Realizada',
      type: 'APP'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastEvolution = patient.evolution?.[0];
  const isToday = lastEvolution && new Date(lastEvolution.date).toDateString() === new Date().toDateString();

  const handleAddPlanItem = async (item: any) => {
    const updatedPatient = {
      ...patient,
      treatmentPlan: [
        ...(patient.treatmentPlan || []),
        { ...item, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, created_at: new Date().toISOString() }
      ]
    };
    await onUpdatePatient(updatedPatient);
  };

  const handleOdontoProcedureSelect = async (procedure: string) => {
    if (selectedTooth === null) return;
    const values: Record<string, number> = {
      'Restauração': 150, 'Endodontia': 450, 'Coroa': 1200, 'Implante': 2500, 'Extração': 200
    };
    await handleAddPlanItem({
      tooth_number: selectedTooth,
      procedure,
      value: values[procedure] || 0,
      status: 'PLANEJADO'
    });
    setIsOdontoModalOpen(false);
    setSelectedTooth(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-20">
      {/* Header Action Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setAppActiveTab('pacientes');
                appNavigate('/pacientes');
              }}
              className="p-2 hover:bg-slate-50 rounded-xl text-[#64748B] transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{patient.name}</h1>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Prontuário: #{patient.id.toString().slice(0, 8)}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsAddingEvolution(true)}
            className="bg-primary hover:opacity-90 text-white font-bold py-3 px-8 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 text-sm border-none"
          >
            <Activity size={18} />
            Iniciar Atendimento
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
        {/* Active Status Section */}
        <section>
          {isToday ? (
            <div className="bg-white rounded-[24px] p-8 shadow-sm border-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <h3 className="text-primary font-bold uppercase tracking-widest text-[10px]">Atendimento em andamento</h3>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-6 mb-8">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Última Evolução (Hoje)</p>
                <p className="text-[#0F172A] font-bold text-lg">{lastEvolution.procedure}</p>
                <p className="text-[#64748B] text-sm mt-2 leading-relaxed">{lastEvolution.notes}</p>
              </div>
              <button 
                onClick={() => setIsAddingEvolution(true)}
                className="w-full bg-[#0F172A] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98] text-sm border-none"
              >
                Continuar Atendimento <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-12 shadow-sm text-center flex flex-col items-center gap-6 border-none">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-[#0F172A] font-bold text-lg">Nenhum atendimento ativo</p>
                <p className="text-[#64748B] font-medium text-sm mt-1">Pronto para iniciar uma nova sessão clínica</p>
              </div>
              <button 
                onClick={() => setIsAddingEvolution(true)}
                className="bg-primary hover:opacity-90 text-white font-bold py-3 px-10 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 text-sm mt-2 border-none"
              >
                <Plus size={20} />
                Iniciar Atendimento Agora
              </button>
            </div>
          )}
        </section>

        {/* History Section - Simple Vertical List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History size={16} className="text-[#64748B]" />
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Histórico Clínico</h3>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm divide-y divide-slate-50 overflow-hidden border-none">
            {historyItems.slice(0, 5).map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center justify-between py-5 px-8 hover:bg-slate-50/50 transition-all">
                <div className="flex flex-col">
                  <span className="text-[#0F172A] font-bold text-sm">{item.label}</span>
                  <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider mt-0.5">{formatDate(item.date)}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
            {historyItems.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[#64748B] text-sm font-bold italic">Sem histórico registrado</p>
              </div>
            )}
          </div>
        </section>

        {/* Treatment Plan Section - Summary */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-[#64748B]" />
              <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Plano de Tratamento</h3>
            </div>
            <button 
              onClick={() => setIsFullPlanOpen(true)}
              className="text-primary font-bold text-[11px] uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Ver plano completo <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {(patient.treatmentPlan || []).slice(0, 3).map((item: any, idx: number) => (
              <div key={`${item.id}-${idx}`} className="flex items-center justify-between p-5 bg-white rounded-[20px] shadow-sm border-none">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.status === 'REALIZADO' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {item.status === 'REALIZADO' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <span className="text-[#0F172A] font-bold text-sm">{item.procedure}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                  item.status === 'REALIZADO' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.status === 'REALIZADO' ? 'Feito' : 'Pendente'}
                </span>
              </div>
            ))}
            {(patient.treatmentPlan || []).length === 0 && (
              <div className="bg-white rounded-[24px] py-10 text-center shadow-sm border-none">
                <p className="text-[#64748B] text-sm font-bold">Nenhum plano definido</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Full Plan Modal */}
      {isFullPlanOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Plano de Tratamento Completo</h3>
                <p className="text-sm text-[#64748B] font-medium">Odontograma e lista de procedimentos</p>
              </div>
              <button onClick={() => setIsFullPlanOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="bg-slate-50/50 rounded-[24px] p-8">
                <Odontogram 
                  data={patient.odontogram || {}} 
                  onToothClick={(tooth) => {
                    setSelectedTooth(tooth);
                    setIsOdontoModalOpen(true);
                  }}
                />
              </div>

              <div className="space-y-3">
                {(patient.treatmentPlan || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-50 shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 ${item.status === 'REALIZADO' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-500'} rounded-xl flex items-center justify-center`}>
                        {item.status === 'REALIZADO' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#0F172A]">{item.procedure}</h4>
                        <p className="text-xs text-[#64748B] font-medium">
                          Dente: {item.tooth_number || 'Geral'} • {(Number(item.value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                      item.status === 'REALIZADO' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evolution Modal */}
      {isAddingEvolution && (
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto">
          <NovaEvolucao 
            patientId={patient.id}
            onSave={async (evolution) => {
              const updatedPatient = {
                ...patient,
                evolution: [evolution, ...(patient.evolution || [])]
              };
              await onUpdatePatient(updatedPatient);
              await onAddEvolution(evolution);
              setIsAddingEvolution(false);
            }}
            onClose={() => setIsAddingEvolution(false)}
          />
        </div>
      )}

      {/* Odontogram Selection Modal */}
      {isOdontoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[210] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md p-8 rounded-[32px] shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">Dente {selectedTooth}</h3>
              <button onClick={() => setIsOdontoModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {['Restauração', 'Endodontia', 'Coroa', 'Implante', 'Extração'].map((proc) => (
                <button
                  key={proc}
                  onClick={() => handleOdontoProcedureSelect(proc)}
                  className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <span className="font-bold text-[#0F172A] group-hover:text-primary">{proc}</span>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
