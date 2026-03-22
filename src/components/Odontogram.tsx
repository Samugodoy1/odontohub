import React from 'react';
import { X } from 'lucide-react';

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
  onSelectProcedure?: (payload: {
    toothNumber: number;
    procedure: string;
    category: 'diagnosis' | 'procedure';
    mode: 'initial' | 'continuity';
    status: ToothStatus;
  }) => void;
  treatments?: Array<{
    id: string;
    tooth_number?: number;
    procedure?: string;
    status?: string;
  }>;
  activeToothNumbers?: number[];
  priorityToothNumber?: number | null;
  highlightedToothNumber?: number | null;
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
  decay: 'bg-rose-50 border-rose-300 text-rose-800',
  filling: 'bg-sky-50 border-sky-300 text-sky-800',
  crown: 'bg-amber-50 border-amber-300 text-amber-900',
  root_canal_done: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  root_canal_needed: 'bg-orange-50 border-orange-300 text-orange-800',
  implant: 'bg-indigo-50 border-indigo-300 text-indigo-800',
  extraction_done: 'bg-slate-100 border-slate-300 text-slate-700',
  extraction_needed: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  fracture: 'bg-rose-50 border-rose-300 text-rose-800',
  wear: 'bg-zinc-100 border-zinc-300 text-zinc-700',
  facet: 'bg-cyan-50 border-cyan-300 text-cyan-800',
  prosthesis: 'bg-purple-50 border-purple-300 text-purple-800',
  missing: 'bg-slate-100 border-slate-300 text-slate-600',
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

const diagnosisActions = [
  { key: 'decay', label: 'Carie', status: 'decay' as ToothStatus, category: 'diagnosis' as const },
  { key: 'fracture', label: 'Fratura', status: 'fracture' as ToothStatus, category: 'diagnosis' as const },
];

const procedureActions = [
  { key: 'filling', label: 'Restauracao', status: 'filling' as ToothStatus, category: 'procedure' as const },
  { key: 'root-canal', label: 'Canal', status: 'root_canal_needed' as ToothStatus, category: 'procedure' as const },
  { key: 'extraction', label: 'Extracao', status: 'extraction_needed' as ToothStatus, category: 'procedure' as const },
  { key: 'crown', label: 'Coroa', status: 'crown' as ToothStatus, category: 'procedure' as const },
];

const continuationActions = [
  { key: 'adjust-restoration', label: 'Restauracao', status: 'filling' as ToothStatus, category: 'procedure' as const },
  { key: 'continue-canal', label: 'Canal', status: 'root_canal_done' as ToothStatus, category: 'procedure' as const },
  { key: 'extraction', label: 'Extracao', status: 'extraction_done' as ToothStatus, category: 'procedure' as const },
  { key: 'crown', label: 'Coroa', status: 'crown' as ToothStatus, category: 'procedure' as const },
];

interface ToothProps {
  number: number;
  status: ToothStatus;
  selected: boolean;
  isInTreatment: boolean;
  hasDiagnosis: boolean;
  isCompleted: boolean;
  isPriority: boolean;
  disabled: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onHover: (event: React.MouseEvent<HTMLButtonElement>, num: number) => void;
  onLeave: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

const Tooth: React.FC<ToothProps> = ({ number, status, selected, isInTreatment, hasDiagnosis, isCompleted, isPriority, disabled, onClick, onHover, onLeave, buttonRef }) => {
  return (
    <div className="flex flex-col items-center gap-1 relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={(event) => onHover(event, number)}
        onMouseLeave={onLeave}
        className={`
          w-12 h-[4.1rem] sm:w-[3.15rem] sm:h-[4.45rem] rounded-[18px] border-[1.5px]
          flex items-center justify-center text-[11px] sm:text-[12px] font-extrabold tracking-tight
          transition-all duration-200
          ${statusColors[status]}
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${isInTreatment ? 'ring-2 ring-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.20)]' : ''}
          ${hasDiagnosis ? 'border-rose-400 bg-rose-50/90 shadow-[0_0_0_2px_rgba(244,63,94,0.12)]' : ''}
          ${isCompleted ? 'ring-2 ring-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,0.16)]' : ''}
          ${isPriority ? 'ring-2 ring-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]' : ''}
          ${selected
            ? 'scale-[1.06] ring-2 ring-primary shadow-[0_16px_28px_rgba(12,155,114,0.24)]'
            : 'hover:scale-[1.03] hover:shadow-[0_10px_18px_rgba(15,23,42,0.10)] active:scale-[0.98]'}
        `}
      >
        {isInTreatment && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
        )}
        {isCompleted && (
          <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-white bg-sky-500" />
        )}
        {number}
      </button>
      {isPriority && (
        <span className="mt-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
          Prior.
        </span>
      )}
    </div>
  );
};

