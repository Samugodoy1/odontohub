import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams, useLocation, Link, useNavigate, Navigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  DollarSign, 
  Plus, 
  Search, 
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Settings,
  Image as ImageIcon,
  Bell,
  Lock,
  Mail,
  Trash2,
  Printer,
  Upload,
  FileText,
  UserPlus,
  UserCircle,
  Menu,
  CheckCircle,
  AlertTriangle,
  Camera,
  UserCog,
  Sun,
  Moon,
  Download,
  X,
  List,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Odontogram } from './components/Odontogram';
import { Documents } from './components/Documents';
import { PatientClinical } from './components/PatientClinical';
import { TermsPage, PrivacyPage } from './components/LegalPages';
import { NovaEvolucao } from './components/NovaEvolucao';
import { Dashboard } from './components/Dashboard';
import { formatDate, isOverdue } from './utils/dateUtils';

// Types
interface Patient {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birth_date?: string;
  address?: string;
  photo_url?: string;
  anamnesis?: {
    medical_history: string;
    allergies: string;
    medications: string;
  };
  evolution?: Array<{
    id: number;
    date: string;
    notes: string;
    procedure_performed: string;
  }>;
  files?: Array<{
    id: number;
    file_url: string;
    file_type: string;
    description: string;
    created_at: string;
  }>;
  odontogram?: Record<number, { status: string; notes: string }>;
  journey?: {
    cadastro: 'PENDENTE' | 'CONCLUIDO';
    anamnese: 'PENDENTE' | 'CONCLUIDO';
    odontograma: 'PENDENTE' | 'CONCLUIDO';
    plano: 'PENDENTE' | 'CONCLUIDO';
    aceite: 'PENDENTE' | 'CONCLUIDO';
    consultas: 'PENDENTE' | 'CONCLUIDO';
    evolucao: 'PENDENTE' | 'CONCLUIDO';
    pagamento: 'PENDENTE' | 'CONCLUIDO';
  };
  toothHistory?: Array<{
    id: number;
    tooth_number: number;
    procedure: string;
    notes: string;
    date: string;
    dentist_name?: string;
  }>;
  treatmentPlan?: Array<{
    id: number;
    tooth_number?: number;
    procedure: string;
    value: number;
    status: 'PLANEJADO' | 'APROVADO' | 'REALIZADO' | 'CANCELADO';
    created_at: string;
  }>;
  procedures?: Array<{
    id: number;
    date: string;
    tooth_number?: number;
    procedure: string;
    dentist_name: string;
    notes: string;
  }>;
  clinicalEvolution?: Array<{
    id: number;
    date: string;
    procedure: string;
    notes: string;
    materials?: string;
    observations?: string;
  }>;
  financial?: {
    transactions: Transaction[];
    paymentPlans: PaymentPlan[];
    installments: Installment[];
  };
  created_at?: string;
}

interface PaymentPlan {
  id: number;
  dentist_id: number;
  patient_id: number;
  procedure: string;
  total_amount: number;
  installments_count: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

interface Installment {
  id: number;
  payment_plan_id: number;
  dentist_id: number;
  patient_id: number;
  number: number;
  amount: number;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  payment_date?: string;
  transaction_id?: number;
  procedure?: string;
}

interface Dentist {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  cro?: string;
  specialty?: string;
  bio?: string;
  photo_url?: string;
  clinic_name?: string;
  clinic_address?: string;
  accepted_terms?: boolean;
  accepted_terms_at?: string;
  accepted_privacy_policy?: boolean;
}

interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  dentist_id: number;
  dentist_name: string;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'IN_PROGRESS' | 'FINISHED';
  notes?: string;
}

interface Transaction {
  id: number;
  dentist_id: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  category: string;
  amount: number;
  payment_method: string;
  date: string;
  status: string;
  patient_id?: number;
  patient_name?: string;
  procedure?: string;
  notes?: string;
  created_at: string;
}

const SidebarItem = ({ id, icon: Icon, label, activeTab, setActiveTab, setIsSidebarOpen, navigate }: any) => (
  <button
    onClick={() => {
      setActiveTab(id);
      setIsSidebarOpen(false);
      navigate('/');
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      activeTab === id 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} className="shrink-0" />
    <span className="font-medium tablet-l:hidden desktop:block whitespace-nowrap">{label}</span>
  </button>
);

const BottomNavItem = ({ id, icon: Icon, label, activeTab, setActiveTab, navigate }: any) => (
  <button
    onClick={() => {
      setActiveTab(id);
      navigate('/');
    }}
    title={label}
    className={`flex items-center justify-center flex-1 py-2 transition-colors ${activeTab === id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <Icon size={22} className={activeTab === id ? 'stroke-[2px]' : 'stroke-[1.5px]'} />
  </button>
);

// Function to get the effective status based on current time
const getEffectiveStatus = (appointment: Appointment): Appointment['status'] => {
  const now = new Date();
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  
  // If consultation time has passed, mark as FINISHED
  if (now >= endTime) {
    return 'FINISHED';
  }
  
  // If we're within the consultation window, mark as IN_PROGRESS
  if (now >= startTime && now < endTime) {
    return 'IN_PROGRESS';
  }
  
  // Otherwise return the original status
  return appointment.status;
};

const StatusBadge = ({ app, now }: { app: Appointment; now: Date }) => {
  const startTime = new Date(app.start_time);
  const diffInMinutes = Math.floor((startTime.getTime() - now.getTime()) / 60000);
  
  // Use effective status for display
  const effectiveStatus = getEffectiveStatus(app);
  
  let label = '';
  let style = '';
  let icon = null;

  if (effectiveStatus === 'IN_PROGRESS') {
    label = 'Em Atendimento';
    style = 'bg-primary/10 text-primary border-primary/20';
    icon = <Activity size={10} className="animate-pulse" />;
  } else if (effectiveStatus === 'FINISHED') {
    label = 'Finalizado';
    style = 'bg-slate-50 text-slate-400 border-slate-100';
  } else if (effectiveStatus === 'CANCELLED') {
    label = 'Faltou';
    style = 'bg-rose-50 text-rose-500 border-rose-100';
    icon = <AlertCircle size={10} />;
  } else if (diffInMinutes < 0 && effectiveStatus === 'SCHEDULED') {
    label = 'Atrasado';
    style = 'bg-rose-50 text-rose-500 border-rose-100 animate-pulse';
    icon = <Clock size={10} />;
  } else if (diffInMinutes >= 0 && diffInMinutes <= 15 && effectiveStatus === 'SCHEDULED') {
    label = `Próximo em ${diffInMinutes} min`;
    style = 'bg-amber-50 text-amber-600 border-amber-100 font-bold';
    icon = <Clock size={10} />;
  } else if (effectiveStatus === 'CONFIRMED') {
    label = 'Confirmado';
    style = 'bg-emerald-50 text-emerald-600 border-emerald-100';
  } else {
    label = 'Agendado';
    style = 'bg-slate-50 text-slate-400 border-slate-100';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}>
      {icon}
      {label}
    </span>
  );
};

const ClinicalPageRoute = ({ transactions, appointments, onUpdatePatient, onUpdateAnamnesis, onAddEvolution, onAddTransaction, dentistName, onOpenSidebar, apiFetch, setAppActiveTab, navigate }: any) => {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatient = async () => {
      // Only show loading if we don't have the patient or it's a different patient
      if (!patient || patient.id !== Number(id)) {
        setLoading(true);
      }
      try {
        const res = await apiFetch(`/api/patients/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Error loading patient:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadPatient();
  }, [id, apiFetch]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Carregando prontuário...</p>
      </div>
    </div>
  );
  
  if (!patient) return <div className="p-8 text-center">Paciente não encontrado.</div>;
  
  return (
    <PatientClinical 
      patient={patient} 
      appointments={appointments}
      onUpdatePatient={(updated: any) => {
        setPatient(updated);
        onUpdatePatient(updated);
      }} 
      onAddEvolution={(data: any) => {
        setPatient((prev: any) => ({ ...prev, evolution: [data, ...(prev.evolution || [])] }));
        onAddEvolution(data);
      }}
      setAppActiveTab={setAppActiveTab}
      navigate={navigate}
    />
  );
};

