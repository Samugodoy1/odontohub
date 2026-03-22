import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  FileText,
  Info,
  Phone,
  User,
  UserRound,
  XCircle,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { NovaEvolucao } from './NovaEvolucao';
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

type InfoTab = 'anamneses' | 'dados' | 'imagens' | 'financeiro';

type ClinicalStatus = 'EM_TRATAMENTO' | 'REVISAO' | 'ABANDONADO' | 'NOVO';

const statusConfig: Record<ClinicalStatus, { label: string; className: string }> = {
  EM_TRATAMENTO: {
    label: 'Em tratamento',
    className: 'bg-emerald-100 ring-1 ring-emerald-200 text-emerald-900',
  },
  REVISAO: {
    label: 'Em revisão',
    className: 'bg-amber-100 ring-1 ring-amber-200 text-amber-900',
  },
  ABANDONADO: {
    label: 'Abandonado',
    className: 'bg-rose-100 ring-1 ring-rose-200 text-rose-900',
  },
  NOVO: {
    label: 'Novo paciente',
    className: 'bg-sky-100 ring-1 ring-sky-200 text-sky-900',
  },
};

const getAge = (birthDate?: string) => {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age -= 1;
  return age;
};

const resolveSexLabel = (patient: any) => {
  const raw = String(patient?.sex || patient?.gender || '').toLowerCase();
  if (!raw) return 'Sexo n/i';
  if (raw.startsWith('m')) return 'Masculino';
  if (raw.startsWith('f')) return 'Feminino';
  return patient?.sex || patient?.gender;
};

const resolveClinicalStatus = (patient: any, appointments: any[]): ClinicalStatus => {
  const now = new Date();

  const patientAppointments = (appointments || [])
    .filter((a: any) => a.patient_id === patient.id)
    .filter((a: any) => !['CANCELLED', 'NO_SHOW'].includes(String(a.status || '').toUpperCase()));

  const hasAnyHistory =
    (patient?.evolution || []).length > 0 ||
    patientAppointments.some((a: any) => ['FINISHED', 'IN_PROGRESS'].includes(String(a.status || '').toUpperCase()));

  if (!hasAnyHistory) return 'NOVO';

  const hasFutureVisit = patientAppointments.some((a: any) => new Date(a.start_time) >= now);
  const hasOngoingTreatment = (patient?.treatmentPlan || []).some((item: any) =>
    ['APROVADO', 'PENDENTE', 'PLANEJADO'].includes(String(item.status || '').toUpperCase())
  );

  if (hasFutureVisit || hasOngoingTreatment) return 'EM_TRATAMENTO';

  const latestEvolution = (patient?.evolution || [])[0]?.date;
  const latestFinishedAppointment = patientAppointments
    .filter((a: any) => String(a.status || '').toUpperCase() === 'FINISHED')
    .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0]?.start_time;

  const latestActivityRaw = latestEvolution || latestFinishedAppointment;
  if (!latestActivityRaw) return 'REVISAO';

  const latestActivity = new Date(latestActivityRaw);
  const daysSinceLast = Math.floor((now.getTime() - latestActivity.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLast > 180) return 'ABANDONADO';
  return 'REVISAO';
};

const resolveTimelineIcon = (label: string) => {
  const lower = (label || '').toLowerCase();
  if (/canal|endo/.test(lower)) return Activity;
  if (/restaura|resina/.test(lower)) return CheckCircle2;
  if (/extra|exo|cirurg/.test(lower)) return Zap;
  if (/limpeza|profilax|raspagem/.test(lower)) return Circle;
  return FileText;
};