interface ActionMenuProps {
  open: boolean;
  selectedTooth: number | null;
  selectedStatus: ToothStatus;
  hasTreatment: boolean;
  currentProcedure?: string;
  mobile: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onAction: (action: { label: string; status: ToothStatus; category: 'diagnosis' | 'procedure'; mode: 'initial' | 'continuity' }) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  open,
  selectedTooth,
  selectedStatus,
  hasTreatment,
  currentProcedure,
  mobile,
  anchorRect,
  onClose,
  onAction,
}) => {
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (!menuRef.current.contains(target)) onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, onClose]);

  if (!open || selectedTooth === null) return null;

  const actions = hasTreatment ? continuationActions : [...diagnosisActions, ...procedureActions];
  const menuTitle = hasTreatment ? 'Continuar tratamento' : 'Iniciar acao';

  if (mobile) {
    return (
      <div className="fixed inset-0 z-[9999]">
        <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px] transition-opacity duration-200" />
        <div
          ref={menuRef}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-2xl border-t border-slate-200 transition-transform duration-300 translate-y-0"
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Dente {selectedTooth}</p>
              <p className="text-xs text-slate-500">{menuTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
          {hasTreatment && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Procedimento atual: {currentProcedure || 'Em andamento'}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pb-2">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => onAction({ label: action.label, status: action.status, category: action.category, mode: hasTreatment ? 'continuity' : 'initial' })}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200
                  ${selectedStatus === action.status
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300'}
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const top = anchorRect ? anchorRect.bottom + 10 : 0;
  const left = anchorRect ? Math.max(12, anchorRect.left - 20) : 12;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        ref={menuRef}
        style={{ top, left }}
        className="pointer-events-auto absolute w-[260px] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_22px_45px_rgba(15,23,42,0.18)] transition-all duration-200"
      >
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Dente {selectedTooth}</p>
        <p className="mb-2 px-1 text-[11px] text-slate-500">{menuTitle}</p>
        {hasTreatment && (
          <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-900">
            Atual: {currentProcedure || 'Em andamento'}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction({ label: action.label, status: action.status, category: action.category, mode: hasTreatment ? 'continuity' : 'initial' })}
              className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-all duration-200
                ${selectedStatus === action.status
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300'}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Odontogram: React.FC<OdontogramProps> = ({ 
  data = {}, 
  history = [], 
  onChange, 
  onAddHistory,
  onSelectProcedure,
  treatments = [],
  activeToothNumbers = [],
  priorityToothNumber = null,
  highlightedToothNumber = null,
  readOnly = false 
}) => {
  const [selectedTooth, setSelectedTooth] = React.useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const [hoveredTooth, setHoveredTooth] = React.useState<number | null>(null);
  const [hoverRect, setHoverRect] = React.useState<DOMRect | null>(null);
  const toothRefs = React.useRef<Record<number, HTMLButtonElement | null>>({});
  const activeToothSet = React.useMemo(() => new Set(activeToothNumbers), [activeToothNumbers]);

  const treatmentByTooth = React.useMemo(() => {
    const map = new Map<number, { procedure?: string; status?: string }>();
    treatments.forEach((item) => {
      const toothNumber = Number(item.tooth_number);
      if (Number.isFinite(toothNumber) && toothNumber > 0 && !map.has(toothNumber)) {
        map.set(toothNumber, { procedure: item.procedure, status: item.status });
      }
    });
    return map;
  }, [treatments]);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const getToothStatus = React.useCallback((num: number): ToothStatus => {
    return data[num]?.status || 'healthy';
  }, [data]);

  const handleToothClick = (num: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (readOnly) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredTooth(null);
    setHoverRect(null);
    setSelectedTooth(num);
    setAnchorRect(rect);
    setIsMenuOpen(true);
  };

  const handleAction = ({ label, status, category, mode }: { label: string; status: ToothStatus; category: 'diagnosis' | 'procedure'; mode: 'initial' | 'continuity' }) => {
    if (selectedTooth === null) return;

    // Close first for immediate UX feedback even if callbacks fail.
    setIsMenuOpen(false);

    try {
      if (onChange) {
        onChange(selectedTooth, {
          status,
          notes: data[selectedTooth]?.notes || '',
        });
      }
    } catch (error) {
      console.error('Error applying tooth status change:', error);
    }

    try {
      if (onSelectProcedure) {
        Promise.resolve(
          onSelectProcedure({
            toothNumber: selectedTooth,
            procedure: label,
            category,
            mode,
            status,
          })
        ).catch((error) => {
          console.error('Error applying selected procedure:', error);
        });
      }
    } catch (error) {
      console.error('Error dispatching selected procedure:', error);
    }

    if (onAddHistory) {
      const today = new Date().toISOString().split('T')[0];
      onAddHistory({
        tooth_number: selectedTooth,
        procedure: label,
        notes: '',
        date: today,
      }).catch((error) => {
        console.error('Error adding tooth history:', error);
      });
    }
  };

  const renderTooth = (num: number) => (
    <Tooth
      key={num}
      number={num}
      status={getToothStatus(num)}
      selected={(selectedTooth === num && isMenuOpen) || highlightedToothNumber === num}
      isInTreatment={activeToothSet.has(num)}
      hasDiagnosis={['decay', 'fracture'].includes(getToothStatus(num))}
      isCompleted={['root_canal_done', 'extraction_done'].includes(getToothStatus(num))}
      isPriority={priorityToothNumber === num}
      disabled={readOnly}
      onClick={(event) => handleToothClick(num, event)}
      onHover={(event, toothNumber) => {
        if (isMobile) return;
        setHoveredTooth(toothNumber);
        setHoverRect(event.currentTarget.getBoundingClientRect());
      }}
      onLeave={() => {
        if (isMenuOpen) return;
        setHoveredTooth(null);
        setHoverRect(null);
      }}
      buttonRef={(el) => {
        toothRefs.current[num] = el;
      }}
    />
  );

  return (
    <div className="space-y-7 p-2 sm:p-3 bg-transparent rounded-none shadow-none border-none">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg sm:text-[22px] font-extrabold tracking-[-0.015em] text-slate-950">Visão dentária</h3>
          <p className="text-xs sm:text-sm leading-6 text-slate-700">Clique em um dente para abrir o menu rapido de acoes.</p>
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

      <ActionMenu
        open={isMenuOpen}
        selectedTooth={selectedTooth}
        selectedStatus={selectedTooth !== null ? getToothStatus(selectedTooth) : 'healthy'}
        hasTreatment={selectedTooth !== null ? treatmentByTooth.has(selectedTooth) : false}
        currentProcedure={selectedTooth !== null ? treatmentByTooth.get(selectedTooth)?.procedure : undefined}
        mobile={isMobile}
        anchorRect={anchorRect}
        onClose={() => setIsMenuOpen(false)}
        onAction={handleAction}
      />

      {!isMobile && hoveredTooth !== null && hoverRect && (
        <div
          className="fixed z-[9998] pointer-events-none rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-[0_16px_34px_rgba(15,23,42,0.16)]"
          style={{
            top: hoverRect.top - 70,
            left: Math.max(10, hoverRect.left - 12),
          }}
        >
          <p className="text-xs font-bold text-slate-900">Dente {hoveredTooth}</p>
          <p className="text-[11px] text-slate-600">Procedimento: {treatmentByTooth.get(hoveredTooth)?.procedure || 'Nao definido'}</p>
          <p className="text-[11px] text-slate-600">Status: {statusLabels[getToothStatus(hoveredTooth)]}</p>
        </div>
      )}
    </div>
  );
};
