'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import Header from '@/app/components/Header';
import KanbanColumn from '@/app/components/KanbanColumn';
import KanbanCard from '@/app/components/KanbanCard';
import AddColumnButton from '@/app/components/AddColumnButton';
import { useColumnSync } from '@/app/hooks/useColumnSync';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes?: string;
  columnId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  title: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function KanbanPage() {
  const { data: session, status } = useSession();
  const [columns, setColumns] = useState<Column[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { notifyColumnChange } = useColumnSync();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Log movido para depois do carregamento dos dados

  useEffect(() => {
    // Carregar colunas e leads do banco de dados
    async function fetchData() {
      try {
        console.log('🔄 Iniciando carregamento de dados...');
        setLoading(true);
        
        // Buscar colunas
        console.log('📊 Buscando colunas...');
        const columnsResponse = await fetch('/api/columns');
        console.log('📊 Response colunas:', columnsResponse.status, columnsResponse.ok);
        if (!columnsResponse.ok) {
          throw new Error('Falha ao buscar colunas');
        }
        const columnsData = await columnsResponse.json();
        console.log('📊 Colunas carregadas:', columnsData.length, columnsData);
        const sortedColumns = columnsData.sort((a: Column, b: Column) => a.position - b.position);
        setColumns(sortedColumns);
        // Notificar sobre as colunas carregadas
        notifyColumnChange(sortedColumns);
        
        // Buscar leads
        console.log('👥 Buscando leads...');
        const leadsResponse = await fetch('/api/leads');
        console.log('👥 Response leads:', leadsResponse.status, leadsResponse.ok);
        if (!leadsResponse.ok) {
          throw new Error('Falha ao buscar leads');
        }
        const leadsData = await leadsResponse.json();
        console.log('👥 Leads carregados:', leadsData.length, leadsData);
        setLeads(leadsData);
        
        console.log('✅ Dados carregados com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        // Se não houver dados, criar colunas padrão com os status do formulário
        if (columns.length === 0) {
          const defaultColumns = [
            { id: "novo", title: "Novo", position: 0 },
            { id: "em-contato", title: "Em contato", position: 1 },
            { id: "qualificado", title: "Qualificado", position: 2 },
            { id: "negociacao", title: "Negociação", position: 3 },
            { id: "fechado", title: "Fechado", position: 4 },
          ];
          setColumns(defaultColumns);
          console.log('🔧 Colunas padrão criadas');
        }
      } finally {
        setLoading(false);
        console.log('🏁 Carregamento finalizado');
      }
    }
    
    fetchData();
  }, []);

  // Log após carregamento dos dados
  useEffect(() => {
    console.log('🔧 Estado atual - Colunas:', columns.length, 'Leads:', leads.length);
    if (columns.length > 0) {
      console.log('📊 Colunas:', columns.map(c => ({ id: c.id, title: c.title })));
    }
    if (leads.length > 0) {
      console.log('👥 Leads:', leads.map(l => ({ id: l.id, name: l.name, columnId: l.columnId })));
    }
  }, [columns, leads]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    console.log('🚀 Drag Start:', active.id, 'Type:', typeof active.id);
    console.log('🚀 Active data:', active.data.current);
    setActiveId(String(active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    console.log('🔄 Drag Over:', activeId, '->', overId);
    
    // Só processa se for um lead sendo arrastado
    if (!activeId.startsWith("lead-")) return;
    
    const leadId = activeId.replace('lead-', '');
    const activeLead = leads.find(lead => lead.id === leadId);
    if (!activeLead) return;
    
    let targetColumnId = null;
    
    // Se arrastou sobre uma coluna (verificar se é um ID de coluna válido)
    const columnIds = columns.map(col => col.id);
    if (columnIds.includes(overId)) {
      targetColumnId = overId;
    }
    // Se arrastou sobre outro lead
    else if (overId.startsWith("lead-")) {
      const overLeadId = overId.replace('lead-', '');
      const overLead = leads.find(lead => lead.id === overLeadId);
      if (overLead) {
        targetColumnId = overLead.columnId;
      }
    }
    
    // Atualiza a coluna do lead se necessário
    if (targetColumnId && targetColumnId !== activeLead.columnId) {
      console.log('✅ Movendo lead para coluna:', targetColumnId);
      setLeads(prevLeads => prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, columnId: targetColumnId }
          : lead
      ));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    console.log('🏁 Drag End:', active.id, '->', over?.id);
    
    // Sempre limpa o activeId no final
    setActiveId(null);
    
    if (!over) {
      console.log('❌ Drag cancelado - sem destino');
      return;
    }
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Se soltou no mesmo lugar, não faz nada
    if (activeId === overId) {
      console.log('⚪ Mesmo local - sem mudanças');
      return;
    }
    
    // Reordenar colunas
    const columnIds = columns.map(col => col.id);
    if (columnIds.includes(activeId) && columnIds.includes(overId)) {
      console.log('🔄 Reordenando colunas');
      const oldIndex = columns.findIndex(col => col.id === activeId);
      const newIndex = columns.findIndex(col => col.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setColumns(arrayMove(columns, oldIndex, newIndex));
      }
      return;
    }
    
    // Processar movimento de leads
    if (activeId.startsWith("lead-")) {
      const leadId = activeId.replace('lead-', '');
      const activeLead = leads.find(lead => lead.id === leadId);
      if (!activeLead) {
        console.log('❌ Lead não encontrado:', leadId);
        return;
      }
      
      let targetColumnId = activeLead.columnId;
      
      // Determinar coluna de destino
      const columnIds = columns.map(col => col.id);
      if (columnIds.includes(overId)) {
        targetColumnId = overId;
      } else if (overId.startsWith("lead-")) {
        const overLeadId = overId.replace('lead-', '');
        const overLead = leads.find(lead => lead.id === overLeadId);
        if (overLead) {
          targetColumnId = overLead.columnId;
        }
      }
      
      // Se mudou de coluna, atualizar
      if (targetColumnId !== activeLead.columnId) {
        console.log('💾 Salvando mudança de coluna:', activeLead.columnId, '->', targetColumnId);
        
        // Atualizar estado local imediatamente
        setLeads(prevLeads => prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, columnId: targetColumnId, status: getStatusFromColumnId(targetColumnId) }
            : lead
        ));
        
        // Atualizar no banco de dados
        fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            columnId: targetColumnId,
            status: getStatusFromColumnId(targetColumnId)
          }),
        })
          .then(response => {
            if (!response.ok) throw new Error('Falha ao mover lead');
            return response.json();
          })
          .then(() => {
            console.log('✅ Lead movido com sucesso');
          })
          .catch(error => {
            console.error('❌ Erro ao mover lead:', error);
            // Reverter mudança local em caso de erro
            setLeads(prevLeads => prevLeads.map(lead => 
              lead.id === leadId 
                ? { ...lead, columnId: activeLead.columnId, status: activeLead.status }
                : lead
            ));
          });
      }
      // Se é reordenação dentro da mesma coluna
      else if (overId.startsWith("lead-")) {
        const overLeadId = overId.replace('lead-', '');
        const overLead = leads.find(lead => lead.id === overLeadId);
        
        if (overLead && overLead.columnId === activeLead.columnId) {
          console.log('🔄 Reordenando leads na mesma coluna');
          
          const columnLeads = leads.filter(lead => lead.columnId === activeLead.columnId);
          const oldIndex = columnLeads.findIndex(lead => lead.id === leadId);
          const newIndex = columnLeads.findIndex(lead => lead.id === overLeadId);
          
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reorderedLeads = arrayMove(columnLeads, oldIndex, newIndex);
            
            // Atualizar posições
            const updatedLeads = leads.map(lead => {
              if (lead.columnId === activeLead.columnId) {
                const newPosition = reorderedLeads.findIndex(l => l.id === lead.id);
                return { ...lead, position: newPosition };
              }
              return lead;
            });
            
            setLeads(updatedLeads);
            
            // Atualizar posições no banco de dados
            reorderedLeads.forEach((lead, index) => {
              if (lead.position !== index) {
                fetch(`/api/leads/${lead.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ position: index }),
                })
                .catch(error => {
                  console.error('❌ Erro ao atualizar posição:', error);
                });
              }
            });
          }
        }
      }
    }
  }
  
  // Função auxiliar para mapear coluna para status
  function getStatusFromColumnId(columnId: string): string {
    const statusMap: { [key: string]: string } = {
      'novo': 'novo',
      'em-contato': 'em-contato',
      'qualificado': 'qualificado',
      'negociacao': 'negociacao',
      'fechado': 'fechado'
    };
    return statusMap[columnId] || 'novo';
  }

  function addColumn() {
    const newColumn: Column = {
      id: `coluna-${Date.now()}`,
      title: "Nova Coluna",
      position: columns.length,
    };
    
    // Salvar no banco de dados
    fetch('/api/columns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newColumn),
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao criar coluna');
        return response.json();
      })
      .then(data => {
        const newColumns = [...columns, data];
        setColumns(newColumns);
        // Notificar sobre a nova coluna
        notifyColumnChange(newColumns);
      })
      .catch(error => {
        console.error('Erro ao adicionar coluna:', error);
      });
  }

  function addLead(columnId: string) {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: "Novo Lead",
      status: "novo",
      columnId,
      position: leads.filter(lead => lead.columnId === columnId).length,
    };
    
    // Salvar no banco de dados
    fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newLead),
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao criar lead');
        return response.json();
      })
      .then(data => {
        setLeads([...leads, data]);
      })
      .catch(error => {
        console.error('Erro ao adicionar lead:', error);
      });
  }

  function updateColumn(columnId: string, title: string) {
    // Atualizar no banco de dados
    fetch(`/api/columns/${columnId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao atualizar coluna');
        return response.json();
      })
      .then(() => {
        const updatedColumns = columns.map(col => {
          if (col.id === columnId) {
            return { ...col, title };
          }
          return col;
        });
        setColumns(updatedColumns);
        // Notificar sobre a coluna atualizada
        notifyColumnChange(updatedColumns);
      })
      .catch(error => {
        console.error('Erro ao atualizar coluna:', error);
      });
  }

  function updateLead(leadId: string, data: Partial<Lead>) {
    // Atualizar no banco de dados
    fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao atualizar lead');
        return response.json();
      })
      .then(() => {
        setLeads(leads.map(lead => {
          if (lead.id === leadId) {
            return { ...lead, ...data };
          }
          return lead;
        }));
      })
      .catch(error => {
        console.error('Erro ao atualizar lead:', error);
      });
  }

  function deleteColumn(columnId: string) {
    if (!confirm('Tem certeza que deseja excluir esta coluna?')) return;
    
    // Excluir do banco de dados
    fetch(`/api/columns/${columnId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao excluir coluna');
        return response.json();
      })
      .then(() => {
        const filteredColumns = columns.filter(col => col.id !== columnId);
        setColumns(filteredColumns);
        // Remover leads da coluna excluída ou movê-los para outra coluna
        setLeads(leads.filter(lead => lead.columnId !== columnId));
        // Notificar sobre a coluna excluída
        notifyColumnChange(filteredColumns);
      })
      .catch(error => {
        console.error('Erro ao excluir coluna:', error);
      });
  }

  function deleteLead(leadId: string) {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    // Excluir do banco de dados
    fetch(`/api/leads/${leadId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao excluir lead');
        return response.json();
      })
      .then(() => {
        setLeads(leads.filter(lead => lead.id !== leadId));
      })
      .catch(error => {
        console.error('Erro ao excluir lead:', error);
      });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Header title="Kanban de Leads" />
      
      <div className="mt-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-4 overflow-x-auto pb-4 h-[calc(100vh-160px)]">
            <SortableContext items={columns.map(col => col.id)}>
              {columns.map(column => {
                const columnLeads = leads.filter(lead => lead.columnId === column.id);
                return (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    leads={columnLeads}
                    onAddCard={() => addLead(column.id)}
                    onUpdateTitle={(title) => updateColumn(column.id, title)}
                    onDelete={() => deleteColumn(column.id)}
                  >
                    {columnLeads.map(lead => (
                      <KanbanCard
                        key={lead.id}
                        id={`lead-${lead.id}`}
                        lead={lead}
                        onUpdate={(data) => updateLead(lead.id, data)}
                        onDelete={() => deleteLead(lead.id)}
                      />
                    ))}
                  </KanbanColumn>
                );
              })}
            </SortableContext>
            
            <AddColumnButton onClick={addColumn} />
          </div>
        </DndContext>
      </div>
    </>
  );
}