export default function App() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'pacientes' | 'financeiro' | 'documentos' | 'prontuario' | 'configuracoes' | 'admin'>('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'patients' | 'finance'>('patients');
  const [exportFilters, setExportFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    endDate: new Date().toLocaleDateString('en-CA'),
    patientId: 'all',
    category: 'all',
  });

  const exportPatients = () => {
    let filteredP = patients;
    if (exportFilters.patientId !== 'all') {
      filteredP = filteredP.filter(p => p.id.toString() === exportFilters.patientId);
    }
    if (exportFilters.startDate) {
      filteredP = filteredP.filter(p => p.created_at && p.created_at.split('T')[0] >= exportFilters.startDate);
    }
    if (exportFilters.endDate) {
      filteredP = filteredP.filter(p => p.created_at && p.created_at.split('T')[0] <= exportFilters.endDate);
    }

    const data = filteredP.map(p => ({
      'ID': p.id,
      'Nome Completo': p.name,
      'Telefone': p.phone,
      'Email': p.email,
      'Data de Nascimento': p.birth_date ? formatDate(p.birth_date) : '',
      'CPF': p.cpf || '',
      'Endereço': p.address || '',
      'Observações': p.anamnesis?.medical_history || '',
      'Data de Cadastro': p.created_at ? formatDate(p.created_at) : '',
      'Dentista Responsável': profile?.name || user?.name
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
    XLSX.writeFile(wb, `Pacientes_${new Date().toLocaleDateString('en-CA')}.xlsx`);
    setIsExportModalOpen(false);
  };

  const exportFinance = () => {
    let filteredT = transactions;
    if (exportFilters.startDate) {
      filteredT = filteredT.filter(t => t.date >= exportFilters.startDate);
    }
    if (exportFilters.endDate) {
      filteredT = filteredT.filter(t => t.date <= exportFilters.endDate);
    }
    if (exportFilters.patientId !== 'all') {
      filteredT = filteredT.filter(t => t.patient_id?.toString() === exportFilters.patientId);
    }
    if (exportFilters.category === 'income') {
      filteredT = filteredT.filter(t => t.type === 'INCOME');
    } else if (exportFilters.category === 'expense') {
      filteredT = filteredT.filter(t => t.type === 'EXPENSE');
    }

    const transactionData = filteredT.map(t => ({
      'Data': formatDate(t.date),
      'Paciente': t.patient_name || 'N/A',
      'Procedimento': t.procedure || t.description,
      'Categoria': t.type === 'INCOME' ? 'Receita' : 'Despesa',
      'Valor': t.amount,
      'Forma de Pagamento': t.payment_method,
      'Status': 'Pago',
      'Dentista Responsável': profile?.name || user?.name,
      'Observações': t.notes || '',
      'Valor Total do Tratamento': '',
      'Número de Parcelas': '',
      'Número da Parcela': '',
      'Valor da Parcela': '',
      'Data de Vencimento': '',
      'Status da Parcela': '',
      'Data de Pagamento': ''
    }));

    const installmentData = installments.filter(inst => {
      if (exportFilters.startDate && inst.due_date < exportFilters.startDate) return false;
      if (exportFilters.endDate && inst.due_date > exportFilters.endDate) return false;
      if (exportFilters.patientId !== 'all' && inst.patient_id?.toString() !== exportFilters.patientId) return false;
      if (exportFilters.category === 'expense') return false; // Installments are income
      return true;
    }).map(inst => {
      const plan = paymentPlans.find(p => p.id === inst.payment_plan_id);
      const patient = patients.find(p => p.id === inst.patient_id);
      return {
        'Data': formatDate(inst.due_date),
        'Paciente': patient?.name || 'N/A',
        'Procedimento': inst.procedure || plan?.procedure || 'Parcelamento',
        'Categoria': 'Receita (Parcela)',
        'Valor': inst.amount,
        'Forma de Pagamento': inst.status === 'PAID' ? 'N/A' : 'Pendente',
        'Status': inst.status === 'PAID' ? 'Pago' : (isOverdue(inst.due_date) ? 'Atrasado' : 'Pendente'),
        'Dentista Responsável': profile?.name || user?.name,
        'Observações': `Parcela ${inst.number}/${plan?.installments_count || '?'}`,
        'Valor Total do Tratamento': plan?.total_amount || 0,
        'Número de Parcelas': plan?.installments_count || 0,
        'Número da Parcela': inst.number,
        'Valor da Parcela': inst.amount,
        'Data de Vencimento': formatDate(inst.due_date),
        'Status da Parcela': inst.status,
        'Data de Pagamento': inst.payment_date ? formatDate(inst.payment_date) : ''
      };
    });

    const combinedData = [...transactionData, ...installmentData];

    const ws = XLSX.utils.json_to_sheet(combinedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, `Financeiro_${new Date().toLocaleDateString('en-CA')}.xlsx`);
    setIsExportModalOpen(false);
  };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: false });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    acceptedTerms: false,
    acceptedPrivacyPolicy: false,
    acceptedResponsibility: false
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientTab, setSelectedPatientTab] = useState<'evolucao' | 'imagens' | 'financeiro'>('evolucao');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDentistModalOpen, setIsDentistModalOpen] = useState(false);
  const [isEditDentistModalOpen, setIsEditDentistModalOpen] = useState(false);
  const [editingDentist, setEditingDentist] = useState<any>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientManagementFilter, setPatientManagementFilter] = useState<'ALL' | 'IN_TREATMENT' | 'REVIEW' | 'OVERDUE'>('ALL');
  const [dentistSearchTerm, setDentistSearchTerm] = useState('');
  const [dentistStatusFilter, setDentistStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaViewMode, setAgendaViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedWeekDay, setSelectedWeekDay] = useState<number>(new Date().getDay());
  const [now, setNow] = useState(new Date());
  const [monthSheetSelectedDay, setMonthSheetSelectedDay] = useState<Date | null>(null);
  const [weekSheetSelectedAppointment, setWeekSheetSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [statusFilter, setStatusFilter] = useState<string[]>(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']);
  const [agendaSearchTerm, setAgendaSearchTerm] = useState('');
  const [agendaFocusMode, setAgendaFocusMode] = useState(true);
  const [isEvolutionFormOpen, setIsEvolutionFormOpen] = useState(false);
  const [newEvolution, setNewEvolution] = useState({ notes: '', procedure: '' });
  const [newDentist, setNewDentist] = useState({ name: '', email: '', password: '' });
  const [newImage, setNewImage] = useState<{ url: string, description: string, file: File | null }>({ url: '', description: '', file: null });
  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    dentist_id: '',
    date: '',
    time: '',
    duration: '',
    notes: ''
  });
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [suggestedSlot, setSuggestedSlot] = useState<{ date: Date; duration: number; procedure: string } | null>(null);

  const [newPaymentPlan, setNewPaymentPlan] = useState({
    patient_id: '',
    procedure: '',
    total_amount: '',
    installments_count: '1',
    first_due_date: new Date().toLocaleDateString('en-CA')
  });

  const [isPaymentPlanModalOpen, setIsPaymentPlanModalOpen] = useState(false);
  const [isReceiveInstallmentModalOpen, setIsReceiveInstallmentModalOpen] = useState(false);
  const [isViewInstallmentsModalOpen, setIsViewInstallmentsModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    cpf: '',
    birth_date: '',
    phone: '',
    email: '',
    address: ''
  });

  // Finance States
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    category: 'Outros',
    amount: '',
    payment_method: 'PIX',
    date: new Date().toLocaleDateString('en-CA'),
    status: 'PAID',
    patient_id: '',
    procedure: '',
    notes: ''
  });
  const [financeFilter, setFinanceFilter] = useState({
    period: 'month', // 'day', 'week', 'month', 'all'
    type: 'all', // 'all', 'INCOME', 'EXPENSE'
    category: 'all'
  });
  const [financeSubTab, setFinanceSubTab] = useState<'transacoes' | 'parcelamentos'>('transacoes');

  const [profile, setProfile] = useState<Dentist | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profilePassword, setProfilePassword] = useState('');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.role === 'DENTIST') {
          // No filter needed
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchProfile();
      if (user.role?.toUpperCase() === 'ADMIN') {
        fetchAdminUsers();
      }
      // Update schema once
      apiFetch('/api/admin/update-schema').catch(console.error);
    }
  }, [user]);

  // Auto-sync appointment status changes (IN_PROGRESS and FINISHED)
  useEffect(() => {
    const syncAutoStatusChanges = async () => {
      for (const appointment of appointments) {
        const effectiveStatus = getEffectiveStatus(appointment);
        
        // Only sync if status changed automatically (not CANCELLED or initial SCHEDULED status)
        if (
          effectiveStatus !== appointment.status &&
          (effectiveStatus === 'IN_PROGRESS' || effectiveStatus === 'FINISHED')
        ) {
          try {
            await apiFetch(`/api/appointments/${appointment.id}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status: effectiveStatus })
            });
          } catch (error) {
            console.error(`Error syncing status for appointment ${appointment.id}:`, error);
          }
        }
      }
    };

    // Run sync check every minute
    const interval = setInterval(syncAutoStatusChanges, 60000);
    // Also run once on mount
    syncAutoStatusChanges();
    
    return () => clearInterval(interval);
  }, [appointments]);

  useEffect(() => {
    if (selectedPatientTab === 'financeiro' && selectedPatient) {
      fetchPatientFinancialHistory(selectedPatient.id);
    }
  }, [selectedPatientTab, selectedPatient?.id]);

  useEffect(() => {
    if ((activeTab === 'configuracoes' || activeTab === 'documentos') && user) {
      fetchProfile();
    }
  }, [activeTab, user]);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSavingProfile(true);
    try {
      const res = await apiFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ ...profile, password: profilePassword })
      });
      if (res.ok) {
        showNotification('Perfil atualizado com sucesso!');
        setProfilePassword('');
        fetchProfile();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Erro ao atualizar perfil', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Erro de conexão ao salvar perfil', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/profile/photo', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, photo_url: data.url } : null);
        showNotification('Foto de perfil atualizada!');
      } else {
        showNotification('Erro ao carregar foto de perfil.', 'error');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      showNotification('Erro ao carregar foto de perfil.', 'error');
    }
  };

  const handlePatientPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch(`/api/patients/${selectedPatient.id}/photo`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        // Refresh patient data
        openPatientRecord(selectedPatient.id);
        fetchData(); // Refresh list
        showNotification('Foto do paciente atualizada!');
      } else {
        showNotification('Erro ao carregar foto do paciente.', 'error');
      }
    } catch (error) {
      console.error('Error uploading patient photo:', error);
      showNotification('Erro ao carregar foto do paciente.', 'error');
    }
  };

  const fetchData = async (explicitToken?: string) => {
    if (!user && !explicitToken) return;
    try {
      const [pRes, aRes, fRes, sRes, plRes, iRes] = await Promise.all([
        apiFetch('/api/patients', { explicitToken }),
        apiFetch('/api/appointments', { explicitToken }),
        apiFetch('/api/finance', { explicitToken }),
        apiFetch('/api/finance/summary', { explicitToken }),
        apiFetch('/api/finance/payment-plans', { explicitToken }),
        apiFetch('/api/finance/installments', { explicitToken })
      ]);
      
      const pData = await pRes.json();
      const aData = await aRes.json();
      const fData = await fRes.json();
      const sData = await sRes.json();
      const plData = await plRes.json();
      const iData = await iRes.json();
      
      if (Array.isArray(pData)) setPatients(pData);
      if (Array.isArray(aData)) setAppointments(aData);
      if (Array.isArray(fData)) setTransactions(fData);
      if (sData && !sData.error) setFinancialSummary(sData);
      if (Array.isArray(plData)) setPaymentPlans(plData);
      if (Array.isArray(iData)) setInstallments(iData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patientId = selectedPatient ? selectedPatient.id : newPaymentPlan.patient_id;
      if (!patientId) {
        alert('Selecione um paciente');
        return;
      }

      const res = await apiFetch('/api/finance/payment-plans', {
        method: 'POST',
        body: JSON.stringify({
          ...newPaymentPlan,
          patient_id: patientId,
          total_amount: parseFloat(newPaymentPlan.total_amount),
          installments_count: parseInt(newPaymentPlan.installments_count)
        })
      });
      if (res.ok) {
        setIsPaymentPlanModalOpen(false);
        setNewPaymentPlan({
          patient_id: '',
          procedure: '',
          total_amount: '',
          installments_count: '1',
          first_due_date: new Date().toLocaleDateString('en-CA')
        });
        fetchData();
        if (selectedPatient) {
          fetchPatientFinancialHistory(selectedPatient.id);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar plano de pagamento');
      }
    } catch (error) {
      console.error('Error creating payment plan:', error);
    }
  };

  const handlePayInstallment = async (id: number, method: string) => {
    try {
      const res = await apiFetch(`/api/finance/installments/${id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({
          payment_method: method,
          payment_date: new Date().toLocaleDateString('en-CA')
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsReceiveInstallmentModalOpen(false);
        setIsViewInstallmentsModalOpen(false);
        fetchData();
        if (selectedPatient) {
          fetchPatientFinancialHistory(selectedPatient.id);
          // Update journey status
          const updatedPatient = {
            ...selectedPatient,
            journey: {
              ...(selectedPatient.journey || {}),
              pagamento: 'CONCLUIDO'
            }
          };
          setSelectedPatient(updatedPatient);
          setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        }
        // Automatically show receipt
        if (data.transaction) {
          generateReceipt(data.transaction);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao registrar pagamento');
      }
    } catch (error) {
      console.error('Error paying installment:', error);
    }
  };

  const fetchPatientFinancialHistory = async (patientId: number) => {
    try {
      const res = await apiFetch(`/api/patients/${patientId}/financial`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(prev => prev ? { ...prev, financial: data } : null);
      }
    } catch (error) {
      console.error('Error fetching patient financial history:', error);
    }
  };

  const generateReceipt = (transaction: any) => {
    const dentist = adminUsers.find(u => u.id === transaction.dentist_id) || profile;
    setSelectedReceipt({
      id: transaction.id,
      patientName: transaction.patient_name || transaction.patientName || (transaction.patient && transaction.patient.name) || 'Paciente não identificado',
      amount: transaction.amount,
      amountFormatted: Number(transaction.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      procedure: transaction.procedure || transaction.description,
      date: formatDate(transaction.date),
      paymentMethod: transaction.payment_method,
      dentistName: dentist?.name || user?.name,
      dentistCro: dentist?.cro || profile?.cro,
      clinicName: profile?.clinic_name || 'OdontoHub',
      clinicAddress: profile?.clinic_address || ''
    });
    setIsReceiptModalOpen(true);
  };

  const imprimirDocumento = (tipo: string, id: string | number | null = null) => {
    let url = `/print/${tipo}`;
    if (id) {
      url += `/${id}`;
    }
    
    // Special case for agenda date if not provided as ID
    if (tipo === 'agenda' && !id) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      url += `?date=${dateStr}`;
    }
    
    window.open(url, "_blank");
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/finance', {
        method: 'POST',
        body: JSON.stringify({
          ...newTransaction,
          type: transactionType,
          amount: parseFloat(newTransaction.amount),
          patient_id: newTransaction.patient_id ? parseInt(newTransaction.patient_id) : null
        })
      });
      if (res.ok) {
        setIsTransactionModalOpen(false);
        setNewTransaction({
          description: '',
          category: 'Outros',
          amount: '',
          payment_method: 'PIX',
          date: new Date().toLocaleDateString('en-CA'),
          status: 'PAID',
          patient_id: '',
          procedure: '',
          notes: ''
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar transação');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Erro de conexão ao salvar transação');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    setConfirmation({
      message: 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/finance/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            fetchData();
            showNotification('Transação excluída com sucesso!');
          }
        } catch (error) {
          console.error('Error deleting transaction:', error);
          showNotification('Erro ao excluir transação', 'error');
        }
      }
    });
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await apiFetch('/api/admin/users');
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error fetching admin users (${res.status}):`, errorText);
        return;
      }
      const data = await res.json();
      setAdminUsers(data);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const updateUserStatus = async (userId: number, status: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAdminUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        fetchData(data.token);
        if (data.user.role === 'DENTIST') {
          // No filter needed
        }
      } else {
        setLoginError(data.error || 'Erro ao fazer login');
      }
    } catch (error) {
      setLoginError('Erro de conexão com o servidor');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegisterMessage('');

    if (!registerData.acceptedTerms || !registerData.acceptedPrivacyPolicy || !registerData.acceptedResponsibility) {
      setLoginError('Você deve aceitar todos os termos e declarações para continuar.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterMessage(data.message);
        setIsRegistering(false);
      } else {
        setLoginError(data.error || 'Erro ao fazer cadastro');
      }
    } catch (error) {
      setLoginError('Erro de conexão com o servidor');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveTab('dashboard');
    setLoading(true);
  };

  const filteredTransactions = transactions.filter(t => {
    if (financeFilter.type !== 'all' && t.type !== financeFilter.type) return false;
    if (financeFilter.category !== 'all' && t.category !== financeFilter.category) return false;
    
    const tDateStr = t.date?.split('T')[0];
    const nowLocalStr = new Date().toLocaleDateString('en-CA');
    
    if (financeFilter.period === 'day') {
      return tDateStr === nowLocalStr;
    } else if (financeFilter.period === 'week') {
      const tDate = new Date(tDateStr + 'T12:00:00'); // Use mid-day local to avoid shifts
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return tDate >= weekAgo;
    } else if (financeFilter.period === 'month') {
      const [year, month] = tDateStr.split('-');
      const now = new Date();
      return parseInt(month) === (now.getMonth() + 1) && parseInt(year) === now.getFullYear();
    }
    return true;
  });

  const currentTotalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const currentTotalExpense = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const currentNetProfit = currentTotalIncome - currentTotalExpense;
  const currentProfitMargin = currentTotalIncome > 0 ? (currentNetProfit / currentTotalIncome) * 100 : 0;

  // Dashboard Stats Calculations
  const dashboardNow = new Date();
  const dashboardMonth = dashboardNow.getMonth();
  const dashboardYear = dashboardNow.getFullYear();

  const monthlyRevenue = transactions
    .filter(t => {
      const tDateStr = t.date?.split('T')[0];
      if (!tDateStr) return false;
      const [year, month] = tDateStr.split('-');
      return t.type === 'INCOME' && parseInt(month) === (dashboardMonth + 1) && parseInt(year) === dashboardYear;
    })
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const prevMonthDate = new Date(dashboardYear, dashboardMonth - 1, 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevMonthYear = prevMonthDate.getFullYear();

  const prevMonthlyRevenue = transactions
    .filter(t => {
      const tDateStr = t.date?.split('T')[0];
      if (!tDateStr) return false;
      const [year, month] = tDateStr.split('-');
      return t.type === 'INCOME' && parseInt(month) === (prevMonth + 1) && parseInt(year) === prevMonthYear;
    })
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const revenueVariation = prevMonthlyRevenue > 0 
    ? ((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100 
    : 0;

  const startOfWeek = new Date(dashboardNow);
  startOfWeek.setDate(dashboardNow.getDate() - dashboardNow.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weeklyAppointmentsCount = appointments.filter(a => {
    const d = new Date(a.start_time);
    return d >= startOfWeek && d <= endOfWeek;
  }).length;

  const todayStr = new Date().toLocaleDateString('en-CA');
  const dailyRevenue = financialSummary?.todayRevenue !== undefined 
    ? financialSummary.todayRevenue 
    : transactions
        .filter(t => {
          const tDate = t.date?.split('T')[0];
          return t.type === 'INCOME' && tDate === todayStr;
        })
        .reduce((acc, t) => acc + Number(t.amount), 0);

  const todayIncome = transactions
    .filter(t => t.type === 'INCOME' && t.date?.split('T')[0] === todayStr)
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const todayExpense = transactions
    .filter(t => t.type === 'EXPENSE' && t.date?.split('T')[0] === todayStr)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const absencesToday = appointments.filter(a => 
    new Date(a.start_time).toDateString() === dashboardNow.toDateString() && 
    a.status === 'CANCELLED'
  ).length;

  const proceduresToday = appointments.filter(a => 
    new Date(a.start_time).toDateString() === dashboardNow.toDateString() && 
    (a.status === 'FINISHED' || a.status === 'IN_PROGRESS')
  ).length;

  const nextAppointments = appointments
    .filter(a => 
      new Date(a.start_time).toDateString() === dashboardNow.toDateString() && 
      a.status !== 'FINISHED' && 
      a.status !== 'CANCELLED'
    )
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const todayAppointmentsTotalCount = appointments.filter(a => new Date(a.start_time).toDateString() === dashboardNow.toDateString()).length;
  const todayAppointmentsRemainingCount = appointments.filter(a => 
    new Date(a.start_time).toDateString() === dashboardNow.toDateString() &&
    a.status !== 'FINISHED' &&
    a.status !== 'CANCELLED'
  ).length;

  const tomorrowStart = new Date(dashboardNow);
  tomorrowStart.setDate(dashboardNow.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const tomorrowUnconfirmedCount = appointments.filter(a => {
    const apptDate = new Date(a.start_time);
    return apptDate >= tomorrowStart && apptDate <= tomorrowEnd && a.status !== 'CONFIRMED' && a.status !== 'CANCELLED';
  }).length;

  // Weekly Revenue Data for the Chart
  const weeklyRevenueData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toLocaleDateString('en-CA');
    const amount = transactions
      .filter(t => t.type === 'INCOME' && t.date?.split('T')[0] === dStr)
      .reduce((acc, t) => acc + Number(t.amount), 0);
    return {
      day: d.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0).toUpperCase(),
      amount
    };
  });

  const maxWeeklyRevenue = Math.max(...weeklyRevenueData.map(d => d.amount), 1);

  const apiFetch = async (url: string, options: any = {}) => {
    const token = options.explicitToken || localStorage.getItem('token');
    const headers: any = {
      'Accept': 'application/json',
      ...options.headers,
    };
    
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-auth-token'] = token;
    }
    
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      try {
        const errorData = await response.json();
        console.warn('Auth error details:', errorData);
      } catch (e) {
        // Not JSON
      }
      handleLogout();
    }
    return response;
  };

  const openAppointmentModal = () => {
    // Initialize with current user if available
    const dentist_id = user?.id ? user.id.toString() : (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id?.toString() : '');
    
    setEditingAppointment(null);
    setNewAppointment({
      patient_id: '',
      dentist_id: dentist_id || '',
      date: '',
      time: '',
      duration: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditAppointmentModal = (appointment: Appointment, navigateToAgenda = false) => {
    const startTime = new Date(appointment.start_time);
    const endTime = new Date(appointment.end_time);
    const durationInMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

    if (navigateToAgenda) {
      setActiveTab('agenda');
    }

    setSelectedDate(startTime);
    setSuggestedSlot(null);
    setEditingAppointment(appointment);
    setNewAppointment({
      patient_id: appointment.patient_id.toString(),
      dentist_id: appointment.dentist_id?.toString() || (user?.id ? user.id.toString() : ''),
      date: startTime.toLocaleDateString('en-CA'),
      time: startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      duration: durationInMinutes.toString(),
      notes: appointment.notes || ''
    });
    setIsModalOpen(true);
  };

  const openAppointmentModalForPatient = (patient: Patient) => {
    const dentist_id = user?.id ? user.id.toString() : (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id?.toString() : '');

    setEditingAppointment(null);
    setSelectedDate(new Date());
    setNewAppointment({
      patient_id: patient.id.toString(),
      dentist_id: dentist_id || '',
      date: '',
      time: '',
      duration: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const getWhatsappUrl = (phone: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    const normalizedPhone = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${normalizedPhone}`;
  };

  const formatTimeSinceLastVisit = (lastVisit: Date | null) => {
    if (!lastVisit) return 'Sem visita registrada';
    const diffMs = now.getTime() - lastVisit.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return '1 dia atrás';
    if (diffDays < 30) return `${diffDays} dias atrás`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 mês atrás';
    if (diffMonths < 12) return `${diffMonths} meses atrás`;

    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? '1 ano atrás' : `${diffYears} anos atrás`;
  };

  const getPatientManagementMeta = (patient: Patient) => {
    const patientAppointments = appointments
      .filter(a => a.patient_id === patient.id)
      .filter(a => {
        const status = String(a.status || '').toUpperCase();
        return status !== 'CANCELLED' && status !== 'NO_SHOW';
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const nextVisit = patientAppointments.find(a => {
      const visitDate = new Date(a.start_time);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate >= startOfToday;
    });
    const nextVisitDate = nextVisit ? new Date(nextVisit.start_time) : null;

    const pastAppointments = patientAppointments
      .filter(a => new Date(a.start_time) <= now)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    const lastVisitDate = pastAppointments.length > 0 ? new Date(pastAppointments[0].start_time) : null;

    const daysSinceLastVisit = lastVisitDate
      ? Math.floor((startOfToday.getTime() - new Date(lastVisitDate.getFullYear(), lastVisitDate.getMonth(), lastVisitDate.getDate()).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let priorityStatus: 'EM_TRATAMENTO' | 'ATRASADO' | 'REVISAO' | 'EM_DIA' = 'EM_DIA';

    // 1. EM TRATAMENTO (highest priority): nextVisitDate exists AND today <= nextVisitDate
    if (nextVisitDate) {
      const normalizedNextVisit = new Date(nextVisitDate);
      normalizedNextVisit.setHours(0, 0, 0, 0);
      if (startOfToday <= normalizedNextVisit) {
        priorityStatus = 'EM_TRATAMENTO';
      }
    } else if (daysSinceLastVisit !== null) {
      // 2. ATRASADO: daysSinceLastVisit > 180
      if (daysSinceLastVisit > 180) {
        priorityStatus = 'ATRASADO';
      }
      // 3. REVISAO: daysSinceLastVisit > 90
      else if (daysSinceLastVisit > 90) {
        priorityStatus = 'REVISAO';
      }
      // 4. EM DIA: otherwise
      else {
        priorityStatus = 'EM_DIA';
      }
    }

    const clinicalStatus: 'IN_TREATMENT' | 'REVIEW' | 'INACTIVE' =
      priorityStatus === 'EM_TRATAMENTO'
        ? 'IN_TREATMENT'
        : priorityStatus === 'REVISAO'
          ? 'REVIEW'
          : priorityStatus === 'ATRASADO'
            ? 'INACTIVE'
            : 'REVIEW';

    const indicator: 'OVERDUE' | 'UPCOMING_REVIEW' | 'UP_TO_DATE' =
      priorityStatus === 'ATRASADO'
        ? 'OVERDUE'
        : priorityStatus === 'REVISAO'
          ? 'UPCOMING_REVIEW'
          : 'UP_TO_DATE';

    return {
      priorityStatus,
      nextVisitDate,
      lastVisitDate,
      daysSinceLastVisit,
      clinicalStatus,
      indicator,
      timeSinceLastVisit: formatTimeSinceLastVisit(lastVisitDate)
    };
  };

  const patientCardsData = patients
    .filter(p =>
      (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchTerm)) ||
      (p.phone || '').includes(searchTerm)
    )
    .map(patient => ({
      patient,
      meta: getPatientManagementMeta(patient)
    }))
    .filter(item => {
      if (patientManagementFilter === 'ALL') return true;
      if (patientManagementFilter === 'IN_TREATMENT') return item.meta.clinicalStatus === 'IN_TREATMENT';
      if (patientManagementFilter === 'REVIEW') return item.meta.clinicalStatus === 'REVIEW';
      if (patientManagementFilter === 'OVERDUE') return item.meta.indicator === 'OVERDUE';
      return true;
    });

  const attentionPatientsCount = patientCardsData.filter(item => item.meta.indicator === 'OVERDUE').length;

  const resolveWorkingHours = (): WorkingHoursRange => {
    const profileAny = profile as any;
    const startCandidates = [
      profileAny?.working_hours_start,
      profileAny?.workingHoursStart,
      profileAny?.agenda_start,
      profileAny?.agendaStart
    ];
    const endCandidates = [
      profileAny?.working_hours_end,
      profileAny?.workingHoursEnd,
      profileAny?.agenda_end,
      profileAny?.agendaEnd
    ];

    const validTime = (value: any) => typeof value === 'string' && /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value);

    const start = startCandidates.find(validTime) || '08:00';
    const end = endCandidates.find(validTime) || '18:00';

    return { start, end };
  };

  const todayOpportunities = calculateDailyOpportunities({
    appointments,
    date: now,
    workingHours: resolveWorkingHours(),
    minSlotMinutes: 30,
    nowRef: now
  });

  const opportunitiesCount = todayOpportunities.count;

  const attendedTodayCount = proceduresToday;
  const [todayAttendanceHint, setTodayAttendanceHint] = useState<string | null>(null);
  const todayAttendanceHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [highlightTodayMetric, setHighlightTodayMetric] = useState(false);
  const hasInitializedTodayMetricRef = useRef(false);

  useEffect(() => {
    if (!hasInitializedTodayMetricRef.current) {
      hasInitializedTodayMetricRef.current = true;
      return;
    }

    setHighlightTodayMetric(true);
    const timeout = setTimeout(() => setHighlightTodayMetric(false), 900);
    return () => clearTimeout(timeout);
  }, [attendedTodayCount]);

  useEffect(() => {
    return () => {
      if (todayAttendanceHintTimeoutRef.current) {
        clearTimeout(todayAttendanceHintTimeoutRef.current);
      }
    };
  }, []);

  const getTodayAttendanceHint = (count: number) => {
    if (count >= 4) return `${count} atendimentos hoje, parabens 🔥`;
    if (count === 3) return '3 atendimentos hoje, excelente ritmo';
    if (count === 2) return '2 atendimentos hoje, continue assim';
    if (count === 1) return '1 atendimento hoje, bom comeco';
    return 'Sem atendimentos finalizados ate agora';
  };

  const showTodayAttendanceHint = () => {
    const message = getTodayAttendanceHint(attendedTodayCount);
    showTemporaryStatusHint(message);
  };

  const showTemporaryStatusHint = (message: string) => {
    setTodayAttendanceHint(message);

    if (todayAttendanceHintTimeoutRef.current) {
      clearTimeout(todayAttendanceHintTimeoutRef.current);
    }

    todayAttendanceHintTimeoutRef.current = setTimeout(() => {
      setTodayAttendanceHint(null);
    }, 3500);
  };

  const showOpportunitiesHint = () => {
    const message = `Voce tem ${opportunitiesCount} oportunidade${opportunitiesCount === 1 ? '' : 's'} de agendamento hoje`;
    showTemporaryStatusHint(message);
  };

  const statusBarItems = [
    {
      id: 'today',
      count: attendedTodayCount,
      text: `${attendedTodayCount > 3 ? '🔥 ' : ''}${attendedTodayCount} hoje`,
      onClick: showTodayAttendanceHint,
      tone: highlightTodayMetric ? 'text-emerald-600' : 'text-slate-500'
    },
    {
      id: 'opportunities',
      count: opportunitiesCount,
      text: `${opportunitiesCount} oportunidade${opportunitiesCount === 1 ? '' : 's'}`,
      onClick: showOpportunitiesHint,
      tone: 'text-slate-500'
    },
    {
      id: 'attention',
      count: attentionPatientsCount,
      text: `${attentionPatientsCount} ${attentionPatientsCount === 1 ? 'precisa' : 'precisam'} de atenção`,
      onClick: () => {
        setActiveTab('pacientes');
        setPatientManagementFilter('OVERDUE');
      },
      tone: attentionPatientsCount > 0 ? 'text-rose-600' : 'text-slate-500'
    }
  ].filter(item => item.count > 0);

  const formatProcedure = (input: string) => {
    const normalized = (input || '').trim();
    if (!normalized) return '';

    const lower = normalized.toLowerCase();

    // Endodontia shorthand
    const endoMatch = lower.match(/\b(?:endo|canal)\b\s*(\d{1,2})/);
    if (endoMatch) {
      return `Endodontia dente ${endoMatch[1]}`;
    }

    // Restauração shorthand
    const restaMatch = lower.match(/\b(?:restaura(?:c|ç)ao|restauração|resina)\b(?:\s+dente\s*(\d{1,2}))?/);
    if (restaMatch) {
      return restaMatch[1] ? `Restauração dente ${restaMatch[1]}` : 'Restauração';
    }

    // Extração shorthand
    const exoMatch = lower.match(/\b(?:extra(?:c|ç)ao|extração|exo)\b\s*(\d{1,2})?/);
    if (exoMatch) {
      return exoMatch[1] ? `Extração dente ${exoMatch[1]}` : 'Extração';
    }

    // Profilaxia / limpeza
    if (/\b(?:higiene|limpeza|profilaxia)\b/.test(lower)) {
      return 'Profilaxia';
    }

    // Fallback: capitalize words
    return normalized
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getProcedureColor = (procedure: string) => {
    const lower = (procedure || '').toLowerCase();
    
    if (/endo|canal/.test(lower)) {
      return { bg: '#1e40af', hover: '#1e3a8a' }; // blue-600, blue-800
    } else if (/restaura|resina/.test(lower)) {
      return { bg: '#16a34a', hover: '#15803d' }; // green-600, green-700
    } else if (/extra|exo/.test(lower)) {
      return { bg: '#dc2626', hover: '#991b1b' }; // red-600, red-900
    } else if (/higiene|limpeza|profila/.test(lower)) {
      return { bg: '#ca8a04', hover: '#a16207' }; // yellow-600, yellow-700
    } else if (/ortodo|alinha/.test(lower)) {
      return { bg: '#7c3aed', hover: '#6d28d9' }; // purple-600, purple-700
    } else if (/prot/.test(lower)) {
      return { bg: '#db2777', hover: '#be123c' }; // pink-600, pink-700
    } else {
      return { bg: '#4b5563', hover: '#2d3748' }; // slate-600, slate-800
    }
  };

  const getProcedureByDuration = (minutes: number): string => {
    if (minutes < 30) {
      return 'Avaliação';
    } else if (minutes < 60) {
      return 'Avaliação e limpeza';
    } else if (minutes < 90) {
      return 'Restauração';
    } else if (minutes < 120) {
      return 'Endodontia';
    } else {
      return 'Tratamento complexo';
    }
  };

  type WorkingHoursRange = { start: string; end: string };
  type FreeSlot = { startTime: Date; endTime: Date; duration: number; procedure?: string };
  type TimeRangeInput = { start: string | Date; end: string | Date };

  function parseTimeToMinutes(time: string) {
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((time || '').trim());
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return (hours * 60) + minutes;
  }

  function calculateDailyOpportunities({
    appointments,
    date,
    workingHours,
    minSlotMinutes = 30,
    nowRef,
    blockedPeriods = []
  }: {
    appointments: Appointment[];
    date: Date;
    workingHours: WorkingHoursRange;
    minSlotMinutes?: number;
    nowRef?: Date;
    blockedPeriods?: TimeRangeInput[];
  }): { count: number; slots: FreeSlot[] } {
    const startMinutes = parseTimeToMinutes(workingHours.start);
    const endMinutes = parseTimeToMinutes(workingHours.end);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return { count: 0, slots: [] };
    }

    const workStart = new Date(date);
    workStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    const workEnd = new Date(date);
    workEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

    const isToday = date.toDateString() === (nowRef || new Date()).toDateString();
    const effectiveStart = isToday ? new Date(Math.max(workStart.getTime(), (nowRef || new Date()).getTime())) : workStart;

    if (effectiveStart >= workEnd) {
      return { count: 0, slots: [] };
    }

    const busyRanges: Array<{ start: Date; end: Date }> = [];

    appointments
      .filter(a => {
        const appStart = new Date(a.start_time);
        const appEnd = new Date(a.end_time);
        const status = String(a.status || '').toUpperCase();

        if (appStart.toDateString() !== date.toDateString()) return false;
        if (status === 'CANCELLED' || status === 'NO_SHOW') return false;
        return appEnd > workStart && appStart < workEnd;
      })
      .forEach(a => {
        const start = new Date(Math.max(new Date(a.start_time).getTime(), effectiveStart.getTime()));
        const end = new Date(Math.min(new Date(a.end_time).getTime(), workEnd.getTime()));
        if (end > start) busyRanges.push({ start, end });
      });

    blockedPeriods.forEach(period => {
      const periodStart = period.start instanceof Date ? period.start : new Date(period.start);
      const periodEnd = period.end instanceof Date ? period.end : new Date(period.end);

      if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) return;
      if (periodStart.toDateString() !== date.toDateString()) return;

      const start = new Date(Math.max(periodStart.getTime(), effectiveStart.getTime()));
      const end = new Date(Math.min(periodEnd.getTime(), workEnd.getTime()));
      if (end > start) busyRanges.push({ start, end });
    });

    const sortedBusy = busyRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
    const mergedBusy: Array<{ start: Date; end: Date }> = [];

    sortedBusy.forEach(range => {
      const last = mergedBusy[mergedBusy.length - 1];
      if (!last || range.start > last.end) {
        mergedBusy.push({ start: new Date(range.start), end: new Date(range.end) });
        return;
      }
      if (range.end > last.end) {
        last.end = new Date(range.end);
      }
    });

    const slots: FreeSlot[] = [];
    let cursor = new Date(effectiveStart);

    mergedBusy.forEach(range => {
      if (range.start > cursor) {
        const duration = (range.start.getTime() - cursor.getTime()) / (1000 * 60);
        if (duration >= minSlotMinutes) {
          slots.push({ startTime: new Date(cursor), endTime: new Date(range.start), duration });
        }
      }
      if (range.end > cursor) {
        cursor = new Date(range.end);
      }
    });

    if (cursor < workEnd) {
      const duration = (workEnd.getTime() - cursor.getTime()) / (1000 * 60);
      if (duration >= minSlotMinutes) {
        slots.push({ startTime: new Date(cursor), endTime: new Date(workEnd), duration });
      }
    }

    return { count: slots.length, slots };
  }

  const findAvailableSlots = (date: Date, workingHours = { start: 8, end: 18 }) => {
    const workingRange: WorkingHoursRange = {
      start: `${String(workingHours.start).padStart(2, '0')}:00`,
      end: `${String(workingHours.end).padStart(2, '0')}:00`
    };

    const result = calculateDailyOpportunities({
      appointments,
      date,
      workingHours: workingRange,
      minSlotMinutes: 15,
      nowRef: now
    });

    return result.slots
      .map(slot => ({
        ...slot,
        procedure: getProcedureByDuration(slot.duration)
      }))
      .sort((a, b) => b.duration - a.duration);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure dentist_id is set - fallback to user if not already set
    const dentist_id = newAppointment.dentist_id || (user?.id ? user.id.toString() : null);
    const savedUser = localStorage.getItem('user');
    const fallbackDentistId = dentist_id || (savedUser ? JSON.parse(savedUser)?.id?.toString() : null);

    // Debug logs
    console.log('New appointment data:', newAppointment);
    console.log('User:', user);
    console.log('Dentist ID:', fallbackDentistId);

    // Improved validation with better error messages
    if (!newAppointment.patient_id || newAppointment.patient_id === '') {
      alert('Por favor, selecione um paciente.');
      return;
    }
    if (!fallbackDentistId) {
      alert('Erro: Dentista não identificado. Tente recarregar a página.');
      return;
    }
    if (!newAppointment.date || newAppointment.date === '') {
      alert('Por favor, selecione a data da consulta.');
      return;
    }
    if (!newAppointment.time || newAppointment.time === '') {
      alert('Por favor, selecione o horário da consulta.');
      return;
    }
    if (!newAppointment.duration || newAppointment.duration === '') {
      alert('Por favor, informe a duração da consulta em minutos.');
      return;
    }
    const durationMinutes = parseInt(newAppointment.duration, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert('A duração da consulta deve ser um número maior que 0.');
      return;
    }

    // Calculate start and end times
    const startTime = new Date(`${newAppointment.date}T${newAppointment.time}`);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    try {
      const formattedProcedure = formatProcedure(newAppointment.notes || '');
      const body = {
        ...newAppointment,
        notes: formattedProcedure,
        dentist_id: fallbackDentistId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      };

      const res = await apiFetch(editingAppointment ? `/api/appointments/${editingAppointment.id}` : '/api/appointments', {
        method: editingAppointment ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setSuggestedSlot(null);
        setEditingAppointment(null);
        fetchData();

        setNewAppointment({ patient_id: '', dentist_id: '', date: '', time: '', duration: '', notes: '' });
        showNotification(editingAppointment ? 'Agendamento atualizado com sucesso!' : 'Agendamento realizado com sucesso!');
      } else {
        showNotification(data.error || (editingAppointment ? 'Erro ao atualizar agendamento' : 'Erro ao realizar agendamento'), 'error');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      showNotification(editingAppointment ? 'Erro de conexão ao atualizar agendamento' : 'Erro de conexão ao realizar agendamento', 'error');
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await apiFetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify(newPatient)
      });
      if (res.ok) {
        const data = await res.json();
        setIsPatientModalOpen(false);
        fetchData();
        
        setNewPatient({ name: '', cpf: '', birth_date: '', phone: '', email: '', address: '' });
        showNotification('Paciente cadastrado com sucesso!');
      } else {
        const data = await res.json();
        showNotification(data.error || 'Erro ao cadastrar paciente', 'error');
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      showNotification('Erro de conexão ao cadastrar paciente', 'error');
    }
  };

  const handleCreateDentist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/dentists', {
        method: 'POST',
        body: JSON.stringify(newDentist)
      });
      if (res.ok) {
        setIsDentistModalOpen(false);
        fetchAdminUsers();
        setNewDentist({ name: '', email: '', password: '' });
        alert('Dentista cadastrado com sucesso!');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao cadastrar dentista');
      }
    } catch (error) {
      console.error('Error creating dentist:', error);
      alert('Erro de conexão ao cadastrar dentista');
    }
  };

  const handleUpdateDentist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDentist) return;
    try {
      const res = await apiFetch(`/api/admin/users/${editingDentist.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editingDentist.name, email: editingDentist.email })
      });
      if (res.ok) {
        setIsEditDentistModalOpen(false);
        fetchAdminUsers();
        alert('Dentista atualizado com sucesso!');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar dentista');
      }
    } catch (error) {
      console.error('Error updating dentist:', error);
      alert('Erro de conexão ao atualizar dentista');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage({ ...newImage, url: reader.result as string, file: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !newImage.file) return;
    try {
      await uploadFile(selectedPatient.id, newImage.file, newImage.description);
      setIsImageModalOpen(false);
      setNewImage({ url: '', description: '', file: null });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const isNextAppointment = (app: Appointment, allApps: Appointment[]) => {
    const futureApps = allApps
      .filter(a => new Date(a.start_time) > now && a.status !== 'CANCELLED' && a.status !== 'FINISHED')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return futureApps.length > 0 && futureApps[0].id === app.id;
  };

  const updateStatus = async (id: number, status: Appointment['status']) => {
    try {
      const res = await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (status === 'FINISHED') {
          const app = appointments.find(a => a.id === id);
          if (app) {
            setTransactionType('INCOME');
            setNewTransaction({
              description: `Atendimento - ${app.patient_name}`,
              category: 'Procedimentos',
              amount: '',
              payment_method: 'PIX',
              date: new Date().toLocaleDateString('en-CA'),
              status: 'PAID',
              patient_id: app.patient_id.toString(),
              procedure: '',
              notes: `Referente ao agendamento #${app.id}`
            });
            setIsTransactionModalOpen(true);
            setActiveTab('financeiro');
          }
        }
        fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openPatientRecord = async (id: number) => {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/patients/${id}`);
      const data = await res.json();
      setSelectedPatient(data);
      setActiveTab('prontuario');
    } catch (error) {
      console.error('Error fetching patient record:', error);
    }
  };

  const handleUpdateAnamnesis = async (patientId: number, anamnesisData: any) => {
    try {
      const res = await apiFetch(`/api/patients/${patientId}/anamnesis`, {
        method: 'PUT',
        body: JSON.stringify(anamnesisData)
      });
      if (res.ok) {
        setPatients(prev => prev.map(p => {
          if (p.id === patientId) {
            return { ...p, anamnesis: anamnesisData };
          }
          return p;
        }));
        showNotification('Anamnese salva com sucesso!');
      } else {
        const data = await res.json();
        showNotification(data.error || 'Erro ao salvar anamnese', 'error');
      }
    } catch (error) {
      console.error('Error saving anamnesis:', error);
      showNotification('Erro de conexão ao salvar anamnese', 'error');
    }
  };

  const saveAnamnesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    await handleUpdateAnamnesis(selectedPatient.id, selectedPatient.anamnesis);
  };

  const saveOdontogram = async (toothNumber: number, toothData: any) => {
    if (!selectedPatient) return;
    const updatedOdontogram = {
      ...(selectedPatient.odontogram || {}),
      [toothNumber]: toothData
    };
    
    try {
      const res = await apiFetch(`/api/patients/${selectedPatient.id}/odontogram`, {
        method: 'POST',
        body: JSON.stringify({ data: updatedOdontogram })
      });
      if (res.ok) {
        setSelectedPatient({ ...selectedPatient, odontogram: updatedOdontogram });
      }
    } catch (error) {
      console.error('Error saving odontogram:', error);
    }
  };

  const addToothHistory = async (record: any) => {
    if (!selectedPatient) return;
    try {
      const res = await apiFetch(`/api/patients/${selectedPatient.id}/tooth-history`, {
        method: 'POST',
        body: JSON.stringify(record)
      });
      if (res.ok) {
        // Refresh patient data to show new history
        openPatientRecord(selectedPatient.id);
      }
    } catch (error) {
      console.error('Error adding tooth history:', error);
      throw error;
    }
  };

  const addEvolution = async (evolutionData: any) => {
    if (!selectedPatient || !user) return;
    try {
      const res = await apiFetch(`/api/patients/${selectedPatient.id}/evolution`, {
        method: 'POST',
        body: JSON.stringify({ 
          notes: evolutionData.notes, 
          procedure_performed: evolutionData.procedure,
          materials: evolutionData.materials,
          observations: evolutionData.observations
        })
      });
      if (res.ok) {
        openPatientRecord(selectedPatient.id);
        showNotification('Evolução clínica registrada!');
      } else {
        const data = await res.json();
        showNotification(data.error || 'Erro ao registrar evolução', 'error');
      }
    } catch (error) {
      console.error('Error adding evolution:', error);
      showNotification('Erro de conexão ao registrar evolução', 'error');
    }
  };

  const sendReminder = async (app: Appointment) => {
    if (!app.patient_phone) {
      alert('Este paciente não possui telefone cadastrado.');
      return;
    }

    // Calcula o dia natural da consulta
    const appointmentDate = new Date(app.start_time);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const daysUntilAppointment = Math.floor((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let dayDescription = '';
    if (daysUntilAppointment === 0) {
      dayDescription = 'hoje';
    } else if (daysUntilAppointment === 1) {
      dayDescription = 'amanhã';
    } else if (daysUntilAppointment > 1 && daysUntilAppointment <= 6) {
      const daysOfWeek = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const dayOfWeek = appointmentDate.getDay();
      dayDescription = `no próximo ${daysOfWeek[dayOfWeek]}`;
    } else {
      dayDescription = `em ${appointmentDate.toLocaleDateString('pt-BR')}`;
    }

    // Formata a mensagem de WhatsApp conforme solicitado
    const time = new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const message = `Olá ${app.patient_name}, você confirma sua consulta ${dayDescription} às ${time}?`;
    
    // Limpa o número de telefone (apenas números)
    let phone = app.patient_phone.replace(/\D/g, '');
    
    // Garante o formato internacional (55 + DDD + número)
    if (phone.length === 10 || phone.length === 11) {
      phone = '55' + phone;
    } else if (phone.length > 11 && !phone.startsWith('55')) {
      // Se tiver mais de 11 dígitos e não começar com 55, assume que falta o DDI
      phone = '55' + phone;
    }
    
    // Abre o WhatsApp usando wa.me (melhor compatibilidade mobile/desktop)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    // No mobile, window.open pode ser bloqueado se houver um await antes.
    // Abrimos primeiro e depois fazemos a chamada de log no backend.
    window.open(url, '_blank');

    try {
      // Chama o backend para registrar o lembrete enviado
      await apiFetch(`/api/appointments/${app.id}/remind`, { method: 'POST' });
    } catch (error) {
      console.error('Error sending reminder log:', error);
    }
  };

  const uploadFile = async (patientId: number, file: File, description: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('file_type', 'image');

    try {
      const res = await apiFetch(`/api/patients/${patientId}/files`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) openPatientRecord(patientId);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const deleteFile = async (fileId: number) => {
    if (!selectedPatient) return;
    setConfirmation({
      message: 'Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/files/${fileId}`, { method: 'DELETE' });
          if (res.ok) {
            openPatientRecord(selectedPatient.id);
            showNotification('Arquivo excluído com sucesso!');
          }
        } catch (error) {
          console.error('Error deleting file:', error);
          showNotification('Erro ao excluir arquivo', 'error');
        }
      }
    });
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    try {
      const res = await apiFetch(`/api/patients/${updatedPatient.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedPatient)
      });
      if (res.ok) {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        showNotification('Dados do paciente atualizados!');
      } else {
        const data = await res.json();
        showNotification(data.error || 'Erro ao atualizar paciente', 'error');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      showNotification('Erro de conexão ao atualizar paciente', 'error');
    }
  };

  const handleAddTransaction = async (transaction: any) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update journey status if it's for the selected patient
    if (selectedPatient && transaction.patient_id === selectedPatient.id) {
      const updatedPatient = {
        ...selectedPatient,
        journey: {
          ...(selectedPatient.journey || {}),
          pagamento: 'CONCLUIDO'
        }
      };
      setSelectedPatient(updatedPatient);
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    }
  };

  return (
    <Routes>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pacientes/:id/clinico" element={
        user ? (
          <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 relative overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] tablet-l:hidden"
                />
              )}
            </AnimatePresence>

            <aside className={`
              fixed inset-y-0 left-0 z-[110] bg-white border-r border-slate-200 p-4 md:p-6 flex flex-col transition-all duration-300 ease-in-out tablet-l:static tablet-l:translate-x-0 no-print
              ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 tablet-l:w-20 desktop:w-72'}
            `}>
              <div className="flex items-center justify-between mb-10 px-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                    <Plus size={24} strokeWidth={3} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-800 whitespace-nowrap tablet-l:hidden desktop:block">OdontoHub</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="tablet-l:hidden text-slate-400">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <nav className="space-y-2 flex-1">
                <SidebarItem id="dashboard" icon={ClipboardList} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
                <SidebarItem id="agenda" icon={Calendar} label="Agenda" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
                <SidebarItem id="pacientes" icon={Users} label="Pacientes" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
                <SidebarItem id="financeiro" icon={DollarSign} label="Financeiro" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
                <SidebarItem id="documentos" icon={FileText} label="Documentos" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
                <SidebarItem id="configuracoes" icon={Settings} label="Configurações" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
              </nav>
            </aside>
            <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
              <ClinicalPageRoute 
                transactions={transactions}
                appointments={appointments}
                onUpdatePatient={handleUpdatePatient}
                onUpdateAnamnesis={handleUpdateAnamnesis}
                onAddEvolution={addEvolution}
                onAddTransaction={handleAddTransaction}
                dentistName={profile?.name || ''}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                apiFetch={apiFetch}
                setAppActiveTab={setActiveTab}
                navigate={navigate}
              />
            </main>
          </div>
        ) : <Navigate to="/" />
      } />
      <Route path="/nova-evolucao" element={<NovaEvolucao />} />
      <Route path="/termos" element={<TermsPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="/print/:tipo/:id?" element={
        <PrintDocument 
          profile={profile} 
          patients={patients} 
          apiFetch={apiFetch} 
          appointments={appointments} 
          transactions={transactions} 
          installments={installments} 
          paymentPlans={paymentPlans} 
        />
      } />
      <Route path="*" element={
        !user ? (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-center mb-8">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/10">
                    <Plus size={32} strokeWidth={3} />
                  </div>
                </div>
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">OdontoHub</h1>
                  <p className="text-slate-500">Acesse sua conta para gerenciar sua clínica</p>
                </div>

                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
                  {isRegistering && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nome Completo</label>
                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          required
                          placeholder="Dr. João Silva"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        required
                        placeholder="exemplo@clinica.com"
                        value={isRegistering ? registerData.email : loginData.email}
                        onChange={(e) => isRegistering 
                          ? setRegisterData({...registerData, email: e.target.value})
                          : setLoginData({...loginData, email: e.target.value})
                        }
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={isRegistering ? registerData.password : loginData.password}
                        onChange={(e) => isRegistering
                          ? setRegisterData({...registerData, password: e.target.value})
                          : setLoginData({...loginData, password: e.target.value})
                        }
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {!isRegistering && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input 
                          id="remember-me"
                          type="checkbox" 
                          checked={loginData.rememberMe}
                          onChange={(e) => setLoginData({...loginData, rememberMe: e.target.checked})}
                          className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-medium cursor-pointer">
                          Lembrar de mim
                        </label>
                      </div>
                      <Link to="/forgot-password" title="Recuperar senha" className="text-sm text-primary font-bold hover:underline">
                        Esqueci minha senha
                      </Link>
                    </div>
                  )}

                  {loginError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm">
                      <AlertCircle size={18} />
                      {loginError}
                    </div>
                  )}

                  {registerMessage && (
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-primary text-sm">
                      <CheckCircle2 size={18} />
                      {registerMessage}
                    </div>
                  )}

                  {isRegistering && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <input 
                          id="accepted-terms"
                          type="checkbox" 
                          required
                          checked={registerData.acceptedTerms && registerData.acceptedPrivacyPolicy}
                          onChange={(e) => setRegisterData({
                            ...registerData, 
                            acceptedTerms: e.target.checked,
                            acceptedPrivacyPolicy: e.target.checked
                          })}
                          className="mt-1 w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="accepted-terms" className="text-sm text-slate-600 leading-tight">
                          Li e concordo com os <Link to="/termos" target="_blank" className="text-primary font-bold hover:underline">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="text-primary font-bold hover:underline">Política de Privacidade</Link>.
                        </label>
                      </div>

                      <div className="flex items-start gap-3">
                        <input 
                          id="accepted-responsibility"
                          type="checkbox" 
                          required
                          checked={registerData.acceptedResponsibility}
                          onChange={(e) => setRegisterData({...registerData, acceptedResponsibility: e.target.checked})}
                          className="mt-1 w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="accepted-responsibility" className="text-sm text-slate-600 leading-tight">
                          Declaro que sou responsável legal pelos dados dos pacientes cadastrados na plataforma.
                        </label>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-[0_12px_36px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    {isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}
                  </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <button 
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setLoginError('');
                      setRegisterMessage('');
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
                  </button>

                  <div className="pt-8 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">© 2026 OdontoHub</p>
                    <div className="flex justify-center gap-4 text-xs font-bold text-slate-500">
                      <Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
                      <span>|</span>
                      <Link to="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] tablet-l:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] bg-white border-r border-slate-200 p-4 md:p-6 flex flex-col transition-all duration-300 ease-in-out tablet-l:static tablet-l:translate-x-0 no-print
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 tablet-l:w-20 desktop:w-72'}
      `}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/10 shrink-0">
              <Plus size={24} strokeWidth={3} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 whitespace-nowrap tablet-l:hidden desktop:block">OdontoHub</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="tablet-l:hidden text-slate-400">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem id="dashboard" icon={ClipboardList} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
          <SidebarItem id="agenda" icon={Calendar} label="Agenda" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
          <SidebarItem id="pacientes" icon={Users} label="Pacientes" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
          <SidebarItem id="financeiro" icon={DollarSign} label="Financeiro" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
          <SidebarItem id="documentos" icon={FileText} label="Documentos" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
          {user?.role?.toUpperCase() === 'ADMIN' && (
            <SidebarItem id="admin" icon={UserCog} label="Gestão de Dentistas" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
          )}
          <SidebarItem id="configuracoes" icon={Settings} label="Configurações" activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 overflow-hidden border border-slate-200">
              {profile?.photo_url ? (
                <img 
                  src={profile.photo_url} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCircle size={24} />
              )}
            </div>
            <div className="tablet-l:hidden desktop:block whitespace-nowrap">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-rose-600 transition-colors overflow-hidden"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="text-sm font-medium tablet-l:hidden desktop:block whitespace-nowrap">Sair</span>
          </button>

          <div className="mt-6 pt-6 border-t border-slate-50 tablet-l:hidden desktop:block">
            <p className="text-[10px] text-slate-400 px-4 mb-2">© 2026 OdontoHub</p>
            <div className="flex flex-col gap-1 px-4 text-[10px] font-bold text-slate-500">
              <Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full max-w-full print:p-0 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-screen-xl mx-auto px-0 md:px-4"
          >
            {searchTerm && activeTab !== 'pacientes' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Resultados da Busca: "{searchTerm}"</h3>
                  <button onClick={() => setSearchTerm('')} className="text-sm text-slate-400 hover:text-slate-600">Limpar</button>
                </div>
                <div className="space-y-2">
                  {patients
                    .filter(p => (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || (p.cpf && p.cpf.includes(searchTerm)))
                    .slice(0, 5)
                    .map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setSearchTerm('');
                          openPatientRecord(p.id);
                        }}
                        className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold overflow-hidden border border-primary/20">
                            {p.photo_url ? (
                              <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              (p.name || '?').charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.cpf || 'Sem CPF'}</p>
                          </div>
                        </div>
                        <button 
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Ver Prontuário
                        </button>
                      </div>
                    ))}
                  {patients.filter(p => (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())).length === 0 && (
                    <p className="text-center py-4 text-slate-400 text-sm">Nenhum paciente encontrado.</p>
                  )}
                  {patients.filter(p => (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())).length > 5 && (
                    <button 
                      onClick={() => setActiveTab('pacientes')}
                      className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors"
                    >
                      Ver todos os resultados
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && !searchTerm && (
              <Dashboard 
                user={user}
                patients={patients}
                nextAppointments={nextAppointments}
                todayAppointmentsTotalCount={todayAppointmentsTotalCount}
                todayAppointmentsRemainingCount={todayAppointmentsRemainingCount}
                todayRevenue={dailyRevenue}
                tomorrowUnconfirmedCount={tomorrowUnconfirmedCount}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                openPatientRecord={openPatientRecord}
                setIsModalOpen={setIsModalOpen}
                setActiveTab={setActiveTab}
                sendReminder={sendReminder}
                onReschedule={(appointment) => openEditAppointmentModal(appointment, true)}
              />
            )}

            {activeTab === 'agenda' && (
              <div className="flex flex-col gap-14 pb-32 pt-10 px-2 max-w-screen-xl mx-auto w-full">
                {/* Clean Header */}
                <div className="flex flex-col gap-4 mb-6 no-print">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda</h2>
                      <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <button 
                      onClick={openAppointmentModal}
                      className="bg-primary text-white px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/10 active:scale-95 text-sm"
                    >
                      <Plus size={18} strokeWidth={3} />
                      Nova Consulta
                    </button>
                  </div>

                  {/* Focus Mode Toggle and View Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-full">
                      <button 
                        onClick={() => setAgendaFocusMode(true)}
                        className={`px-6 py-2 text-[13px] font-bold rounded-full transition-all flex items-center gap-2 ${agendaFocusMode ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Activity size={16} />
                        Modo Foco
                      </button>
                      <button 
                        onClick={() => setAgendaFocusMode(false)}
                        className={`px-6 py-2 text-[13px] font-bold rounded-full transition-all flex items-center gap-2 ${!agendaFocusMode ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <List size={16} />
                        Agenda Completa
                      </button>
                    </div>

                    {!agendaFocusMode && (
                      <div className="flex bg-slate-100 p-1 rounded-full">
                        <button 
                          onClick={() => setAgendaViewMode('day')}
                          className={`px-4 py-2 text-[12px] font-bold rounded-full transition-all ${agendaViewMode === 'day' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Dia
                        </button>
                        <button 
                          onClick={() => setAgendaViewMode('week')}
                          className={`px-4 py-2 text-[12px] font-bold rounded-full transition-all ${agendaViewMode === 'week' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Semana
                        </button>
                        <button 
                          onClick={() => setAgendaViewMode('month')}
                          className={`px-4 py-2 text-[12px] font-bold rounded-full transition-all ${agendaViewMode === 'month' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Mês
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.02)] overflow-hidden no-print">
                  <div className="divide-y divide-slate-100">
                    {(() => {
                      const getFilteredAppointments = () => {
                        // Show all statuses to allow visibility of all appointments
                        const effectiveStatusFilter = agendaViewMode === 'day' 
                          ? [...statusFilter, 'FINISHED'].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
                          : [...statusFilter, 'FINISHED', 'CANCELLED', 'NO_SHOW'].filter((v, i, a) => a.indexOf(v) === i); // Include all statuses in week/month
                        
                        let filtered = appointments.filter(a => effectiveStatusFilter.length === 0 || effectiveStatusFilter.includes(a.status))
                          .filter(a => agendaSearchTerm === '' || (a.patient_name || '').toLowerCase().includes((agendaSearchTerm || '').toLowerCase()));

                        if (agendaViewMode === 'day') {
                          filtered = filtered.filter(a => {
                            const appDate = new Date(a.start_time);
                            const isSelectedDate = appDate.toDateString() === selectedDate.toDateString();
                            const isFinishedPast = a.status === 'FINISHED' && appDate < new Date() && !isSelectedDate;
                            // Include appointments from selected date OR finished appointments from the past (not the selected date)
                            return isSelectedDate || isFinishedPast;
                          });
                        } else if (agendaViewMode === 'week') {
                          // Use selected date for week calculation
                          const dateToUse = selectedDate || new Date();
                          const startOfWeek = new Date(dateToUse);
                          startOfWeek.setDate(dateToUse.getDate() - dateToUse.getDay());
                          startOfWeek.setHours(0, 0, 0, 0);
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(startOfWeek.getDate() + 6);
                          endOfWeek.setHours(23, 59, 59, 999);

                          filtered = filtered.filter(a => {
                            const appDate = new Date(a.start_time);
                            return appDate >= startOfWeek && appDate <= endOfWeek;
                          });
                        } else if (agendaViewMode === 'month') {
                          const dateToUse = selectedDate || new Date();
                          filtered = filtered.filter(a => {
                            const appDate = new Date(a.start_time);
                            return appDate.getMonth() === dateToUse.getMonth() && appDate.getFullYear() === dateToUse.getFullYear();
                          });
                        }

                        return filtered.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                      };

                      const filtered = getFilteredAppointments();

                      if (filtered.length === 0 && agendaViewMode !== 'month') {
                        return (
                          <div className="p-20 text-center">
                            <Calendar className="mx-auto text-slate-200 mb-4" size={64} />
                            <p className="text-slate-500 font-medium">Nenhum agendamento encontrado para este período.</p>
                            <button 
                              onClick={openAppointmentModal}
                              className="mt-4 bg-primary text-white px-6 py-2.5 rounded-[30px] font-bold shadow-[0_8px_24px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                            >
                              Agendar agora
                            </button>
                          </div>
                        );
                      }

                      const renderAppointment = (app: Appointment, isFocusMode: boolean = false) => {
                        const isNext = isNextAppointment(app, filtered);
                        
                        return (
                          <div key={app.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:bg-slate-50 transition-all group relative ${isNext && !isFocusMode ? 'border-l-4 border-primary bg-primary/5' : 'border-l-4 border-transparent'}`}>
                            {/* Time column - hidden on week/month view mobile */}
                            <div className={`${agendaViewMode === 'day' ? '' : 'hidden sm:flex'} w-12 sm:w-16 pt-1 flex flex-col items-center shrink-0`}>
                              <p className={`text-[13px] sm:text-[15px] font-bold ${isNext && !isFocusMode ? 'text-primary' : 'text-slate-900'}`}>
                                {new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <div className={`w-[1px] ${agendaViewMode === 'day' ? 'flex-1' : 'h-8'} bg-slate-100 my-2`} />
                            </div>
                            
                            <div className="flex-1 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm group-hover:shadow-md transition-all flex flex-col gap-4">
                              {/* Head: Patient info and status */}
                              <div className="flex items-start gap-3 justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => openPatientRecord(app.patient_id)}>
                                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0 overflow-hidden border border-slate-200">
                                    {(() => {
                                      const patient = patients.find(p => p.id === app.patient_id);
                                      return patient?.photo_url ? (
                                        <img src={patient.photo_url} alt={app.patient_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <UserCircle size={24} />
                                      );
                                    })()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{app.patient_name}</p>
                                    <p className="text-xs sm:text-sm text-slate-500 truncate">{app.notes || 'Consulta'}</p>
                                  </div>
                                </div>

                                <select
                                  value={app.status}
                                  onChange={(e) => updateStatus(app.id, e.target.value as Appointment['status'])}
                                  className="px-2 sm:px-3 py-1 sm:py-2 bg-white border border-slate-200 rounded text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none whitespace-nowrap shrink-0"
                                >
                                  <option value="SCHEDULED">Agendado</option>
                                  <option value="CONFIRMED">Confirmado</option>
                                  <option value="IN_PROGRESS">Em Andamento</option>
                                  <option value="FINISHED">Finalizado</option>
                                  <option value="CANCELLED">Cancelado</option>
                                  <option value="NO_SHOW">Faltou</option>
                                </select>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <button 
                                  onClick={() => openEditAppointmentModal(app)}
                                  className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm rounded-full hover:bg-slate-50 transition-all"
                                >
                                  Editar
                                </button>
                                <button 
                                  onClick={() => {
                                    const patient = patients.find(p => p.id === app.patient_id);
                                    if (patient) openPatientRecord(patient.id);
                                    setActiveTab('prontuario');
                                    navigate(`/pacientes/${app.patient_id}/clinico`);
                                  }}
                                  className="flex-1 sm:flex-none bg-primary text-white px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                                >
                                  <Activity size={16} />
                                  <span className="hidden sm:inline">{app.status === 'FINISHED' ? 'Ver Prontuário' : 'Iniciar Atendimento'}</span>
                                  <span className="sm:hidden">{app.status === 'FINISHED' ? 'Ver' : 'Atender'}</span>
                                </button>
                                
                                <button 
                                  onClick={() => sendReminder(app)}
                                  className="p-2.5 text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-all shrink-0"
                                  title="WhatsApp"
                                >
                                  <MessageCircle size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      };

                      if (agendaFocusMode) {
                        const todayStr = new Date().toDateString();
                        const isToday = selectedDate.toDateString() === todayStr;
                        const todayApps = filtered.filter(a => new Date(a.start_time).toDateString() === todayStr);
                        const nextApps = todayApps
                          .filter(a => new Date(a.start_time) > now && a.status !== 'CANCELLED' && a.status !== 'FINISHED')
                          .slice(0, 3);

                        return (
                          <div className="divide-y divide-slate-100">
                            {/* Current Time Indicator */}
                            {isToday && (
                              <div className="py-4 px-6 flex items-center gap-3">
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                  <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">Agora</span>
                                </div>
                                <div className="h-[1px] flex-1 bg-rose-200/50" />
                              </div>
                            )}
                            
                            {/* Next Appointments */}
                            {nextApps.length > 0 ? nextApps.map(app => renderAppointment(app, true)) : (
                              <div className="px-6 py-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <CheckCircle2 className="text-slate-200" size={32} />
                                </div>
                                <p className="text-slate-500 font-medium">Nenhum paciente próximo para hoje.</p>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Full Agenda Mode - Different views based on agendaViewMode
                      if (agendaViewMode === 'week') {
                        // Week grid view (show selected week)
                        const current = selectedDate || new Date();
                        const startOfWeek = new Date(current);
                        startOfWeek.setDate(current.getDate() - current.getDay());
                        
                        const weekDays = [];
                        for (let i = 0; i < 7; i++) {
                          const day = new Date(startOfWeek);
                          day.setDate(startOfWeek.getDate() + i);
                          weekDays.push(day);
                        }

                        // Calculate earliest and latest appointment times for the week
                        let earliestHour = 6;
                        let latestHour = 22;
                        
                        if (filtered.length > 0) {
                          const hours = filtered.map(a => new Date(a.start_time).getHours());
                          earliestHour = Math.min(...hours);
                          latestHour = Math.max(...hours);
                          
                          // Add one hour buffer before and after
                          earliestHour = Math.max(0, earliestHour - 1);
                          latestHour = Math.min(23, latestHour + 1);
                        }

                        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        const timeSlots = [];
                        for (let h = earliestHour; h <= latestHour; h++) {
                          timeSlots.push(h);
                        }

                        return (
                          <div className="space-y-4">
                            {/* Week header with day names and dates */}
                            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-x divide-slate-200">
                                {/* Time column header */}
                                <div className="bg-slate-50 p-2 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hora</span>
                                </div>
                                
                                {/* Day headers */}
                                {weekDays.map((day, idx) => {
                                  const isToday = day.toDateString() === new Date().toDateString();
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`p-3 text-center ${
                                        isToday ? 'bg-primary/10' : 'bg-slate-50'
                                      }`}
                                    >
                                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        {dayLabels[idx]}
                                      </div>
                                      <div className={`text-lg font-bold mt-1 ${isToday ? 'text-primary' : 'text-slate-900'}`}>
                                        {day.getDate()}
                                      </div>
                                      {isToday && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Time slots grid */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                              {timeSlots.map(hour => (
                                <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 border-b border-slate-200 last:border-b-0 min-h-[60px] divide-x divide-slate-200">
                                  {/* Time label */}
                                  <div className="bg-slate-50 p-2 flex items-center justify-center border-b border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {String(hour).padStart(2, '0')}:00
                                    </span>
                                  </div>

                                  {/* Day columns */}
                                  {weekDays.map((day, dayIdx) => {
                                    const dayAppointments = filtered.filter(a => {
                                      const appDate = new Date(a.start_time);
                                      const appHour = appDate.getHours();
                                      // Show appointment if it starts in this hour
                                      return appDate.toDateString() === day.toDateString() && appHour === hour;
                                    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                                    const isToday = day.toDateString() === new Date().toDateString();

                                    return (
                                      <div 
                                        key={dayIdx}
                                        className={`p-1.5 relative ${
                                          isToday ? 'bg-primary/5' : 'bg-white'
                                        } hover:bg-slate-50 transition-colors`}
                                      >
                                        <div className="space-y-1">
                                          {dayAppointments.slice(0, 3).map(app => {
                                            const firstName = (app.patient_name || '').split(' ')[0] || app.patient_name;
                                            const colors = getProcedureColor(app.notes || '');
                                            const isFinished = getEffectiveStatus(app) === 'FINISHED';
                                            const cardBgColor = isFinished ? '#F8FAFC' : colors.bg;
                                            const cardHoverColor = isFinished ? '#F8FAFC' : colors.hover;
                                            return (
                                              <div
                                                key={app.id}
                                                style={{
                                                  backgroundColor: cardBgColor,
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = cardHoverColor}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = cardBgColor}
                                                className={`rounded text-[8px] px-1 py-0.5 font-medium cursor-pointer transition-colors min-h-6 flex flex-col justify-center overflow-hidden ${
                                                  isFinished ? 'text-slate-400 border border-slate-200' : 'text-white'
                                                }`}
                                                title={`${app.patient_name} - ${new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                                onClick={() => setWeekSheetSelectedAppointment(app)}
                                              >
                                                <div className="truncate leading-tight">{firstName}</div>
                                                <div className="text-[7px] opacity-90 leading-tight">
                                                  {new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {dayAppointments.length > 3 && (
                                            <div className="text-[7px] text-primary font-bold px-1 py-0.5">
                                              +{dayAppointments.length - 3}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>

                            {/* Bottom Sheet for selected appointment in week view */}
                            {weekSheetSelectedAppointment && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setWeekSheetSelectedAppointment(null)}
                              />
                            )}
                            {weekSheetSelectedAppointment && (
                              <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed inset-x-0 bottom-0 z-[1000] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto pb-32"
                              >
                                <div className="p-6 space-y-6">
                                  {/* Close button and header */}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-2xl font-bold text-slate-900">
                                        {new Date(weekSheetSelectedAppointment.start_time).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' })}
                                      </h3>
                                      <p className="text-sm text-slate-500 mt-1">Detalhes do Agendamento</p>
                                    </div>
                                    <button
                                      onClick={() => setWeekSheetSelectedAppointment(null)}
                                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                      <X size={24} className="text-slate-400" />
                                    </button>
                                  </div>

                                  {/* Appointment details */}
                                  <div className="pt-4 space-y-6">
                                    {/* Time and duration */}
                                    <div className="space-y-2">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Horário</p>
                                      <div className="flex items-center gap-4">
                                        <div>
                                          <p className="text-2xl font-bold text-primary">
                                            {new Date(weekSheetSelectedAppointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                          <p className="text-[10px] text-slate-400 mt-1">
                                            {(() => {
                                              const start = new Date(weekSheetSelectedAppointment.start_time);
                                              const end = new Date(weekSheetSelectedAppointment.end_time);
                                              const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                                              return `${mins}min`;
                                            })()}
                                          </p>
                                        </div>
                                        <div className="h-12 w-[1px] bg-slate-200" />
                                        <div>
                                          <p className="text-sm text-slate-500">Término</p>
                                          <p className="text-lg font-bold text-slate-700 mt-0.5">
                                            {new Date(weekSheetSelectedAppointment.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Patient info */}
                                    <div className="border-t border-slate-100 pt-6 space-y-3">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paciente</p>
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 shrink-0">
                                          {(() => {
                                            const patient = patients.find(p => p.id === weekSheetSelectedAppointment.patient_id);
                                            return patient?.photo_url ? (
                                              <img src={patient.photo_url} alt={weekSheetSelectedAppointment.patient_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                              <UserCircle size={24} />
                                            );
                                          })()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-slate-900">{weekSheetSelectedAppointment.patient_name}</p>
                                          <p className="text-sm text-slate-500 truncate">{weekSheetSelectedAppointment.notes || 'Consulta'}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Status and controls */}
                                    <div className="border-t border-slate-100 pt-6 space-y-4">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ações</p>
                                      <div className="space-y-3">
                                        <select
                                          value={weekSheetSelectedAppointment.status}
                                          onChange={(e) => {
                                            updateStatus(weekSheetSelectedAppointment.id, e.target.value as Appointment['status']);
                                            setWeekSheetSelectedAppointment(null);
                                          }}
                                          className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                          <option value="SCHEDULED">Agendado</option>
                                          <option value="CONFIRMED">Confirmado</option>
                                          <option value="IN_PROGRESS">Em Andamento</option>
                                          <option value="FINISHED">Finalizado</option>
                                          <option value="CANCELLED">Cancelado</option>
                                          <option value="NO_SHOW">Faltou</option>
                                        </select>

                                        <button
                                          onClick={() => {
                                            const patient = patients.find(p => p.id === weekSheetSelectedAppointment.patient_id);
                                            if (patient) openPatientRecord(patient.id);
                                            setActiveTab('prontuario');
                                            navigate(`/pacientes/${weekSheetSelectedAppointment.patient_id}/clinico`);
                                            setWeekSheetSelectedAppointment(null);
                                          }}
                                          className="w-full bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                                        >
                                          <Activity size={18} />
                                          Iniciar Atendimento
                                        </button>

                                        <button
                                          onClick={() => {
                                            sendReminder(weekSheetSelectedAppointment);
                                            setWeekSheetSelectedAppointment(null);
                                          }}
                                          className="w-full bg-slate-50 text-primary px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-200"
                                        >
                                          <MessageCircle size={18} />
                                          Enviar Lembrete WhatsApp
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      } else if (agendaViewMode === 'month') {
                        // Interactive month view with bottom sheet
                        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
                        
                        const weeks = [];
                        let currentWeek = [];
                        let currentDate = new Date(startOfMonth);
                        
                        const firstDayOfWeek = startOfMonth.getDay();
                        for (let i = 0; i < firstDayOfWeek; i++) {
                          currentWeek.push(null);
                        }
                        
                        while (currentDate <= endOfMonth) {
                          currentWeek.push(new Date(currentDate));
                          if (currentWeek.length === 7) {
                            weeks.push(currentWeek);
                            currentWeek = [];
                          }
                          currentDate.setDate(currentDate.getDate() + 1);
                        }
                        
                        while (currentWeek.length < 7) {
                          currentWeek.push(null);
                        }
                        weeks.push(currentWeek);

                        const selectedDayAppointments = monthSheetSelectedDay
                          ? filtered.filter(a => {
                              const appDate = new Date(a.start_time);
                              return appDate.toDateString() === monthSheetSelectedDay.toDateString();
                            }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                          : [];

                        return (
                          <div className="space-y-4">
                            {/* Calendar grid */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                              {/* Month header with navigation */}
                              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => {
                                      const newDate = new Date(selectedDate);
                                      newDate.setMonth(newDate.getMonth() - 1);
                                      setSelectedDate(newDate);
                                    }}
                                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                                  >
                                    <ChevronLeft size={20} className="text-slate-600" />
                                  </button>
                                  <h3 className="text-xl font-bold text-slate-900 capitalize">
                                    {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                  </h3>
                                  <button
                                    onClick={() => {
                                      const newDate = new Date(selectedDate);
                                      newDate.setMonth(newDate.getMonth() + 1);
                                      setSelectedDate(newDate);
                                    }}
                                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                                  >
                                    <ChevronRight size={20} className="text-slate-600" />
                                  </button>
                                </div>
                              </div>

                              {/* Day headers */}
                              <div className="grid grid-cols-7 gap-0 border-b border-slate-200">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                  <div key={day} className="p-3 text-center border-r border-slate-100 last:border-r-0 bg-slate-50">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{day}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Calendar weeks */}
                              {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="grid grid-cols-7 gap-0 border-b border-slate-200 last:border-b-0">
                                  {week.map((day, dayIndex) => {
                                    if (!day) {
                                      return <div key={dayIndex} className="border-r border-slate-100 last:border-r-0 bg-slate-50/50" />;
                                    }

                                    const dayAppointments = filtered.filter(a => {
                                      const appDate = new Date(a.start_time);
                                      return appDate.toDateString() === day.toDateString();
                                    });

                                    const isToday = day.toDateString() === new Date().toDateString();
                                    const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                                    const isSelected = monthSheetSelectedDay?.toDateString() === day.toDateString();
                                    const hasAppointments = dayAppointments.length > 0;

                                    return (
                                      <div
                                        key={dayIndex}
                                        onClick={() => setMonthSheetSelectedDay(day)}
                                        className={`border-r border-slate-100 last:border-r-0 min-h-[100px] p-2 cursor-pointer transition-all relative ${
                                          isSelected 
                                            ? 'bg-primary/10 border-primary/50' 
                                            : isToday 
                                            ? 'bg-primary/5 hover:bg-primary/10' 
                                            : 'bg-white hover:bg-slate-50'
                                        } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                                      >
                                        {/* Day number */}
                                        <div className={`text-sm font-bold mb-2 ${
                                          isToday 
                                            ? 'text-primary' 
                                            : isCurrentMonth 
                                            ? 'text-slate-900' 
                                            : 'text-slate-400'
                                        }`}>
                                          {day.getDate()}
                                        </div>

                                        {/* Today indicator dot */}
                                        {isToday && (
                                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        )}

                                        {/* Appointment indicators */}
                                        {hasAppointments && (
                                          <div className="space-y-0.5">
                                            <div className="flex gap-0.5 flex-wrap">
                                              {dayAppointments.slice(0, 2).map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                                              ))}
                                            </div>
                                            <div className="text-[10px] font-bold text-primary">
                                              {dayAppointments.length} {dayAppointments.length === 1 ? 'consulta' : 'consultas'}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>

                            {/* Bottom Sheet for selected day */}
                            {monthSheetSelectedDay && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setMonthSheetSelectedDay(null)}
                              />
                            )}
                            {monthSheetSelectedDay && (
                              <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed inset-x-0 bottom-0 z-[1000] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto pb-32"
                              >
                                <div className="p-6 space-y-6">
                                  {/* Close button and header */}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-2xl font-bold text-slate-900">
                                        {monthSheetSelectedDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' })}
                                      </h3>
                                      <p className="text-sm text-slate-500 mt-1">
                                        {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => setMonthSheetSelectedDay(null)}
                                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                      <X size={24} className="text-slate-400" />
                                    </button>
                                  </div>

                                  {/* Appointments list for selected day */}
                                  {selectedDayAppointments.length > 0 ? (
                                    <div className="space-y-4 divide-y divide-slate-100">
                                      {selectedDayAppointments.map(app => (
                                        <div key={app.id} className="pt-4 first:pt-0">
                                          <div className="flex items-start gap-4">
                                            {/* Time */}
                                            <div className="flex-shrink-0 text-center">
                                              <p className="text-lg font-bold text-primary">
                                                {new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                              </p>
                                              <p className="text-[10px] text-slate-400 mt-1">
                                                {(() => {
                                                  const start = new Date(app.start_time);
                                                  const end = new Date(app.end_time);
                                                  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                                                  return `${mins}min`;
                                                })()}
                                              </p>
                                            </div>

                                            {/* Patient info and actions */}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-base font-bold text-slate-900">{app.patient_name}</p>
                                                  <p className="text-sm text-slate-500 truncate">{app.notes || 'Consulta'}</p>
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    const patient = patients.find(p => p.id === app.patient_id);
                                                    if (patient) openPatientRecord(patient.id);
                                                    setActiveTab('prontuario');
                                                    navigate(`/pacientes/${app.patient_id}/clinico`);
                                                    setMonthSheetSelectedDay(null);
                                                  }}
                                                  className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shrink-0"
                                                >
                                                  Atender
                                                </button>
                                              </div>

                                              {/* Status and actions */}
                                              <div className="flex items-center gap-2 mt-3">
                                                <select
                                                  value={app.status}
                                                  onChange={(e) => {
                                                    updateStatus(app.id, e.target.value as Appointment['status']);
                                                    setMonthSheetSelectedDay(null);
                                                  }}
                                                  className="px-2 py-1 text-xs bg-white border border-slate-200 rounded font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                                >
                                                  <option value="SCHEDULED">Agendado</option>
                                                  <option value="CONFIRMED">Confirmado</option>
                                                  <option value="IN_PROGRESS">Em Andamento</option>
                                                  <option value="FINISHED">Finalizado</option>
                                                  <option value="CANCELLED">Cancelado</option>
                                                  <option value="NO_SHOW">Faltou</option>
                                                </select>
                                                <button
                                                  onClick={() => sendReminder(app)}
                                                  className="p-1.5 text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-all"
                                                  title="WhatsApp"
                                                >
                                                  <MessageCircle size={16} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-12 text-center space-y-4">
                                      <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                                      <p className="text-slate-500 font-medium">Nenhum agendamento para este dia</p>
                                      <button
                                        onClick={() => {
                                          const slots = findAvailableSlots(monthSheetSelectedDay!);
                                          if (slots.length > 0) {
                                            const bestSlot = slots[0]; // Biggest slot
                                            setSuggestedSlot({
                                              date: bestSlot.startTime,
                                              duration: bestSlot.duration,
                                              procedure: bestSlot.procedure
                                            });
                                            setNewAppointment({
                                              patient_id: '',
                                              dentist_id: user?.id ? user.id.toString() : '',
                                              date: bestSlot.startTime.toISOString().split('T')[0],
                                              time: bestSlot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', ''),
                                              duration: Math.floor(bestSlot.duration).toString(),
                                              notes: bestSlot.procedure
                                            });
                                          } else {
                                            setNewAppointment({
                                              patient_id: '',
                                              dentist_id: user?.id ? user.id.toString() : '',
                                              date: monthSheetSelectedDay!.toISOString().split('T')[0],
                                              time: '',
                                              duration: '30',
                                              notes: ''
                                            });
                                          }
                                          setMonthSheetSelectedDay(null);
                                          setEditingAppointment(null);
                                          setIsModalOpen(true);
                                        }}
                                        className="bg-primary text-white px-6 py-3 rounded-full font-bold shadow-[0_12px_36px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                                      >
                                        <Plus size={18} />
                                        Criar Nova Consulta
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}

                          </div>
                        );
                      }

                      // Day view - Group by time periods
                      const currentDate = new Date();
                      const currentDateString = currentDate.toDateString();

                      const pastFinishedAppointments = filtered.filter(a => {
                        const appDate = new Date(a.start_time);
                        return a.status === 'FINISHED' && appDate < currentDate && appDate.toDateString() === currentDateString;
                      }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()); // Most recent first

                      const todayAppointments = filtered.filter(a => {
                        const appDate = new Date(a.start_time);
                        const isSelectedDay = appDate.toDateString() === selectedDate.toDateString();
                        const isFinishedEarlierToday = selectedDate.toDateString() === currentDateString && a.status === 'FINISHED' && appDate < currentDate;
                        return isSelectedDay && !isFinishedEarlierToday;
                      });

                      const morning = todayAppointments.filter(a => {
                        const hour = new Date(a.start_time).getHours();
                        return hour >= 6 && hour < 12;
                      });
                      const afternoon = todayAppointments.filter(a => {
                        const hour = new Date(a.start_time).getHours();
                        return hour >= 12 && hour < 18;
                      });
                      const evening = todayAppointments.filter(a => {
                        const hour = new Date(a.start_time).getHours();
                        return hour >= 18 && hour < 22;
                      });

                      const isToday = selectedDate.toDateString() === currentDateString;

                      const renderNowIndicator = () => (
                        <div key="now-indicator" className="py-4 px-6 flex items-center gap-3">
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">Agora</span>
                          </div>
                          <div className="h-[1px] flex-1 bg-rose-200/50" />
                        </div>
                      );

                      const renderPeriod = (apps: Appointment[], periodStart: number, periodEnd: number, label: string) => {
                        const nowHour = now.getHours();
                        const showNowInThisPeriod = isToday && nowHour >= periodStart && nowHour < periodEnd;
                        
                        if (apps.length === 0 && !showNowInThisPeriod) return null;

                        let content;
                        if (!showNowInThisPeriod) {
                          content = apps.map(app => renderAppointment(app));
                        } else {
                          const nowTime = now.getHours() * 60 + now.getMinutes();
                          const result = [];
                          let nowInserted = false;
                          
                          for (const app of apps) {
                            const appTime = new Date(app.start_time).getHours() * 60 + new Date(app.start_time).getMinutes();
                            if (!nowInserted && nowTime < appTime) {
                              result.push(renderNowIndicator());
                              nowInserted = true;
                            }
                            result.push(renderAppointment(app));
                          }
                          
                          if (!nowInserted) {
                            result.push(renderNowIndicator());
                          }
                          content = result;
                        }

                        return (
                          <div key={label} className="py-2">
                            <div className="px-6 py-2 flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">{label}</span>
                            </div>
                            {content}
                          </div>
                        );
                      };

                      return (
                        <div className="divide-y divide-[#C6C6C8]/5">
                          {/* Past finished appointments */}
                          {pastFinishedAppointments.length > 0 && (
                            <div className="py-4">
                              <div className="px-6 py-2 flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Consultas Anteriores Realizadas</span>
                              </div>
                              <div className="space-y-2">
                                {pastFinishedAppointments.map(app => renderAppointment(app))}
                              </div>
                            </div>
                          )}
                          {renderPeriod(morning, 6, 12, "Manhã")}
                          {renderPeriod(afternoon, 12, 18, "Tarde")}
                          {renderPeriod(evening, 18, 24, "Noite")}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pacientes' && (
              <div className="space-y-4 pt-10 px-2 max-w-2xl mx-auto">
                <header className="space-y-1.5 mb-4 px-2">
                  <h1 className="text-[28px] font-bold tracking-tight text-[#1C1C1E]">Pacientes</h1>
                  <p className="text-[14px] font-normal text-slate-400">
                    Acompanhe prioridades e oportunidades do dia
                  </p>
                </header>

                <div className="space-y-1.5 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 py-2 bg-slate-50/90 rounded-xl border border-transparent focus:outline-none focus:border-slate-200 focus:bg-white text-sm text-slate-700 placeholder:text-slate-400 transition-colors"
                      />
                    </div>

                    <button
                      onClick={() => setIsPatientModalOpen(true)}
                      className="w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors flex items-center justify-center shrink-0"
                      title="Novo paciente"
                      aria-label="Novo paciente"
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                </div>

                {statusBarItems.length > 0 && (
                  <div className="mb-2">
                    <div className="h-8 flex items-center gap-1.5 text-xs text-slate-500 px-1 overflow-x-auto whitespace-nowrap">
                      {statusBarItems.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <motion.button
                            onClick={item.onClick}
                            className={`inline-flex items-center ${item.tone} hover:text-slate-800 transition-colors`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <motion.span
                              key={`${item.id}-${item.text}`}
                              initial={{ opacity: 0.6, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.15 }}
                            >
                              {item.text}
                            </motion.span>
                          </motion.button>
                          {index < statusBarItems.length - 1 && <span className="text-slate-300">•</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    {todayAttendanceHint && (
                      <motion.p
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        className="px-1 mt-0.5 text-[11px] text-slate-400"
                      >
                        {todayAttendanceHint}
                      </motion.p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { id: 'ALL', label: 'Todos' },
                    { id: 'IN_TREATMENT', label: 'Em tratamento' },
                    { id: 'REVIEW', label: 'Revisão' },
                    { id: 'OVERDUE', label: 'Atrasados' }
                  ].map(chip => (
                    <button
                      key={chip.id}
                      onClick={() => setPatientManagementFilter(chip.id as 'ALL' | 'IN_TREATMENT' | 'REVIEW' | 'OVERDUE')}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        patientManagementFilter === chip.id
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-3 sm:p-4 space-y-2">
                    {patientCardsData.map(({ patient, meta }) => {
                      const statusConfig =
                        meta.priorityStatus === 'EM_TRATAMENTO'
                          ? { dot: 'bg-primary', badge: 'bg-primary/8 text-primary', label: 'Em tratamento', avatarBg: 'bg-primary/10 text-primary' }
                          : meta.priorityStatus === 'ATRASADO'
                            ? { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-600', label: 'Atrasado', avatarBg: 'bg-rose-50 text-rose-500' }
                            : meta.priorityStatus === 'REVISAO'
                              ? { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600', label: 'Revisão', avatarBg: 'bg-amber-50 text-amber-600' }
                              : { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600', label: 'Em dia', avatarBg: 'bg-emerald-50 text-emerald-600' };

                      const initials = patient.name.trim().split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0].toUpperCase()).join('');

                      return (
                        <div
                          key={patient.id}
                          onClick={() => openPatientRecord(patient.id)}
                          className="group cursor-pointer rounded-2xl border border-slate-100 bg-white px-4 py-3.5 hover:border-slate-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar minimalista */}
                            <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center ${patient.photo_url ? 'bg-slate-100' : statusConfig.avatarBg}`}>
                              {patient.photo_url ? (
                                <img src={patient.photo_url} alt={patient.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-[12px] font-semibold tracking-tight">{initials}</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[15px] font-semibold text-slate-900 truncate">{patient.name}</p>
                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${statusConfig.badge}`}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full align-middle mr-1 ${statusConfig.dot}`} />
                                {meta.timeSinceLastVisit}
                              </p>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAppointmentModalForPatient(patient);
                                }}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center"
                                aria-label="Agendar consulta"
                                title="Agendar consulta"
                              >
                                <Calendar size={14} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const whatsappUrl = getWhatsappUrl(patient.phone);
                                  if (whatsappUrl) {
                                    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center justify-center"
                                aria-label="Contato via WhatsApp"
                                title="Contato via WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>

                              <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-400 transition-colors ml-0.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {patientCardsData.length === 0 && (
                      <div className="p-10 text-center text-slate-500">
                        Nenhum paciente encontrado com os filtros atuais.
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}

            {activeTab === 'prontuario' && selectedPatient && (
              <PatientClinical
                patient={selectedPatient}
                appointments={appointments}
                onUpdatePatient={async (updated: any) => {
                  setSelectedPatient(updated);
                  await handleUpdatePatient(updated);
                }}
                onAddEvolution={async (data: any) => {
                  const updated = {
                    ...selectedPatient,
                    evolution: [data, ...(selectedPatient.evolution || [])],
                  };
                  setSelectedPatient(updated);
                  await addEvolution(data);
                }}
                setAppActiveTab={setActiveTab}
                navigate={navigate}
              />
            )}

            {activeTab === 'financeiro' && (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financeiro</h2>
                  <p className="text-sm text-slate-500">Controle de transações e parcelamentos</p>
                </div>
                <div className="flex border-b border-slate-100 mb-6">
                  {['transacoes', 'parcelamentos'].map((subTab) => (
                    <button
                      key={subTab}
                      onClick={() => setFinanceSubTab(subTab as any)}
                      className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                        financeSubTab === subTab 
                          ? 'border-primary text-primary bg-primary/5' 
                          : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {subTab === 'transacoes' ? 'Transações' : 'Parcelamentos'}
                    </button>
                  ))}
                </div>

                {financeSubTab === 'transacoes' ? (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <select 
                          value={financeFilter.period}
                          onChange={(e) => setFinanceFilter({...financeFilter, period: e.target.value})}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                        >
                          <option value="day">Hoje</option>
                          <option value="week">Últimos 7 dias</option>
                          <option value="month">Este Mês</option>
                          <option value="all">Tudo</option>
                        </select>
                        <select 
                          value={financeFilter.type}
                          onChange={(e) => setFinanceFilter({...financeFilter, type: e.target.value})}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                        >
                          <option value="all">Todos os Tipos</option>
                          <option value="INCOME">Receitas</option>
                          <option value="EXPENSE">Despesas</option>
                        </select>
                        <select 
                          value={financeFilter.category}
                          onChange={(e) => setFinanceFilter({...financeFilter, category: e.target.value})}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                        >
                          <option value="all">Todas Categorias</option>
                          <option value="Procedimentos">Procedimentos</option>
                          <option value="Consultas">Consultas</option>
                          <option value="Aluguel">Aluguel</option>
                          <option value="Materiais">Materiais</option>
                          <option value="Laboratório">Laboratório</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Salários">Salários</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => imprimirDocumento('relatorio')}
                          className="flex-1 sm:flex-none bg-white text-slate-600 border border-slate-200 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <Printer size={18} />
                          Relatório
                        </button>
                        <button 
                          onClick={() => {
                            setExportType('finance');
                            setIsExportModalOpen(true);
                          }}
                          className="flex-1 sm:flex-none bg-white text-slate-600 border border-slate-200 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <Download size={18} />
                          Exportar
                        </button>
                        <button 
                          onClick={() => {
                            setTransactionType('EXPENSE');
                            setIsTransactionModalOpen(true);
                          }}
                          className="flex-1 sm:flex-none bg-rose-50 text-rose-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <Plus size={18} />
                          Despesa
                        </button>
                        <button 
                          onClick={() => {
                            setTransactionType('INCOME');
                            setIsTransactionModalOpen(true);
                          }}
                          className="flex-1 sm:flex-none bg-primary text-white px-6 py-2.5 rounded-[30px] font-bold text-sm shadow-[0_8px_24px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <Plus size={18} />
                          Receita
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold text-slate-400 uppercase">Receita Total</p>
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                            <DollarSign size={16} />
                          </div>
                        </div>
                        <h4 className="text-2xl font-bold text-slate-800">
                          {currentTotalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">No período selecionado</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold text-slate-400 uppercase">Despesas</p>
                          <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                            <DollarSign size={16} />
                          </div>
                        </div>
                        <h4 className="text-2xl font-bold text-slate-800">
                          {currentTotalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">No período selecionado</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold text-slate-400 uppercase">Lucro Líquido</p>
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <DollarSign size={16} />
                          </div>
                        </div>
                        <h4 className={`text-2xl font-bold ${currentNetProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                          {currentNetProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[10px] text-blue-500 font-bold mt-2">Margem de {currentProfitMargin.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Histórico Financeiro</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase">{filteredTransactions.length} transações</span>
                      </div>
                      
                      {/* Desktop View */}
                      <div className="hidden md:block">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                              <th className="px-6 py-4">Data</th>
                              <th className="px-6 py-4">Descrição</th>
                              <th className="px-6 py-4">Categoria</th>
                              <th className="px-6 py-4">Pagamento</th>
                              <th className="px-6 py-4 text-right">Valor</th>
                              <th className="px-6 py-4"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-500">
                                  {formatDate(t.date)}
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-bold text-slate-800">{t.description}</p>
                                  {t.patient_name && <p className="text-[10px] text-slate-400 uppercase font-bold">Paciente: {t.patient_name}</p>}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">{t.category}</span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                  {t.payment_method}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-primary' : 'text-rose-600'}`}>
                                  {t.type === 'INCOME' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => generateReceipt(t)}
                                      className="p-2 text-slate-300 hover:text-primary transition-colors"
                                      title="Gerar Recibo"
                                    >
                                      <FileText size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTransaction(t.id)}
                                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                  Nenhuma transação encontrada no período.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile View */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {filteredTransactions.map((t) => (
                          <div key={t.id} className="p-4 flex justify-between items-center">
                            <div className="min-w-0 flex-1 pr-4">
                              <p className="font-bold text-slate-800 text-sm truncate">{t.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400">{formatDate(t.date)}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">• {t.category}</span>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-primary' : 'text-rose-600'}`}>
                                  {t.type === 'INCOME' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <div className="flex justify-end gap-2 mt-1">
                                  <button onClick={() => generateReceipt(t)} className="text-[10px] text-primary font-bold uppercase">Recibo</button>
                                  <button onClick={() => handleDeleteTransaction(t.id)} className="text-[10px] text-rose-500 font-bold uppercase">Excluir</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <div className="p-8 text-center text-slate-400">
                            Nenhuma transação encontrada.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total a Receber</p>
                        <h4 className="text-xl font-bold text-slate-800">
                          {(financialSummary?.pendingInstallmentsTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase">{financialSummary?.pendingInstallmentsCount || 0} parcelas pendentes</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total em Atraso</p>
                        <h4 className="text-xl font-bold text-rose-600">
                          {(financialSummary?.overdueInstallmentsTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">{financialSummary?.overdueInstallmentsCount || 0} parcelas atrasadas</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Recebido Hoje</p>
                        <h4 className="text-xl font-bold text-primary">
                          {(financialSummary?.todayRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[10px] text-primary font-bold mt-1 uppercase">Pagamentos confirmados</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Receita Mensal</p>
                        <h4 className="text-xl font-bold text-blue-600">
                          {(financialSummary?.monthlyRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">Mês atual</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="font-bold text-slate-800">Planos de Parcelamento Ativos</h3>
                        <button 
                          onClick={() => setIsPaymentPlanModalOpen(true)}
                          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline w-full sm:w-auto justify-center sm:justify-start py-2 sm:py-0 border sm:border-0 border-primary/10 rounded-lg sm:rounded-none"
                        >
                          <Plus size={14} /> Novo Plano
                        </button>
                      </div>
                      
                      <div className="hidden md:block w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                              <th className="px-6 py-4">Paciente</th>
                              <th className="px-6 py-4 hidden md:table-cell">Procedimento</th>
                              <th className="px-6 py-4 hidden sm:table-cell">Progresso</th>
                              <th className="px-6 py-4 text-right">Valor Total</th>
                              <th className="px-6 py-4 hidden md:table-cell">Status</th>
                              <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paymentPlans.map(plan => {
                              const planInstallments = installments.filter(i => i.payment_plan_id === plan.id);
                              const paidCount = planInstallments.filter(i => i.status === 'PAID').length;
                              const progress = (paidCount / plan.installments_count) * 100;
                              
                              return (
                                  <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 break-words">
                                      {plan.patient?.name || plan.patient_name || "Paciente não identificado"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 break-words hidden md:table-cell">{plan.procedure}</td>
                                  <td className="px-6 py-4 hidden sm:table-cell">
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{paidCount}/{plan.installments_count} parcelas pagas</p>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-slate-700">
                                    {Number(plan.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-6 py-4 hidden md:table-cell">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                      plan.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {plan.status === 'COMPLETED' ? 'Concluído' : 'Em Aberto'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                      <button 
                                        onClick={() => {
                                          const nextInstallment = planInstallments.find(i => i.status === 'PENDING');
                                          if (nextInstallment) {
                                            setSelectedInstallment({...nextInstallment, procedure: plan.procedure, patient_name: plan.patient_name});
                                            setIsReceiveInstallmentModalOpen(true);
                                          } else {
                                            alert('Todas as parcelas deste plano já foram pagas.');
                                          }
                                        }}
                                        className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                        title="Receber Parcela"
                                      >
                                        <DollarSign size={16} />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setSelectedPlan(plan);
                                          setIsViewInstallmentsModalOpen(true);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Ver Parcelas"
                                      >
                                        <ClipboardList size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {paymentPlans.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhum plano de parcelamento encontrado.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden p-4 space-y-3 bg-slate-50/50">
                        {paymentPlans.map(plan => {
                          const planInstallments = installments.filter(i => i.payment_plan_id === plan.id);
                          const paidCount = planInstallments.filter(i => i.status === 'PAID').length;
                          const progress = (paidCount / plan.installments_count) * 100;
                          
                          return (
                            <div key={plan.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                              <div className="flex justify-between items-start mb-3">
                                <div className="max-w-[70%]">
                                  <p className="font-bold text-slate-800 leading-tight mb-1">{plan.patient?.name || plan.patient_name || "Paciente não identificado"}</p>
                                  <p className="text-xs text-slate-500 truncate">{plan.procedure}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                                  plan.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {plan.status === 'COMPLETED' ? 'Concluído' : 'Em Aberto'}
                                </span>
                              </div>
                              
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Progresso</p>
                                  <p className="text-[10px] font-bold text-slate-600">{paidCount}/{plan.installments_count} parcelas</p>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Total</p>
                                  <p className="font-bold text-slate-700">
                                    {Number(plan.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const nextInstallment = planInstallments.find(i => i.status === 'PENDING');
                                      if (nextInstallment) {
                                        setSelectedInstallment({...nextInstallment, procedure: plan.procedure, patient_name: plan.patient_name});
                                        setIsReceiveInstallmentModalOpen(true);
                                      } else {
                                        alert('Todas as parcelas deste plano já foram pagas.');
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg font-bold text-xs hover:bg-primary/20 transition-colors"
                                  >
                                    <DollarSign size={14} />
                                    Receber
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setSelectedPlan(plan);
                                      setIsViewInstallmentsModalOpen(true);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                  >
                                    <ClipboardList size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {paymentPlans.length === 0 && (
                          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm italic">Nenhum plano de parcelamento encontrado.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'admin' && user?.role?.toUpperCase() === 'ADMIN') && (
              <div className="max-w-screen-xl mx-auto space-y-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Administração</h2>
                  <p className="text-sm text-slate-500">Gestão de dentistas e aprovações</p>
                </div>
                {/* Painel de Aprovação */}
                {adminUsers.filter(u => u.status === 'pending').length > 0 && (
                  <div className="bg-amber-50 p-4 md:p-8 rounded-3xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-amber-900">Aprovação de Novos Dentistas</h3>
                        <p className="text-amber-700 text-sm">Existem solicitações de cadastro pendentes</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adminUsers.filter(u => u.status === 'pending').map(u => (
                        <div key={u.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateUserStatus(u.id, 'active')}
                              className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
                              title="Aprovar"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button 
                              onClick={() => updateUserStatus(u.id, 'blocked')}
                              className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                              title="Rejeitar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gestão de Dentistas */}
                <div className="bg-white p-4 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">Gestão de Dentistas</h3>
                      <p className="text-slate-500 text-sm">Gerencie os profissionais da sua clínica</p>
                    </div>
                    <button 
                      onClick={() => setIsDentistModalOpen(true)}
                      className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_12px_36px_rgba(38,78,54,0.12)]"
                    >
                      <UserPlus size={20} />
                      Adicionar Dentista
                    </button>
                  </div>

                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text"
                        placeholder="Buscar dentista por nome ou e-mail..."
                        value={dentistSearchTerm}
                        onChange={(e) => setDentistSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="sm:w-48">
                      <select
                        value={dentistStatusFilter}
                        onChange={(e) => setDentistStatusFilter(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-600 font-medium"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativos</option>
                        <option value="blocked">Bloqueados</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">E-mail</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminUsers
                            .filter(u => u.status !== 'pending')
                            .filter(u => 
                              !dentistSearchTerm || 
                              u.name?.toLowerCase().includes(dentistSearchTerm.toLowerCase()) || 
                              u.email?.toLowerCase().includes(dentistSearchTerm.toLowerCase())
                            )
                            .filter(u => dentistStatusFilter === 'all' || u.status === dentistStatusFilter)
                            .map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                                    {(u.name || '?').charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800">{u.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">{u.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-sm">{u.email}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  u.status === 'active' ? 'bg-primary/10 text-primary' :
                                  'bg-rose-100 text-rose-700'
                                }`}>
                                  {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingDentist(u);
                                      setIsEditDentistModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                  >
                                    Editar
                                  </button>
                                  {u.status !== 'active' && (
                                    <button 
                                      onClick={() => updateUserStatus(u.id, 'active')}
                                      className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-colors"
                                    >
                                      Ativar
                                    </button>
                                  )}
                                  {u.status !== 'blocked' && u.role !== 'ADMIN' && (
                                    <button 
                                      onClick={() => updateUserStatus(u.id, 'blocked')}
                                      className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors"
                                    >
                                      Desativar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {adminUsers
                        .filter(u => u.status !== 'pending')
                        .filter(u => 
                          !dentistSearchTerm || 
                          u.name?.toLowerCase().includes(dentistSearchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(dentistSearchTerm.toLowerCase())
                        )
                        .filter(u => dentistStatusFilter === 'all' || u.status === dentistStatusFilter)
                        .map((u) => (
                        <div key={u.id} className="p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                                {(u.name || '?').charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{u.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{u.role}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.status === 'active' ? 'bg-primary/10 text-primary' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setEditingDentist(u);
                                setIsEditDentistModalOpen(true);
                              }}
                              className="flex-1 py-2 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              Editar
                            </button>
                            {u.status !== 'active' && (
                              <button 
                                onClick={() => updateUserStatus(u.id, 'active')}
                                className="flex-1 py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-colors"
                              >
                                Ativar
                              </button>
                            )}
                            {u.status !== 'blocked' && u.role !== 'ADMIN' && (
                              <button 
                                onClick={() => updateUserStatus(u.id, 'blocked')}
                                className="flex-1 py-2 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors"
                              >
                                Desativar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documentos' && (
              <div className="space-y-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Documentos</h2>
                  <p className="text-sm text-slate-500">Emissão de receitas, atestados e contratos</p>
                </div>
                <Documents patients={patients} profile={profile} apiFetch={apiFetch} imprimirDocumento={imprimirDocumento} />
              </div>
            )}

            {activeTab === 'configuracoes' && profile && (
              <div className="max-w-screen-xl mx-auto space-y-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações</h2>
                  <p className="text-sm text-slate-500">Gerencie seu perfil e preferências</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex flex-col items-center mb-10">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/5 shadow-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        {profile.photo_url ? (
                          <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserCircle size={80} />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-all">
                        <Camera size={18} />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mt-4">Perfil do Usuário</h3>
                    <p className="text-slate-500">Mantenha seus dados atualizados</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nome Completo</label>
                        <input 
                          required
                          type="text" 
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">E-mail</label>
                        <input 
                          required
                          type="email" 
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Telefone</label>
                        <input 
                          type="text" 
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      {user.role === 'DENTIST' && (
                        <>
                          <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">CRO</label>
                            <input 
                              type="text" 
                              value={profile.cro || ''}
                              onChange={(e) => setProfile({...profile, cro: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                              placeholder="Ex: 12345-SP"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Especialidade</label>
                            <input 
                              type="text" 
                              value={profile.specialty || ''}
                              onChange={(e) => setProfile({...profile, specialty: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                              placeholder="Ex: Ortodontia"
                            />
                          </div>
                        </>
                      )}
                      {user.role === 'DENTIST' && (
                        <>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nome da Clínica</label>
                            <input 
                              type="text" 
                              value={profile.clinic_name || ''}
                              onChange={(e) => setProfile({...profile, clinic_name: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                              placeholder="Ex: Clínica Sorriso Perfeito"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Endereço da Clínica</label>
                            <input 
                              type="text" 
                              value={profile.clinic_address || ''}
                              onChange={(e) => setProfile({...profile, clinic_address: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                              placeholder="Rua Exemplo, 123 - Centro"
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Alterar Senha</label>
                        <input 
                          type="password" 
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="Deixe em branco para manter a atual"
                        />
                      </div>
                    </div>

                    {user.role === 'DENTIST' && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Bio / Descrição Profissional</label>
                        <textarea 
                          rows={4}
                          value={profile.bio || ''}
                          onChange={(e) => setProfile({...profile, bio: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                          placeholder="Conte um pouco sobre sua trajetória e formação..."
                        />
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit"
                        disabled={isSavingProfile}
                        className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-[0_12px_36px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <FileText className="text-primary" />
                    Informações Legais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link 
                      to="/termos" 
                      target="_blank"
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termos de Uso</p>
                        <p className="text-[10px] text-slate-500">Leia as regras de uso da plataforma</p>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={16} />
                    </Link>
                    <Link 
                      to="/privacidade" 
                      target="_blank"
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Política de Privacidade</p>
                        <p className="text-[10px] text-slate-500">Saiba como cuidamos dos seus dados</p>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={16} />
                    </Link>
                  </div>
                  <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[10px] text-primary font-bold flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      TERMOS ACEITOS EM: {profile.accepted_terms_at ? new Date(profile.accepted_terms_at).toLocaleString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal de Exportação */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">Exportar Dados</h3>
                  <button onClick={() => setIsExportModalOpen(false)} className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">De</label>
                      <input 
                        type="date" 
                        value={exportFilters.startDate}
                        onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block\">Ate</label>
                      <input 
                        type="date" 
                        value={exportFilters.endDate}
                        onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block\">Paciente</label>
                    <select 
                      value={exportFilters.patientId}
                      onChange={(e) => setExportFilters({...exportFilters, patientId: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    >
                      <option value="all">Todos</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {exportType === 'finance' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block\">Tipo</label>
                      <select 
                        value={exportFilters.category}
                        onChange={(e) => setExportFilters({...exportFilters, category: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      >
                        <option value="all\">Receitas + Despesas</option>
                        <option value="income\">Receitas</option>
                        <option value="expense\">Despesas</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1.5">
                    <button 
                      onClick={() => setIsExportModalOpen(false)}
                      className="flex-1 h-12 border border-slate-200 bg-white/90 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={exportType === 'patients' ? exportPatients : exportFinance}
                      className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(38,78,54,0.2)] hover:opacity-95 transition-all active:scale-[0.98] text-sm"
                    >
                      Exportar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Novo Agendamento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setSuggestedSlot(null);
                setEditingAppointment(null);
              }}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/85 border border-slate-200/70 px-2.5 py-1">
                      <Clock size={14} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Agenda</span>
                    </div>
                    <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">{editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                  </div>
                  <button onClick={() => {
                    setIsModalOpen(false);
                    setSuggestedSlot(null);
                    setEditingAppointment(null);
                  }} className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                {suggestedSlot && (
                  <div className="mb-4 rounded-2xl border border-[#BFDBFE] bg-[linear-gradient(180deg,#EFF6FF,#DBEAFE)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <p className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-[0.12em] mb-1">Melhor horario</p>
                    <p className="text-[13px] text-[#1E3A8A] leading-relaxed">
                      Horario: <span className="font-bold">{suggestedSlot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span> •
                      {' '}Duracao: <span className="font-bold">{Math.floor(suggestedSlot.duration)}min</span> •
                      {' '}Procedimento: <span className="font-bold">{suggestedSlot.procedure}</span>
                    </p>
                  </div>
                )}

                <form onSubmit={handleCreateAppointment} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Horario</label>
                      <input
                        required
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Data</label>
                      <input
                        required
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] block">Duracao</label>
                      <div className="flex gap-1.5">
                        {[30, 45, 60].map((min) => (
                          <button
                            key={min}
                            type="button"
                            onClick={() => setNewAppointment({...newAppointment, duration: min.toString()})}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                              newAppointment.duration === min.toString()
                                ? 'bg-primary text-white'
                                : 'border border-slate-200 text-slate-600 hover:border-primary/30'
                            }`}
                          >
                            {min}min
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newAppointment.duration}
                      onChange={(e) => setNewAppointment({...newAppointment, duration: e.target.value})}
                      placeholder="Ex: 30"
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Paciente</label>
                    <select
                      required
                      value={newAppointment.patient_id}
                      onChange={(e) => setNewAppointment({...newAppointment, patient_id: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    >
                      <option value="">Selecione um paciente</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Procedimento</label>
                    <input
                      type="text"
                      value={newAppointment.notes || ''}
                      onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                      placeholder="Ex: endo 11"
                      maxLength={80}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSuggestedSlot(null);
                        setEditingAppointment(null);
                      }}
                      className="flex-1 h-12 border border-slate-200 bg-white/90 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(38,78,54,0.2)] hover:opacity-95 transition-all active:scale-[0.98] text-sm"
                    >
                      {editingAppointment ? 'Salvar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal de Novo Paciente */}
      <AnimatePresence>
        {isPatientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPatientModalOpen(false)}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">Novo Paciente</h3>
                  <button onClick={() => setIsPatientModalOpen(false)} className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleCreatePatient} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Nome</label>
                    <input 
                      required
                      type="text" 
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">CPF</label>
                      <input 
                        type="text" 
                        value={newPatient.cpf}
                        onChange={(e) => setNewPatient({...newPatient, cpf: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Nasc.</label>
                      <input 
                        type="date" 
                        value={newPatient.birth_date}
                        onChange={(e) => setNewPatient({...newPatient, birth_date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Telefone</label>
                      <input 
                        required
                        type="text" 
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">E-mail</label>
                      <input 
                        type="email" 
                        value={newPatient.email}
                        onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Endereço</label>
                    <input 
                      type="text" 
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-1.5">
                    <button 
                      type="button"
                      onClick={() => setIsPatientModalOpen(false)}
                      className="flex-1 h-12 border border-slate-200 bg-white/90 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(38,78,54,0.2)] hover:opacity-95 transition-all active:scale-[0.98] text-sm"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Editar Dentista */}
      <AnimatePresence>
        {isEditDentistModalOpen && editingDentist && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditDentistModalOpen(false)}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">Editar Dentista</h3>
                  <button onClick={() => setIsEditDentistModalOpen(false)} className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleUpdateDentist} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Nome</label>
                    <input 
                      required
                      type="text" 
                      value={editingDentist.name}
                      onChange={(e) => setEditingDentist({...editingDentist, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">E-mail</label>
                    <input 
                      required
                      type="email" 
                      value={editingDentist.email}
                      onChange={(e) => setEditingDentist({...editingDentist, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-1.5">
                    <button 
                      type="button"
                      onClick={() => setIsEditDentistModalOpen(false)}
                      className="flex-1 h-12 border border-slate-200 bg-white/90 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(38,78,54,0.2)] hover:opacity-95 transition-all active:scale-[0.98] text-sm"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Plano de Parcelamento */}
      <AnimatePresence>
        {isPaymentPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentPlanModalOpen(false)}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">Novo Plano</h3>
                  <button onClick={() => setIsPaymentPlanModalOpen(false)} className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleCreatePaymentPlan} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Procedimento</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Canal, Implante..."
                      value={newPaymentPlan.procedure}
                      onChange={(e) => setNewPaymentPlan({...newPaymentPlan, procedure: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Total (R$)</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        value={newPaymentPlan.total_amount}
                        onChange={(e) => setNewPaymentPlan({...newPaymentPlan, total_amount: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Parcelas</label>
                      <select 
                        required
                        value={newPaymentPlan.installments_count}
                        onChange={(e) => setNewPaymentPlan({...newPaymentPlan, installments_count: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      >
                        {[1, 2, 3, 4, 5, 6, 10, 12, 18, 24].map(n => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Primeiro Vencimento</label>
                    <input 
                      required
                      type="date" 
                      value={newPaymentPlan.first_due_date}
                      onChange={(e) => setNewPaymentPlan({...newPaymentPlan, first_due_date: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsPaymentPlanModalOpen(false)}
                      className="flex-1 h-12 border border-slate-200 bg-white/90 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(38,78,54,0.2)] hover:opacity-95 transition-all active:scale-[0.98] text-sm"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Recibo */}
      <AnimatePresence>
        {isReceiptModalOpen && selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 receipt-modal-overlay">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm no-print"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto receipt-content"
            >
              <div className="p-8 md:p-12 bg-white text-slate-800 font-serif">
                <div className="flex justify-between items-start mb-12 no-print">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                      <Plus size={24} strokeWidth={3} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">OdontoHub</h1>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => imprimirDocumento('recibo', selectedReceipt.id)}
                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Imprimir"
                    >
                      <Printer size={20} />
                    </button>
                    <button 
                      onClick={() => setIsReceiptModalOpen(false)}
                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Plus size={24} className="rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold uppercase tracking-widest border-b-2 border-slate-200 pb-4 inline-block px-12">Recibo</h2>
                  <p className="hidden print:block text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Via do Paciente</p>
                </div>

                <div className="space-y-8 text-lg leading-relaxed">
                  <p>
                    Recebi de <span className="font-bold border-b border-slate-300 px-2">{selectedReceipt.patientName}</span>, 
                    a importância de <span className="font-bold border-b border-slate-300 px-2">{selectedReceipt.amountFormatted}</span>, 
                    referente ao procedimento de <span className="font-bold border-b border-slate-300 px-2">{selectedReceipt.procedure}</span>.
                  </p>

                  <div className="flex justify-between items-center py-4">
                    <p>Forma de Pagamento: <span className="font-bold">{selectedReceipt.paymentMethod}</span></p>
                    <p>Data: <span className="font-bold">{selectedReceipt.date}</span></p>
                  </div>

                  <div className="pt-16 flex flex-col items-center">
                    <div className="w-64 border-t border-slate-400 mb-2"></div>
                    <p className="font-bold text-xl">{selectedReceipt.dentistName}</p>
                    <p className="text-slate-500 uppercase tracking-widest text-sm">CRO: {selectedReceipt.dentistCro || 'XXXXX'}</p>
                  </div>

                  <div className="pt-12 text-sm text-slate-400 text-center italic">
                    <p>{selectedReceipt.clinicName}</p>
                    <p>{selectedReceipt.clinicAddress}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Novo Dentista */}
      <AnimatePresence>
        {isDentistModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDentistModalOpen(false)}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">Novo Dentista</h3>
                  <button onClick={() => setIsDentistModalOpen(false)} className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleCreateDentist} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Nome</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Dr. Silva"
                      value={newDentist.name}
                      onChange={(e) => setNewDentist({...newDentist, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">E-mail</label>
                    <input 
                      required
                      type="email" 
                      placeholder="contato@example.com"
                      value={newDentist.email}
                      onChange={(e) => setNewDentist({...newDentist, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Senha</label>
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      value={newDentist.password}
                      onChange={(e) => setNewDentist({...newDentist, password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsDentistModalOpen(false)}
                      className="flex-1 h-12 border border-slate-200 bg-white/90 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(38,78,54,0.2)] hover:opacity-95 transition-all active:scale-[0.98] text-sm"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Upload de Imagem */}
      <AnimatePresence>
        {isImageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImageModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900">Upload de Imagem</h3>
                  <button onClick={() => setIsImageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleUploadImage} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Arquivo de Imagem</label>
                    <div className="relative group">
                      <input 
                        required={!newImage.url}
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label 
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden"
                      >
                        {newImage.url ? (
                          <div className="relative w-full h-full p-2">
                            <img src={newImage.url} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <p className="text-white text-xs font-bold">Alterar Imagem</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-primary">
                            <Upload size={32} />
                            <span className="text-xs font-bold uppercase">Clique para selecionar arquivo</span>
                            <span className="text-[10px] text-slate-400">PNG, JPG ou GIF</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Descrição</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: RX Panorâmico"
                      value={newImage.description}
                      onChange={(e) => setNewImage({...newImage, description: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsImageModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-[0_12px_36px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all active:scale-95"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Transação Financeira */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">
                    {transactionType === 'INCOME' ? 'Receita' : 'Despesa'}
                  </h3>
                  <button onClick={() => setIsTransactionModalOpen(false)} className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSaveTransaction} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Valor (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="0,00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-bold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Data</label>
                      <input 
                        required
                        type="date" 
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Categoria</label>
                      <select 
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      >
                        {transactionType === 'INCOME' ? (
                          <>
                            <option value="Procedimentos">Procedimentos</option>
                            <option value="Consultas">Consultas</option>
                            <option value="Produtos">Produtos</option>
                            <option value="Outros">Outros</option>
                          </>
                        ) : (
                          <>
                            <option value="Aluguel">Aluguel</option>
                            <option value="Materiais">Materiais</option>
                            <option value="Laboratório">Laboratório</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Salários">Salários</option>
                            <option value="Outros">Outros</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Descrição</label>
                    <input 
                      required
                      type="text" 
                      placeholder={transactionType === 'INCOME' ? 'Ex: Limpeza....' : 'Ex: Aluguel...'}
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Pagamento</label>
                    <select 
                      value={newTransaction.payment_method}
                      onChange={(e) => setNewTransaction({...newTransaction, payment_method: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                    >
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Crédito</option>
                      <option value="Cartão de Débito">Débito</option>
                      <option value="Transferência">Transf.</option>
                    </select>
                  </div>

                  {transactionType === 'INCOME' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5 block">Paciente</label>
                      <select 
                        value={newTransaction.patient_id}
                        onChange={(e) => setNewTransaction({...newTransaction, patient_id: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/35 outline-none text-[15px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all"
                      >
                        <option value="">Sem paciente</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsTransactionModalOpen(false)}
                      className="flex-1 h-12 border border-slate-200 bg-white/90 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className={`flex-1 h-12 text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(0,0,0,0.15)] hover:opacity-95 transition-all active:scale-[0.98] text-sm ${
                        transactionType === 'INCOME' 
                          ? 'bg-primary' 
                          : 'bg-rose-600'
                      }`}
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Receber Parcela */}
      <AnimatePresence>
        {isReceiveInstallmentModalOpen && selectedInstallment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Receber Parcela</h3>
                    <p className="text-xs text-slate-500">Confirme o recebimento do pagamento</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReceiveInstallmentModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Paciente</span>
                    <span className="text-sm font-semibold text-slate-700">{selectedPatient?.name || selectedInstallment.patient_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Procedimento</span>
                    <span className="text-sm font-semibold text-slate-700">{selectedInstallment.procedure || selectedInstallment.procedure_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Parcela</span>
                    <span className="text-sm font-semibold text-slate-700">{selectedInstallment.installment_number}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">Valor</span>
                    <span className="text-lg font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInstallment.amount)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          paymentMethod === method
                            ? 'bg-primary/5 border-primary/20 text-primary shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsReceiveInstallmentModalOpen(false)}
                    className="flex-1 py-3 px-4 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handlePayInstallment(selectedInstallment.id, paymentMethod)}
                    className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_12px_36px_rgba(38,78,54,0.12)] active:scale-95"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Ver Parcelas */}
      <AnimatePresence>
        {isViewInstallmentsModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-14 pb-24 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewInstallmentsModalOpen(false)}
              className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(255,255,255,0.16),rgba(15,23,42,0.72))] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-[30px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.2)] overflow-hidden max-h-[calc(100vh-9rem)] sm:max-h-[80vh] overflow-y-auto"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_95%_at_50%_0%,rgba(38,78,54,0.12),rgba(255,255,255,0))] pointer-events-none" />
              <div className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <div>
                    <h3 className="text-[21px] sm:text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-tight">Parcelas</h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">{selectedPlan.procedure}</p>
                  </div>
                  <button 
                    onClick={() => setIsViewInstallmentsModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-slate-200/60">
                        <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Parc.</th>
                        <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Valor</th>
                        <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Venc.</th>
                        <th className="text-center py-2.5 px-2 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {installments
                        .filter(inst => inst.payment_plan_id === selectedPlan.id)
                        .sort((a, b) => a.installment_number - b.installment_number)
                        .map((inst) => (
                          <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-2 font-medium text-slate-700">{inst.installment_number}ª</td>
                            <td className="py-2.5 px-2 font-bold text-slate-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount)}
                            </td>
                            <td className="py-2.5 px-2 text-slate-500">
                              {formatDate(inst.due_date)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                inst.status === 'PAID'
                                  ? 'bg-primary/15 text-primary'
                                  : isOverdue(inst.due_date)
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}>
                                {inst.status === 'PAID' ? 'Pago' : isOverdue(inst.due_date) ? 'Atraso' : 'Pend.'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <button 
                  onClick={() => setIsViewInstallmentsModalOpen(false)}
                  className="w-full h-12 mt-4 bg-primary text-white font-bold rounded-2xl shadow-[0_14px_34px_rgba(38,78,54,0.2)] hover:opacity-95 transition-all active:scale-[0.98] text-sm"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      {/* Primary Action & Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 tablet-l:hidden no-print">
        {/* Bottom Navigation */}
        <nav className="border-t border-slate-200/60 bg-white/95 backdrop-blur-md px-1 py-1 flex justify-around items-center">
          <BottomNavItem id="dashboard" label="Início" icon={ClipboardList} activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />
          <BottomNavItem id="agenda" label="Agenda" icon={Calendar} activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />
          <BottomNavItem id="pacientes" label="Pacientes" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />
          <BottomNavItem id="financeiro" label="Financeiro" icon={DollarSign} activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />
          <BottomNavItem id="configuracoes" label="Mais" icon={Settings} activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />
        </nav>
        <div className="h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' 
                ? 'bg-primary border-primary/20 text-white' 
                : 'bg-rose-600 border-rose-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Ação</h3>
                <p className="text-slate-600">{confirmation.message}</p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setConfirmation(null)}
                  className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    confirmation.onConfirm();
                    setConfirmation(null);
                  }}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
        )
      } />
    </Routes>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <Plus size={32} strokeWidth={3} />
            </div>
          </div>
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Recuperar Senha</h1>
            <p className="text-slate-500">Digite seu e-mail para receber as instruções</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 text-primary text-sm">
                <CheckCircle2 size={18} />
                {message}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-[0_12px_36px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Instruções'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/" className="text-xs text-primary font-bold hover:underline">
              Voltar para o login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage(data.message);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
          <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
          <p className="text-slate-500 mb-6">Este link de recuperação de senha é inválido ou expirou.</p>
          <Link to="/" className="bg-primary text-white px-6 py-3 rounded-xl font-bold inline-block">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <Lock size={32} strokeWidth={3} />
            </div>
          </div>
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Nova Senha</h1>
            <p className="text-slate-500">Crie uma nova senha segura para sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 text-primary text-sm">
                <CheckCircle2 size={18} />
                {message}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || success}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-[0_12px_36px_rgba(38,78,54,0.12)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Redefinir Senha'}
            </button>
          </form>

          {success && (
            <div className="mt-6 text-center text-sm text-slate-500">
              Redirecionando para o login em instantes...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Print Components
function PrintLayout({ children, title, onPrint }: { children: React.ReactNode, title: string, onPrint: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-slate-50 py-4 md:py-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8 no-print">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => window.close()}
              className="px-6 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Fechar
            </button>
            <button 
              onClick={onPrint}
              className="print-btn flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-[0_12px_36px_rgba(38,78,54,0.12)]"
            >
              <Printer size={20} />
              Imprimir Agora
            </button>
          </div>
        </div>
        <div className="print-container bg-white shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

function PrintAgenda({ date, appointments, profile }: { date: Date, appointments: Appointment[], profile: Dentist | null }) {
  const dayAppointments = appointments
    .filter(a => new Date(a.start_time).toDateString() === date.toDateString())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <PrintLayout title="Agenda do Dia" onPrint={() => window.print()}>
      <div className="border-b-4 border-slate-900 pb-8 mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Agenda do Dia</h1>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold text-slate-700 capitalize">
              {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xl text-slate-500 mt-1">
              {profile?.name || 'Dr. Samuel Godoy'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">
              Total: {dayAppointments.length} consultas
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {dayAppointments.map((app) => (
          <div key={app.id} className="flex gap-8 pb-8 border-b border-slate-200 last:border-0">
            <div className="w-8 h-8 border-2 border-slate-400 rounded flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <p className="text-2xl font-black text-slate-900">
                  {new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  <span className="mx-3 text-slate-300">—</span>
                  {app.patient_name}
                </p>
                <span className="text-sm font-black text-slate-400 border border-slate-200 px-3 py-1 rounded-lg uppercase tracking-widest">
                  {app.status === 'SCHEDULED' ? 'Agendado' : 
                   app.status === 'CONFIRMED' ? 'Confirmado' : 
                   app.status === 'CANCELLED' ? 'Cancelado' : 
                   app.status === 'IN_PROGRESS' ? 'Em Atendimento' : 'Finalizado'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-slate-700 text-lg">
                  <span className="font-bold text-slate-400 uppercase text-xs tracking-wider block mb-0.5">Observações</span>
                  {app.notes || 'Nenhuma observação'}
                </p>
                <p className="text-slate-700 text-lg">
                  <span className="font-bold text-slate-400 uppercase text-xs tracking-wider block mb-0.5">Dentista</span>
                  {app.dentist_name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PrintLayout>
  );
}

function PrintReceipt({ transaction, installment, profile, patients, paymentPlans }: any) {
  const data = transaction || installment;
  if (!data) return <div className="p-8 text-center text-slate-500">Documento não encontrado.</div>;

  const patient = patients.find((p: any) => p.id === data.patient_id);
  const plan = installment ? paymentPlans.find((p: any) => p.id === data.payment_plan_id) : null;

  return (
    <PrintLayout title="Recibo" onPrint={() => window.print()}>
      <div className="p-12 bg-white text-slate-800 font-serif border border-slate-200">
        <div className="flex justify-between items-start mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
              <Plus size={28} strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">OdontoHub</h1>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-serif italic text-slate-400 mb-1">Recibo</h2>
            <p className="text-sm font-sans font-bold text-slate-500 uppercase tracking-widest">Nº {data.id.toString().padStart(6, '0')}</p>
          </div>
        </div>

        <div className="space-y-10 text-lg leading-relaxed">
          <p>
            Recebemos de <span className="font-bold border-b-2 border-slate-200 px-2">{patient?.name || data.patient_name || '________________________________'}</span>, 
            a importância de <span className="font-bold border-b-2 border-slate-200 px-2">R$ {data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> 
            (<span className="italic text-slate-500">________________________________________________</span>).
          </p>

          <p>
            Referente a <span className="font-bold border-b-2 border-slate-200 px-2">{data.procedure || plan?.procedure || data.description || 'tratamento odontológico'}</span>.
          </p>

          <div className="pt-10 flex justify-between items-end">
            <div>
              <p className="text-slate-500 mb-1">Data do Pagamento</p>
              <p className="font-bold text-xl">{new Date(data.date || data.payment_date || data.due_date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="text-center w-64">
              <div className="border-b-2 border-slate-900 mb-2"></div>
              <p className="font-bold text-slate-800">{profile?.name || 'Assinatura do Responsável'}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{profile?.cro ? `CRO: ${profile.cro}` : 'Cirurgião Dentista'}</p>
            </div>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}

function PrintReport({ profile, transactions, patients, appointments }: any) {
  const summary = {
    totalIncome: transactions.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + Number(t.amount), 0),
    totalExpense: transactions.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + Number(t.amount), 0),
    totalPatients: patients.length,
    totalAppointments: appointments.length
  };

  return (
    <PrintLayout title="Relatório Financeiro" onPrint={() => window.print()}>
      <div className="p-12 bg-white text-slate-800 font-sans">
        <div className="flex justify-between items-start mb-16 border-b-4 border-slate-900 pb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-2">Relatório Geral</h1>
            <p className="text-xl text-slate-500 font-medium">Resumo de Atividades e Financeiro</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Emissão</p>
            <p className="text-xl font-bold text-slate-900">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Resumo Financeiro</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total de Entradas</span>
                <span className="text-2xl font-black text-primary">
                  {summary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total de Saídas</span>
                <span className="text-2xl font-black text-rose-600">
                  {summary.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900">
                <span className="text-lg font-black text-slate-900 uppercase">Saldo Final</span>
                <span className={`text-3xl font-black ${(summary.totalIncome - summary.totalExpense) >= 0 ? 'text-primary' : 'text-rose-600'}`}>
                  {(summary.totalIncome - summary.totalExpense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Estatísticas Gerais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Pacientes</p>
                <p className="text-4xl font-black text-slate-900">{summary.totalPatients}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Consultas</p>
                <p className="text-4xl font-black text-slate-900">{summary.totalAppointments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Últimas Transações</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-widest">
                <th className="pb-4 font-black">Data</th>
                <th className="pb-4 font-black">Descrição</th>
                <th className="pb-4 font-black">Tipo</th>
                <th className="pb-4 font-black text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {transactions.slice(0, 15).map((t: any) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="py-4 font-medium">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-4 font-bold text-slate-900">{t.description}</td>
                  <td className="py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${t.type === 'INCOME' ? 'bg-primary/5 text-primary' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className={`py-4 font-black text-right ${t.type === 'INCOME' ? 'text-primary' : 'text-rose-600'}`}>
                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-24 pt-12 border-t border-slate-100 flex justify-between items-end">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Clínica</p>
            <p className="text-lg font-bold text-slate-900">{profile?.clinic_name || 'OdontoHub'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
            <p className="text-lg font-bold text-slate-900">{profile?.name}</p>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}

function PrintDocument({ profile, patients, apiFetch, appointments, transactions, installments, paymentPlans }: any) {
  const { tipo: type, id } = useParams();
  const [doc, setDoc] = useState<any>(null);
  const [fullPatient, setFullPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      // If it's a generic document from the 'documents' table
      const genericTypes = ['receituario', 'declaracao', 'atestado', 'encaminhamento', 'ficha', 'orcamento'];
      if (type && genericTypes.includes(type) && id) {
        try {
          const res = await apiFetch(`/api/documents/${id}`);
          if (res.ok) {
            const data = await res.json();
            const parsedDoc = {
              ...data,
              content: JSON.parse(data.content)
            };
            setDoc(parsedDoc);
            
            if (data.patient_id) {
              const pRes = await apiFetch(`/api/patients/${data.patient_id}`);
              if (pRes.ok) {
                const pData = await pRes.json();
                setFullPatient(pData);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching document:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id, type, apiFetch]);

  if (loading) return <div className="bg-white flex items-center justify-center font-bold text-slate-400 py-20">Carregando dados para impressão...</div>;

  // Handle specific non-generic types
  if (type === 'agenda') {
    const dateStr = new URLSearchParams(window.location.search).get('date') || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr + 'T12:00:00');
    return <PrintAgenda date={date} appointments={appointments} profile={profile} />;
  }
  
  if (type === 'recibo') {
    const transaction = transactions.find((t: any) => t.id.toString() === id);
    const installment = installments.find((i: any) => i.id.toString() === id);
    return <PrintReceipt transaction={transaction} installment={installment} profile={profile} patients={patients} paymentPlans={paymentPlans} />;
  }
  
  if (type === 'relatorio') {
    return <PrintReport profile={profile} transactions={transactions} patients={patients} appointments={appointments} />;
  }

  if (!doc && id) return <div className="bg-white flex items-center justify-center font-bold text-slate-400 py-20">Documento não encontrado.</div>;

  const patient = fullPatient || patients.find((p: any) => p.id === doc?.patient_id);
  const content = doc?.content || {};

  return (
    <PrintLayout title={type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Documento'} onPrint={() => window.print()}>
      <div className="bg-white p-[1cm] font-serif text-slate-900">
        {/* Header */}
        <div className="text-center border-b-2 border-primary/20 pb-6 mb-10">
          <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
            {profile?.clinic_name || 'Clínica Odontológica'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {profile?.clinic_address || 'Endereço não informado'}
          </p>
          <p className="text-sm text-slate-500">
            Tel: {profile?.phone || 'Telefone não informado'}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 min-h-[15cm]">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold uppercase underline decoration-primary/40 underline-offset-8">
              {type === 'receituario' ? 'Receituário' : 
               type === 'declaracao' ? 'Declaração' : 
               type === 'atestado' ? 'Atestado' : 
               type === 'encaminhamento' ? 'Encaminhamento' : 
               type === 'ficha' ? 'Ficha Clínica' : 
               type === 'orcamento' ? 'Orçamento' : type}
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-relaxed">
            <p><strong>Paciente:</strong> {patient?.name || '________________________________'}</p>
            <p><strong>Data:</strong> {doc?.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>

            {type === 'receituario' && (
              <div className="mt-10 space-y-8">
                <p className="font-bold text-xl mb-4 text-primary">Uso Interno:</p>
                {content.items?.map((item: any, i: number) => (
                  <div key={i} className="border-l-4 border-primary/40 pl-4 mb-6">
                    <p className="font-bold text-lg">{item.medication}</p>
                    <p className="text-slate-700 italic">{item.dosage}</p>
                  </div>
                ))}
                {content.instructions && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="font-bold mb-2">Instruções:</p>
                    <p className="text-slate-700 whitespace-pre-wrap">{content.instructions}</p>
                  </div>
                )}
              </div>
            )}

            {type === 'declaracao' && (
              <div className="mt-10">
                <p className="text-justify">
                  Declaro para os devidos fins que o(a) paciente <strong>{patient?.name}</strong> compareceu a esta clínica odontológica na data de <strong>{new Date(doc?.created_at || Date.now()).toLocaleDateString('pt-BR')}</strong> para atendimento odontológico.
                </p>
              </div>
            )}

            {type === 'atestado' && (
              <div className="mt-10 space-y-6">
                <p className="text-justify">
                  Atesto, para os devidos fins, que o(a) Sr(a). <strong>{patient?.name}</strong> necessita de <strong>{content.period}</strong> de afastamento de suas atividades, a partir desta data, por motivo de tratamento odontológico.
                </p>
                {content.reason && (
                  <p><strong>Observação:</strong> {content.reason}</p>
                )}
              </div>
            )}

            {type === 'encaminhamento' && (
              <div className="mt-10 space-y-6">
                <p><strong>Ao Especialista:</strong> {content.specialist}</p>
                <p className="text-justify">
                  Encaminho o(a) paciente <strong>{patient?.name}</strong> para avaliação e conduta especializada.
                </p>
                <p><strong>Motivo/Histórico:</strong> {content.reason}</p>
              </div>
            )}

            {type === 'ficha' && (
              <div className="mt-10 space-y-8">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>CPF:</strong> {patient?.cpf}</p>
                  <p><strong>Data de Nasc.:</strong> {patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                  <p><strong>E-mail:</strong> {patient?.email}</p>
                  <p><strong>Telefone:</strong> {patient?.phone}</p>
                  <p className="col-span-2"><strong>Endereço:</strong> {patient?.address || 'Não informado'}</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-bold border-b-2 border-primary/40 pb-1 text-primary uppercase tracking-wider">Histórico Clínico (Anamnese)</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <p className="font-bold text-slate-500 text-[10px] uppercase">Histórico Médico:</p>
                        <p>{patient?.anamnesis?.medical_history || 'Nenhum histórico registrado.'}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500 text-[10px] uppercase">Alergias:</p>
                        <p className="text-rose-600 font-bold">{patient?.anamnesis?.allergies || 'Nenhuma alergia informada.'}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500 text-[10px] uppercase">Medicações em Uso:</p>
                        <p>{patient?.anamnesis?.medications || 'Nenhuma medicação informada.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold border-b-2 border-primary/40 pb-1 text-primary uppercase tracking-wider">Histórico de Atendimentos (Evolução)</h4>
                    {patient?.evolution && patient.evolution.length > 0 ? (
                      <div className="space-y-4">
                        {patient.evolution.map((evo: any, i: number) => (
                          <div key={i} className="border-b border-slate-100 pb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-primary">{new Date(evo.date).toLocaleDateString('pt-BR')}</span>
                              <span className="text-xs font-bold text-slate-400 uppercase">{evo.procedure_performed}</span>
                            </div>
                            <p className="text-sm text-slate-600 italic">{evo.notes}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Nenhum atendimento registrado até o momento.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {type === 'orcamento' && (
              <div className="mt-10 space-y-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary/5 text-primary">
                      <th className="border border-primary/10 p-3 text-left">Procedimento</th>
                      <th className="border border-primary/10 p-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-slate-100 p-3">{item.procedure}</td>
                        <td className="border border-slate-100 p-3 text-right">
                          {Number(item.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-slate-50">
                      <td className="border border-slate-100 p-3 text-right">Total</td>
                      <td className="border border-slate-100 p-3 text-right text-primary">
                        {content.items?.reduce((acc: number, item: any) => acc + Number(item.value), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Signature */}
        <div className="mt-20 flex flex-col items-center">
          <div className="w-64 border-t border-slate-400 mb-2"></div>
          <p className="font-bold text-lg">{profile?.name}</p>
          <p className="text-slate-600">Cirurgião-Dentista • CRO: {profile?.cro}</p>
        </div>
      </div>
    </PrintLayout>
  );
}