export const PatientClinical: React.FC<PatientClinicalProps> = ({
  patient,
  appointments,
  onUpdatePatient,
  onAddEvolution,
  setAppActiveTab,
  navigate: appNavigate,
}) => {
  const [isAddingEvolution, setIsAddingEvolution] = useState(false);
  const [isOdontoModalOpen, setIsOdontoModalOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [infoTab, setInfoTab] = useState<InfoTab>('anamneses');
  const [showAllEvolutions, setShowAllEvolutions] = useState(false);
  const infoPanelRef = useRef<HTMLElement | null>(null);
  const odontogramRef = useRef<HTMLElement | null>(null);

  const age = getAge(patient?.birth_date);
  const sexLabel = resolveSexLabel(patient);
  const clinicalStatus = resolveClinicalStatus(patient, appointments);
  const clinicalBadge = statusConfig[clinicalStatus];

  const treatmentInProgress = useMemo(
    () =>
      (patient?.treatmentPlan || []).filter((item: any) =>
        ['APROVADO', 'PENDENTE', 'PLANEJADO'].includes(String(item.status || '').toUpperCase())
      ),
    [patient?.treatmentPlan]
  );

  const timelineItems = useMemo(() => {
    const evolutionEvents = (patient?.evolution || []).map((e: any) => ({
      id: `evo-${e.id}`,
      date: e.date,
      title: e.procedure || 'Evolução clínica',
      notes: e.notes || '',
      status: 'CONCLUIDO',
      type: 'EVO',
    }));

    const appointmentEvents = (appointments || [])
      .filter((a: any) => a.patient_id === patient.id)
      .filter((a: any) => ['FINISHED', 'IN_PROGRESS'].includes(String(a.status || '').toUpperCase()))
      .map((a: any) => ({
        id: `app-${a.id}`,
        date: a.start_time,
        title: a.notes || 'Consulta clínica',
        notes: `Atendimento ${String(a.status || '').toUpperCase() === 'IN_PROGRESS' ? 'em andamento' : 'concluído'}`,
        status: String(a.status || '').toUpperCase() === 'IN_PROGRESS' ? 'EM_ANDAMENTO' : 'CONCLUIDO',
        type: 'APP',
      }));

    return [...evolutionEvents, ...appointmentEvents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [patient?.evolution, appointments, patient?.id]);

  const handleAddPlanItem = async (item: any) => {
    const updatedPatient = {
      ...patient,
      treatmentPlan: [
        ...(patient.treatmentPlan || []),
        {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          created_at: new Date().toISOString(),
        },
      ],
    };
    await onUpdatePatient(updatedPatient);
  };

  const handleOdontoProcedureSelect = async (procedure: string) => {
    if (selectedTooth === null) return;

    const values: Record<string, number> = {
      Restauração: 150,
      Endodontia: 450,
      Coroa: 1200,
      Implante: 2500,
      Extração: 200,
    };

    await handleAddPlanItem({
      tooth_number: selectedTooth,
      procedure,
      value: values[procedure] || 0,
      status: 'PLANEJADO',
    });

    setIsOdontoModalOpen(false);
    setSelectedTooth(null);
  };

  const patientFiles = patient?.files || [];
  const financialTotal = (patient?.treatmentPlan || []).reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0);
  const completedTotal = (patient?.treatmentPlan || [])
    .filter((item: any) => String(item.status || '').toUpperCase() === 'REALIZADO')
    .reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0);

  const openImagesTab = () => {
    setInfoTab('imagens');
    requestAnimationFrame(() => {
      infoPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const focusOdontogram = () => {
    requestAnimationFrame(() => {
      odontogramRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const iosCard =
    'bg-white border border-slate-200/80 shadow-[0_14px_38px_rgba(15,23,42,0.08),0_2px_10px_rgba(15,23,42,0.04)]';
  const iosSubtleCard =
    'bg-slate-50/90 border border-slate-200/80';

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-24 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => {
                  setAppActiveTab('pacientes');
                  appNavigate('/pacientes');
                }}
                className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="Voltar para pacientes"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center shrink-0 border border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                {patient?.photo_url ? (
                  <img src={patient.photo_url} alt={patient?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-slate-700 font-extrabold text-lg">
                    {String(patient?.name || 'P')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n: string) => n[0].toUpperCase())
                      .join('')}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-[27px] sm:text-[33px] leading-tight tracking-[-0.02em] font-extrabold text-slate-950 truncate">{patient?.name}</h1>
                <p className="text-sm leading-6 text-slate-700 mt-1">
                  {age !== null ? `${age} anos` : 'Idade n/i'} • {sexLabel}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-1">Status clínico</p>
              <span className={`inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-extrabold tracking-[0.08em] shadow-sm ${clinicalBadge.className}`}>
                {clinicalBadge.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Ações rápidas</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddingEvolution(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-[0_14px_28px_rgba(12,155,114,0.28)] hover:opacity-95 hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
              >
                <Activity size={15} />
                Nova evolução
              </button>
              <button
                onClick={() => {
                  setAppActiveTab('agenda');
                  appNavigate('/agenda');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-[0_6px_18px_rgba(15,23,42,0.04)] hover:bg-slate-50 hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
              >
                <Calendar size={15} />
                Agendar
              </button>
              <button
                onClick={openImagesTab}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-[0_6px_18px_rgba(15,23,42,0.04)] hover:bg-slate-50 hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
              >
                <Camera size={15} />
                Imagens/RX
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-7">
        <section ref={odontogramRef} className="rounded-[34px] p-4 sm:p-5 border border-emerald-200/60 bg-gradient-to-br from-white via-white to-emerald-50/70 shadow-[0_24px_60px_rgba(15,23,42,0.10),0_10px_24px_rgba(12,155,114,0.12)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-[-0.02em] text-slate-950">Odontograma</h2>
              <p className="text-sm leading-6 text-slate-700">Mapa clínico principal para decisão imediata</p>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">Interativo</span>
          </div>

          <div className="rounded-[28px] p-1.5 sm:p-2 bg-white/80 ring-1 ring-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <Odontogram
              data={patient?.odontogram || {}}
              onToothClick={(tooth) => {
                setSelectedTooth(tooth);
                setIsOdontoModalOpen(true);
              }}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-6">
            <section className={`${iosCard} rounded-[28px] p-6 sm:p-7`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold tracking-[-0.01em] text-slate-950">Tratamento atual</h3>
                <span className="text-xs text-slate-500 font-semibold">Prioridade clínica</span>
              </div>

              <div className="space-y-3">
                {treatmentInProgress.length > 0 ? (
                  treatmentInProgress.map((item: any) => {
                    const rawStatus = String(item.status || '').toUpperCase();
                    const itemBadge =
                      rawStatus === 'APROVADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rawStatus === 'PENDENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl px-4 py-4 flex items-center justify-between gap-3 transition-all duration-200 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${iosSubtleCard}`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-[15px] sm:text-base leading-6 truncate">
                            {item.procedure} {item.tooth_number ? `dente ${item.tooth_number}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${itemBadge}`}>
                              {rawStatus === 'APROVADO' ? 'Em andamento' : rawStatus === 'PENDENTE' ? 'Pendente' : 'Planejado'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {(Number(item.value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsAddingEvolution(true)}
                          className="shrink-0 px-3 py-2 rounded-xl bg-white text-primary text-xs font-extrabold border border-slate-200 hover:bg-primary hover:text-white hover:shadow-[0_10px_20px_rgba(12,155,114,0.20)] hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
                        >
                          Continuar
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className={`rounded-2xl py-10 text-center ${iosSubtleCard}`}>
                    <div className="flex flex-col items-center gap-3 px-4">
                      <div className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600">
                        <Clock3 size={18} />
                      </div>
                      <p className="text-slate-800 text-sm font-bold">Nenhum tratamento ativo no momento</p>
                      <p className="text-slate-600 text-xs">Inicie pelo odontograma para planejar o próximo passo clínico.</p>
                      <button
                        onClick={focusOdontogram}
                        className="mt-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-100 hover:shadow-sm hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
                      >
                        Adicionar tratamento
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className={`${iosCard} rounded-[28px] p-6 sm:p-7`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold tracking-[-0.01em] text-slate-950">Evolução clínica</h3>
                <button
                  onClick={() => setIsAddingEvolution(true)}
                  className="text-sm font-bold text-primary hover:underline hover:scale-[1.01] transition-all duration-200"
                >
                  Nova evolução
                </button>
              </div>

              <div className="space-y-3 relative">
                {timelineItems.length > 0 && <div className="absolute left-[18px] top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-primary/80 via-primary/35 to-slate-200" />}
                {timelineItems.length > 0 ? (
                  <>
                    {(showAllEvolutions ? timelineItems : timelineItems.slice(0, 3)).map((item: any, idx: number) => {
                    const Icon = resolveTimelineIcon(item.title);
                    const statusPill =
                      item.status === 'EM_ANDAMENTO'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800';
                    const isLatest = idx === 0;

                      return (
                        <div key={item.id} className={`rounded-2xl p-4 ml-8 transition-all duration-200 ${isLatest ? 'bg-white border border-primary/25 shadow-[0_18px_34px_rgba(15,23,42,0.10),0_6px_18px_rgba(12,155,114,0.10)]' : 'bg-slate-50/75 border border-slate-200/70 opacity-75 hover:opacity-95'}`}>
                          <span className={`absolute left-[12px] mt-3 w-[13px] h-[13px] rounded-full border-2 shadow-sm ${isLatest ? 'bg-primary border-white ring-4 ring-primary/12' : 'bg-white border-slate-400'}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isLatest ? 'bg-primary/12 border-primary/20 text-primary shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                {isLatest && <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary mb-1">Último evento</p>}
                                <p className={`leading-6 truncate ${isLatest ? 'text-base font-bold text-slate-950' : 'text-[15px] font-semibold text-slate-800'}`}>{item.title}</p>
                                {item.notes && <p className={`text-sm leading-6 mt-0.5 line-clamp-2 ${isLatest ? 'text-slate-700' : 'text-slate-500'}`}>{item.notes}</p>}
                                <p className={`text-xs mt-1.5 ${isLatest ? 'text-slate-600' : 'text-slate-500'}`}>{formatDate(item.date)}</p>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em] ${statusPill}`}>
                              {item.status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Concluído'}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {timelineItems.length > 3 && (
                      <div className="pt-1">
                        <button
                          onClick={() => setShowAllEvolutions(prev => !prev)}
                          className="w-full py-2.5 rounded-xl bg-white text-sm font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
                        >
                          {showAllEvolutions ? 'Mostrar menos' : 'Ver mais'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`rounded-2xl py-10 text-center ${iosSubtleCard}`}>
                    <div className="flex flex-col items-center gap-3 px-4">
                      <div className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600">
                        <FileText size={18} />
                      </div>
                      <p className="text-slate-800 text-sm font-bold">Ainda não há evoluções registradas</p>
                      <p className="text-slate-600 text-xs">Registre a primeira evolução para iniciar o histórico clínico.</p>
                      <button
                        onClick={() => setIsAddingEvolution(true)}
                        className="mt-1 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-extrabold shadow-[0_14px_28px_rgba(12,155,114,0.24)] hover:opacity-95 hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
                      >
                        Nova evolução
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside ref={infoPanelRef} className={`${iosCard} rounded-[28px] p-4 sm:p-5 h-fit xl:sticky xl:top-[112px]`}>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4">
              {[
                { id: 'anamneses', label: 'Anamnese' },
                { id: 'dados', label: 'Dados pessoais' },
                { id: 'imagens', label: 'Imagens/RX' },
                { id: 'financeiro', label: 'Financeiro' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInfoTab(tab.id as InfoTab)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    infoTab === tab.id
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:scale-[1.01]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {infoTab === 'anamneses' && (
              <div className="space-y-3 text-sm">
                <div className={`p-3 rounded-xl ${iosSubtleCard}`}>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold mb-1">Histórico médico</p>
                  <p className="text-slate-700">{patient?.anamnesis?.medical_history || 'Não informado'}</p>
                </div>
                <div className={`p-3 rounded-xl ${iosSubtleCard}`}>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold mb-1">Alergias</p>
                  <p className="text-slate-700">{patient?.anamnesis?.allergies || 'Não informado'}</p>
                </div>
                <div className={`p-3 rounded-xl ${iosSubtleCard}`}>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold mb-1">Medicações</p>
                  <p className="text-slate-700">{patient?.anamnesis?.medications || 'Não informado'}</p>
                </div>
              </div>
            )}

            {infoTab === 'dados' && (
              <div className="space-y-3 text-sm text-slate-700">
                <div className={`p-3 rounded-xl flex items-center gap-2 ${iosSubtleCard}`}><UserRound size={14} /> CPF: {patient?.cpf || 'Não informado'}</div>
                <div className={`p-3 rounded-xl flex items-center gap-2 ${iosSubtleCard}`}><Phone size={14} /> {patient?.phone || 'Não informado'}</div>
                <div className={`p-3 rounded-xl flex items-center gap-2 ${iosSubtleCard}`}><Info size={14} /> {patient?.email || 'Não informado'}</div>
                <div className={`p-3 rounded-xl flex items-center gap-2 ${iosSubtleCard}`}><Calendar size={14} /> Nascimento: {patient?.birth_date ? formatDate(patient.birth_date) : 'Não informado'}</div>
              </div>
            )}

            {infoTab === 'imagens' && (
              <div className="space-y-3">
                {patientFiles.length > 0 ? (
                  patientFiles.slice(0, 6).map((file: any) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block p-3 rounded-xl transition-all duration-200 hover:bg-slate-100 hover:scale-[1.01] ${iosSubtleCard}`}
                    >
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Camera size={14} /> {file.description || 'Arquivo clínico'}</p>
                      <p className="text-xs text-slate-500 mt-1">{file.created_at ? formatDate(file.created_at) : 'Data n/i'}</p>
                    </a>
                  ))
                ) : (
                  <div className={`p-8 rounded-xl text-center text-sm text-slate-600 ${iosSubtleCard}`}>Nenhuma imagem/RX anexada</div>
                )}
              </div>
            )}

            {infoTab === 'financeiro' && (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl ${iosSubtleCard}`}>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">Orçado</p>
                  <p className="text-lg font-extrabold text-slate-950 mt-1">
                    {financialTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${iosSubtleCard}`}>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">Concluído</p>
                  <p className="text-lg font-extrabold text-primary mt-1">
                    {completedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAppActiveTab('financeiro');
                    appNavigate('/financeiro');
                  }}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-bold hover:bg-slate-900 hover:scale-[1.01] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <CreditCard size={15} /> Abrir financeiro
                </button>
              </div>
            )}
          </aside>
        </div>
      </main>

      {isAddingEvolution && (
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto">
          <NovaEvolucao
            patientId={patient.id}
            onSave={async (evolution) => {
              const updatedPatient = {
                ...patient,
                evolution: [evolution, ...(patient.evolution || [])],
              };
              await onUpdatePatient(updatedPatient);
              await onAddEvolution(evolution);
              setIsAddingEvolution(false);
            }}
            onClose={() => setIsAddingEvolution(false)}
          />
        </div>
      )}

      {isOdontoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 z-[210] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md p-8 rounded-[30px] border border-slate-200 shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Dente {selectedTooth}</h3>
              <button
                onClick={() => setIsOdontoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Fechar seleção de dente"
              >
                <XCircle size={22} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {['Restauração', 'Endodontia', 'Coroa', 'Implante', 'Extração'].map((proc) => (
                <button
                  key={proc}
                  onClick={() => handleOdontoProcedureSelect(proc)}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-primary/10 hover:scale-[1.01] transition-all duration-200 group active:scale-[0.98]"
                >
                  <span className="font-bold text-slate-800 group-hover:text-primary">{proc}</span>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
