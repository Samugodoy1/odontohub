import React from 'react';
import { Clock, ClipboardList, MessageCircle, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  user: any;
  patients: any[];
  nextAppointments: any[];
  todayAppointmentsCount: number;
  todayRevenue: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openPatientRecord: (id: number) => void;
  setIsModalOpen: (open: boolean) => void;
  setActiveTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  nextAppointments = [],
  todayAppointmentsCount = 0,
  todayRevenue = 0,
  openPatientRecord,
  setActiveTab
}) => {
  const nextPatient = nextAppointments[0];
  const otherAppointments = nextAppointments.slice(1, 5);

  // Dynamic status message logic
  const getStatusMessage = () => {
    if (todayAppointmentsCount === 0) return "Agenda tranquila hoje";
    if (todayAppointmentsCount === 1) return "Último paciente do dia";
    return `Faltam ${todayAppointmentsCount} atendimentos hoje`;
  };

  const getGreetingName = () => {
    const name = user?.name || '';
    const cleanName = name.replace(/^(Dr\.|Dra\.|Dr|Dra)\s+/i, '');
    return cleanName.split(' ')[0];
  };

  return (
    <div className="flex flex-col gap-14 pb-32 pt-10 px-2 max-w-2xl mx-auto">
      {/* 1. HEADER */}
      <header className="space-y-1.5 px-2">
        <h1 className="text-[28px] font-bold tracking-tight text-[#1C1C1E]">
          Boa tarde, {getGreetingName()}
        </h1>
        <p className="text-[17px] font-medium text-[#8E8E93]">
          {getStatusMessage()}
        </p>
      </header>

      {/* 2. PRIMARY CARD — NEXT PATIENT */}
      {nextPatient ? (
        <section className="space-y-5">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card !p-12 space-y-12 shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-[#C6C6C8]/5 rounded-[32px]"
          >
            <div className="flex justify-between items-start gap-8">
              <div className="space-y-4">
                <h2 className="text-[34px] font-bold text-[#1C1C1E] leading-[1.15] tracking-[-0.02em]">
                  {nextPatient.patient_name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#F0F9F4] text-[#2B8A56] text-[11px] font-bold uppercase tracking-wider">
                    Confirmado
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 pt-2">
                <span className="text-[21px] font-bold text-[#1C1C1E] block leading-none">
                  {new Date(nextPatient.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-[22px] bg-[#F2F2F7] flex items-center justify-center text-[#1C1C1E]">
                  <ClipboardList size={22} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Procedimento</span>
                  <span className="text-[17px] font-semibold text-[#1C1C1E]">{nextPatient.notes || 'Avaliação Geral'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 pt-2">
              <motion.button 
                whileTap={{ scale: 0.98, opacity: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => openPatientRecord(nextPatient.patient_id)}
                className="bg-primary text-white w-full py-[22px] rounded-[30px] text-[17px] font-bold shadow-[0_12px_36px_rgba(38,78,54,0.12)] transition-all"
              >
                Atender
              </motion.button>
              
              <div className="grid grid-cols-2 gap-5">
                <motion.button 
                  whileTap={{ scale: 0.98, opacity: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center justify-center gap-2.5 px-6 py-[18px] rounded-[26px] border border-[#C6C6C8]/50 text-[15px] font-bold text-[#1C1C1E] bg-[#F9F9FB] transition-all"
                >
                  <MessageCircle size={18} className="text-primary" />
                  WhatsApp
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.98, opacity: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center justify-center gap-2.5 py-[18px] rounded-[26px] text-[15px] font-bold text-[#8E8E93] hover:text-[#1C1C1E] transition-all"
                >
                  Reagendar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>
      ) : (
        <section className="ios-card flex flex-col items-center justify-center py-24 text-center rounded-[32px]">
          <div className="w-20 h-20 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#8E8E93] mb-8">
            <Calendar size={36} />
          </div>
          <p className="text-[19px] font-semibold text-[#1C1C1E]">Nenhuma consulta para agora</p>
          <p className="text-[15px] text-[#8E8E93] mt-2">Sua agenda está livre no momento</p>
        </section>
      )}

      {/* 3. TODAY'S SCHEDULE */}
      {otherAppointments.length > 0 && (
        <section className="space-y-7">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Próximos da agenda</h3>
            <button 
              onClick={() => setActiveTab('agenda')}
              className="text-[15px] font-bold text-primary"
            >
              Ver tudo
            </button>
          </div>
          <div className="ios-card !p-0 overflow-hidden border border-[#C6C6C8]/5 rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            {otherAppointments.map((app, index) => (
              <motion.div 
                key={app.id}
                whileTap={{ backgroundColor: '#F2F2F7', scale: 0.995 }}
                transition={{ duration: 0.2 }}
                onClick={() => openPatientRecord(app.patient_id)}
                className={`flex items-center justify-between p-8 transition-colors cursor-pointer ${index !== otherAppointments.length - 1 ? 'border-b border-[#C6C6C8]/5' : ''}`}
              >
                <div className="flex items-center gap-7">
                  <span className="text-[15px] font-bold text-[#1C1C1E] w-12">
                    {new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[17px] font-semibold text-[#1C1C1E]">{app.patient_name}</span>
                    <span className="text-[13px] text-[#8E8E93] font-medium">{app.notes || 'Consulta'}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#C6C6C8]" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 4. WHATSAPP REMINDERS */}
      <section className="px-1">
        <div className="ios-card !bg-[#F2F2F7] !p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-none rounded-[32px]">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white rounded-[22px] flex items-center justify-center text-primary shadow-[0_4px_12px_rgba(0,0,0,0.03)] shrink-0">
              <MessageCircle size={28} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[17px] font-bold text-[#1C1C1E]">Lembretes de amanhã</h4>
              <p className="text-[14px] text-[#8E8E93] font-medium">8 pacientes para confirmar</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.97, opacity: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-primary text-white px-8 py-4 rounded-[999px] text-[14px] font-bold shadow-[0_8px_24px_rgba(38,78,54,0.1)] w-full sm:w-auto"
          >
            Enviar lembretes
          </motion.button>
        </div>
      </section>

      {/* 5. FINANCIAL SUMMARY */}
      <section className="flex justify-center pt-10 pb-20">
        <p className="text-[15px] font-medium text-[#8E8E93]">
          Faturamento hoje: <span className="text-[#1C1C1E] font-bold">{(todayRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </p>
      </section>
    </div>
  );
};
