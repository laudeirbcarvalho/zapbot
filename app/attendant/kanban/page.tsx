"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAttendantAuth } from "@/app/lib/attendant-auth-middleware";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AttendantAttendanceModal from "@/app/components/AttendantAttendanceModal";
import { MessageSquare } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  columnId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  attendantId?: string;
  attendant?: {
    id: string;
    name: string;
    email: string;
    position: string;
    department?: string;
    isActive: boolean;
  };
}

interface Column {
  id: string;
  title: string;
  position: number;
  color?: string;
  leads: Lead[];
}

interface AttendantData {
  id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  type: string;
}

// Componente do Card do Lead
function LeadCard({ lead, onAttendanceClick, columnColor }: { lead: Lead; onAttendanceClick?: (leadId: string, leadName: string) => void; columnColor?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAttendanceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAttendanceClick) {
      onAttendanceClick(lead.id, lead.name);
    }
  };

  return (
    <div className="relative">
      {/* Botão de atendimento posicionado fora do card */}
      <div className="absolute -top-2 -right-2 z-10">
        {onAttendanceClick && (
          <button
            onClick={handleAttendanceClick}
            className="bg-green-600 border border-green-500 rounded-full w-6 h-6 flex items-center justify-center text-green-100 hover:text-white hover:bg-green-500 transition-colors shadow-sm"
            title="Histórico de atendimento"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
        )}
      </div>
      
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 shadow-lg border border-gray-600 cursor-grab hover:shadow-xl hover:border-blue-500 transition-all duration-200 relative ${
          isDragging ? 'opacity-50 rotate-2 scale-105' : ''
        }`}
      >
        {/* Barra colorida lateral */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: columnColor || '#6B7280' }}
        ></div>
        {/* Header com nome */}
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-white text-lg">{lead.name}</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        
        {/* Contato */}
        <div className="space-y-2 mb-3">
          {/* Email */}
          {lead.email && (
            <div className="flex items-center text-sm text-gray-300">
              <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          
          {/* Telefone */}
          {lead.phone && (
            <div className="flex items-center text-sm text-gray-300">
              <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
        </div>
        
        {/* Fonte */}
        {lead.source && (
          <div className="mb-3">
            <div className="flex items-center text-sm text-gray-400">
              <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate">{lead.source}</span>
            </div>
          </div>
        )}
        
        {/* Atendente */}
        {lead.attendant && (
          <div className="text-xs text-blue-300">
            Atendente: {lead.attendant.name}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente da Coluna
function KanbanColumn({ column, onAttendanceClick }: { column: Column; onAttendanceClick?: (leadId: string, leadName: string) => void }) {
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 min-w-[300px] max-w-[300px] shadow-xl hover:shadow-2xl transition-shadow duration-200">
      {/* Barra colorida no topo */}
      <div 
        className="h-1 rounded-t-xl -mx-4 -mt-4 mb-4"
        style={{ backgroundColor: column.color || '#6B7280' }}
      ></div>
      
      {/* Header da coluna */}
      <div className="mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-lg">{column.title}</h3>
          <span className="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full">
            {column.leads.length}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded-full">{column.leads.length} leads</div>
        </div>
      </div>

      {/* Área de drop */}
      <div
        ref={setNodeRef}
        className="min-h-[400px] space-y-3"
      >
        <SortableContext items={column.leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
          {column.leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onAttendanceClick={onAttendanceClick} columnColor={column.color} />
          ))}
        </SortableContext>
        
        {/* Área vazia para drop */}
        {column.leads.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-lg text-gray-400">
            Arraste leads para cá
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttendantKanbanPage() {
  const [attendant, setAttendant] = useState<AttendantData | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState<string>("");
  const router = useRouter();
  const { checkSession, logout } = useAttendantAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const verifySessionAndFetchData = async () => {
      const attendantData = await checkSession();
      if (attendantData) {
        setAttendant(attendantData);
        await fetchKanbanData();
      } else {
        router.push("/attendant/login");
      }
      setLoading(false);
    };
    verifySessionAndFetchData();
  }, []);

  const fetchKanbanData = async () => {
    try {
      const response = await fetch("/api/attendant/kanban/columns", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setColumns(data);
      } else {
        setError("Erro ao carregar dados do Kanban");
      }
    } catch (err) {
      setError("Erro ao carregar dados do Kanban");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar o lead que está sendo movido
    let activeLead: Lead | undefined;
    let sourceColumn: Column | undefined;
    
    for (const column of columns) {
      const lead = column.leads.find(l => l.id === activeId);
      if (lead) {
        activeLead = lead;
        sourceColumn = column;
        break;
      }
    }

    if (!activeLead || !sourceColumn) return;

    // Determinar a coluna de destino
    let targetColumnId: string;
    let targetColumn: Column | undefined;

    if (overId.startsWith('column-')) {
      targetColumnId = overId.replace('column-', '');
      targetColumn = columns.find(col => col.id === targetColumnId);
    } else {
      // Dropped on another lead
      targetColumn = columns.find(col => 
        col.leads.some(lead => lead.id === overId)
      );
      if (targetColumn) {
        targetColumnId = targetColumn.id;
      }
    }

    if (!targetColumn) return;

    // Se não mudou de coluna e posição, não fazer nada
    if (sourceColumn.id === targetColumnId && activeId === overId) return;

    // Atualização otimista - atualizar estado local imediatamente
    setColumns(prev => {
      const newColumns = [...prev];
      
      // Remover da coluna origem
      const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumn!.id);
      newColumns[sourceColIndex] = {
        ...newColumns[sourceColIndex],
        leads: newColumns[sourceColIndex].leads.filter(lead => lead.id !== activeId)
      };
      
      // Adicionar na coluna destino
      const targetColIndex = newColumns.findIndex(col => col.id === targetColumn!.id);
      newColumns[targetColIndex] = {
        ...newColumns[targetColIndex],
        leads: [...newColumns[targetColIndex].leads, {
          ...activeLead!,
          columnId: targetColumn!.id,
          status: targetColumn!.title
        }]
      };
      
      return newColumns;
    });

    // Atualizar no backend em background
    try {
      const response = await fetch(`/api/attendant/leads/${activeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          columnId: targetColumn.id,
          status: targetColumn.title
        })
      });

      if (!response.ok) {
        // Se falhar, reverter a mudança
        setColumns(prev => {
          const newColumns = [...prev];
          
          // Remover da coluna destino
          const targetColIndex = newColumns.findIndex(col => col.id === targetColumn!.id);
          newColumns[targetColIndex] = {
            ...newColumns[targetColIndex],
            leads: newColumns[targetColIndex].leads.filter(lead => lead.id !== activeId)
          };
          
          // Adicionar de volta na coluna origem
          const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumn!.id);
          newColumns[sourceColIndex] = {
            ...newColumns[sourceColIndex],
            leads: [...newColumns[sourceColIndex].leads, {
              ...activeLead!,
              columnId: sourceColumn!.id,
              status: sourceColumn!.title
            }]
          };
          
          return newColumns;
        });
        setError('Erro ao mover lead');
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      // Reverter a mudança em caso de erro
      setColumns(prev => {
        const newColumns = [...prev];
        
        // Remover da coluna destino
        const targetColIndex = newColumns.findIndex(col => col.id === targetColumn!.id);
        newColumns[targetColIndex] = {
          ...newColumns[targetColIndex],
          leads: newColumns[targetColIndex].leads.filter(lead => lead.id !== activeId)
        };
        
        // Adicionar de volta na coluna origem
        const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumn!.id);
        newColumns[sourceColIndex] = {
          ...newColumns[sourceColIndex],
          leads: [...newColumns[sourceColIndex].leads, {
            ...activeLead!,
            columnId: sourceColumn!.id,
            status: sourceColumn!.title
          }]
        };
        
        return newColumns;
      });
      setError('Erro ao mover lead');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/attendant/login");
  };

  const handleAttendanceClick = (leadId: string, leadName: string) => {
    setSelectedLeadId(leadId);
    setSelectedLeadName(leadName);
    setAttendanceModalOpen(true);
  };

  const handleAttendanceModalClose = () => {
    setAttendanceModalOpen(false);
    setSelectedLeadId(null);
    setSelectedLeadName("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!attendant) {
    return null;
  }

  // Encontrar o lead ativo para o overlay
  const activeLead = activeId ? 
    columns.flatMap(col => col.leads).find(lead => lead.id === activeId) : null;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/attendant/dashboard")}
                className="text-gray-400 hover:text-white"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-semibold text-white">Kanban</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                <span className="font-medium">{attendant.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {error && (
          <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-6">
            {columns.map((column) => (
              <KanbanColumn key={column.id} column={column} onAttendanceClick={handleAttendanceClick} />
            ))}
          </div>
          
          <DragOverlay>
            {activeLead ? <LeadCard lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modal de Atendimentos */}
      {attendanceModalOpen && selectedLeadId && (
        <AttendantAttendanceModal
          leadId={selectedLeadId}
          leadName={selectedLeadName}
          onClose={handleAttendanceModalClose}
        />
      )}
    </div>
  );
}