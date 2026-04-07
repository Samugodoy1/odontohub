import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarPlus,
  ClipboardList,
  CheckCircle2,
  X,
  ChevronRight,
  Clock,
  Check,
  AlertCircle,
  User,
  Phone,
  FileText,
  Heart,
  Pill,
  Stethoscope,
  Calendar
} from '../icons';

interface AppointmentRequest {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  preferred_date: string;
  preferred_time: string | null;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

interface IntakeForm {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  status: 'SUBMITTED' | 'REVIEWED';
  created_at: string;
  form_data: {
    medical_history?: string;
    allergies?: string;
    medications?: string;
    chief_complaint?: string;
    habits?: string;
    family_history?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    health_insurance?: string;
    health_insurance_number?: string;
  };
}

interface PortalInboxProps {
  apiFetch: (url: string, options?: any) => Promise<Response>;
  onSchedulePatient?: (patientId: number, patientName: string, preferredDate: string) => void;
  onOpenPatient?: (patientId: number) => void;
}

export function PortalInbox({ apiFetch, onSchedulePatient, onOpenPatient }: PortalInboxProps) {
  const [activeSection, setActiveSection] = useState<'requests' | 'intake'>('requests');
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<IntakeForm | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, formRes] = await Promise.all([
        apiFetch('/api/portal/appointment-requests'),
        apiFetch('/api/portal/intake-forms')
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (formRes.ok) setIntakeForms(await formRes.json());
    } catch (e) {
      console.error('Error loading portal inbox:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/portal/appointment-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReviewForm = async (id: number) => {
    await apiFetch(`/api/portal/intake-forms/${id}/review`, { method: 'PATCH' });
    setIntakeForms(prev => prev.map(f => f.id === id ? { ...f, status: 'REVIEWED' } : f));
    if (selectedForm?.id === id) setSelectedForm(prev => prev ? { ...prev, status: 'REVIEWED' } : null);
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pendingForms = intakeForms.filter(f => f.status === 'SUBMITTED');

  const totalPending = pendingRequests.length + pendingForms.length;

  const formatDateBR = (d: string) => {
    try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
  };

  const timeLabel = (t: string | null) => {
    if (!t) return 'Qualquer horário';
    const map: Record<string, string> = { manha: 'Manhã (08h–12h)', tarde: 'Tarde (13h–18h)', noite: 'Noite (18h–21h)' };
    return map[t] || t;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header com indicador de pendentes */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Portal do Paciente</h3>
          <p className="text-sm text-slate-400">Solicitações e fichas enviadas pelos pacientes</p>
        </div>
        {totalPending > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
            <Clock size={13} />
            {totalPending} {totalPending === 1 ? 'pendente' : 'pendentes'}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveSection('requests')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSection === 'requests' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarPlus size={15} />
          Solicitações
          {pendingRequests.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('intake')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSection === 'intake' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList size={15} />
          Pré-atendimento
          {pendingForms.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {pendingForms.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Solicitações de Agendamento ── */}
      {activeSection === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <EmptyState icon={CalendarPlus} text="Nenhuma solicitação de agendamento recebida" />
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                  req.status === 'PENDING' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {req.patient_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{req.patient_name}</p>
                      <p className="text-xs text-slate-400">{req.patient_phone}</p>
                    </div>
                  </div>
                  <StatusBadgeReq status={req.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <InfoChip icon={Calendar} label="Data preferida" value={formatDateBR(req.preferred_date)} />
                  <InfoChip icon={Clock} label="Horário" value={timeLabel(req.preferred_time)} />
                </div>

                {req.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mb-3 italic">
                    "{req.notes}"
                  </p>
                )}

                <div className="text-[10px] text-slate-400 mb-3">
                  Solicitado em {formatDateBR(req.created_at)}
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleUpdateRequest(req.id, 'APPROVED');
                        if (onSchedulePatient) {
                          onSchedulePatient(req.patient_id, req.patient_name, req.preferred_date);
                        }
                      }}
                      disabled={updatingId === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <Check size={13} /> Aprovar e Agendar
                    </button>
                    <button
                      onClick={() => handleUpdateRequest(req.id, 'REJECTED')}
                      disabled={updatingId === req.id}
                      className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Recusar
                    </button>
                    {onOpenPatient && (
                      <button
                        onClick={() => onOpenPatient(req.patient_id)}
                        className="px-3 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                        title="Ver prontuário"
                      >
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}

                {req.status !== 'PENDING' && onOpenPatient && (
                  <button
                    onClick={() => onOpenPatient(req.patient_id)}
                    className="w-full py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    Ver Prontuário <ChevronRight size={13} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Fichas de Pré-Atendimento ── */}
      {activeSection === 'intake' && (
        <div className="space-y-3">
          {intakeForms.length === 0 ? (
            <EmptyState icon={ClipboardList} text="Nenhuma ficha de pré-atendimento recebida" />
          ) : (
            intakeForms.map(form => (
              <div
                key={form.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm ${
                  form.status === 'SUBMITTED' ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {form.patient_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{form.patient_name}</p>
                      <p className="text-xs text-slate-400">{formatDateBR(form.created_at)}</p>
                    </div>
                  </div>
                  {form.status === 'SUBMITTED' ? (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">Nova</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> Revisada
                    </span>
                  )}
                </div>

                {/* Resumo da ficha */}
                <div className="space-y-2 mb-3">
                  {form.form_data.chief_complaint && (
                    <div className="flex items-start gap-2 text-xs">
                      <Stethoscope size={13} className="text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-600"><span className="font-semibold">Queixa:</span> {form.form_data.chief_complaint}</span>
                    </div>
                  )}
                  {form.form_data.allergies && (
                    <div className="flex items-start gap-2 text-xs">
                      <AlertCircle size={13} className="text-rose-400 mt-0.5 shrink-0" />
                      <span className="text-slate-600"><span className="font-semibold text-rose-600">Alergias:</span> {form.form_data.allergies}</span>
                    </div>
                  )}
                  {form.form_data.medications && (
                    <div className="flex items-start gap-2 text-xs">
                      <Pill size={13} className="text-violet-400 mt-0.5 shrink-0" />
                      <span className="text-slate-600"><span className="font-semibold">Medicamentos:</span> {form.form_data.medications}</span>
                    </div>
                  )}
                  {form.form_data.medical_history && (
                    <div className="flex items-start gap-2 text-xs">
                      <Heart size={13} className="text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-600 line-clamp-2"><span className="font-semibold">Histórico:</span> {form.form_data.medical_history}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedForm(form)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText size={13} /> Ver Completo
                  </button>
                  {form.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleReviewForm(form.id)}
                      className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={13} /> Marcar como Revisada
                    </button>
                  )}
                  {onOpenPatient && (
                    <button
                      onClick={() => onOpenPatient(form.patient_id)}
                      className="px-3 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                      title="Ver prontuário"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de ficha completa */}
      <AnimatePresence>
        {selectedForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center px-4"
            onClick={() => setSelectedForm(null)}
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-800">Ficha de Pré-Atendimento</h3>
                  <p className="text-xs text-slate-400">{selectedForm.patient_name} · {formatDateBR(selectedForm.created_at)}</p>
                </div>
                <button onClick={() => setSelectedForm(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <FormSection icon={Stethoscope} label="Queixa Principal" value={selectedForm.form_data.chief_complaint} />
                <FormSection icon={Heart} label="Histórico Médico" value={selectedForm.form_data.medical_history} />
                <FormSection icon={AlertCircle} label="Alergias" value={selectedForm.form_data.allergies} highlight="rose" />
                <FormSection icon={Pill} label="Medicamentos em Uso" value={selectedForm.form_data.medications} />
                <FormSection icon={ClipboardList} label="Hábitos" value={selectedForm.form_data.habits} />
                <FormSection icon={User} label="Histórico Familiar" value={selectedForm.form_data.family_history} />

                {(selectedForm.form_data.emergency_contact_name || selectedForm.form_data.health_insurance) && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    {selectedForm.form_data.emergency_contact_name && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contato de Emergência</p>
                        <p className="text-sm text-slate-700">{selectedForm.form_data.emergency_contact_name}</p>
                        {selectedForm.form_data.emergency_contact_phone && (
                          <p className="text-xs text-slate-400">{selectedForm.form_data.emergency_contact_phone}</p>
                        )}
                      </div>
                    )}
                    {selectedForm.form_data.health_insurance && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Convênio</p>
                        <p className="text-sm text-slate-700">{selectedForm.form_data.health_insurance}</p>
                        {selectedForm.form_data.health_insurance_number && (
                          <p className="text-xs text-slate-400">Carteirinha: {selectedForm.form_data.health_insurance_number}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  {selectedForm.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleReviewForm(selectedForm.id)}
                      className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={15} /> Marcar como Revisada
                    </button>
                  )}
                  {onOpenPatient && (
                    <button
                      onClick={() => { onOpenPatient(selectedForm.patient_id); setSelectedForm(null); }}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Ver Prontuário <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helper components ───

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
      <Icon size={32} className="text-slate-200 mx-auto mb-2" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function StatusBadgeReq({ status }: { status: string }) {
  if (status === 'PENDING') return (
    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
      <Clock size={10} /> Pendente
    </span>
  );
  if (status === 'APPROVED') return (
    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
      <CheckCircle2 size={10} /> Aprovado
    </span>
  );
  return (
    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full flex items-center gap-1">
      <X size={10} /> Recusado
    </span>
  );
}

function InfoChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-slate-400" />
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function FormSection({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType; label: string; value?: string; highlight?: string;
}) {
  if (!value) return null;
  return (
    <div className={`rounded-xl p-3 ${highlight === 'rose' ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={13} className={highlight === 'rose' ? 'text-rose-500' : 'text-slate-400'} />
        <span className={`text-xs font-bold uppercase tracking-wider ${highlight === 'rose' ? 'text-rose-600' : 'text-slate-500'}`}>{label}</span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
    </div>
  );
}
