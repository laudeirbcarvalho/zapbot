'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import Header from '@/app/components/Header';
import KanbanColumn from '@/app/components/KanbanColumn';
import KanbanCard from '@/app/components/KanbanCard';
import AddColumnButton from '@/app/components/AddColumnButton';
import { useColumnSync } from '@/app/hooks/useColumnSync';
import { eventEmitter, EVENTS, useStorageEvents } from '@/lib/events';

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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragLoading, setDragLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { notifyColumnChange } = useColumnSync();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Log movido para depois do carregamento dos dados

  // Carregar colunas e leads do banco de dados
  const fetchData = async () => {
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
      console.log('📥 Dados carregados da API:', leadsData);
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
  };

  useEffect(() => {
    fetchData();
    
    // Configurar listeners para eventos de leads
    const handleLeadCreated = (lead: Lead) => {
      console.log('🆕 Lead criado, atualizando kanban:', lead);
      setLeads(prevLeads => [...prevLeads, lead]);
    };
    
    const handleLeadUpdated = (lead: Lead) => {
      console.log('✏️ Lead atualizado, atualizando kanban:', lead);
      setLeads(prevLeads => 
        prevLeads.map(l => l.id === lead.id ? lead : l)
      );
    };
    
    const handleLeadDeleted = ({ id }: { id: string }) => {
      console.log('🗑️ Lead deletado, removendo do kanban:', id);
      setLeads(prevLeads => prevLeads.filter(l => l.id !== id));
    };
    
    // Registrar listeners
    eventEmitter.on(EVENTS.LEAD_CREATED, handleLeadCreated);
    eventEmitter.on(EVENTS.LEAD_UPDATED, handleLeadUpdated);
    eventEmitter.on(EVENTS.LEAD_DELETED, handleLeadDeleted);
    
    // Configurar listener para eventos de storage
    const cleanup = useStorageEvents();
    
    // Cleanup
    return () => {
      eventEmitter.off(EVENTS.LEAD_CREATED, handleLeadCreated);
      eventEmitter.off(EVENTS.LEAD_UPDATED, handleLeadUpdated);
      eventEmitter.off(EVENTS.LEAD_DELETED, handleLeadDeleted);
      if (cleanup) cleanup();
    };
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
    console.log('🎯 Iniciando drag:', active.id);
    setActiveId(String(active.id));
    
    if (active.id.toString().startsWith("lead-")) {
      const leadId = active.id.toString().replace('lead-', '');
      const lead = leads.find(l => l.id === leadId);
      setActiveLead(lead || null);
      // Mostrar feedback visual de início do drag
      setSaveMessage(`🎯 Arrastando "${lead?.name || 'Lead'}"... Solte em uma coluna para mover`);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    
    if (!over) {
      setDragOverColumn(null);
      return;
    }
    
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
      setDragOverColumn(overId);
      const targetColumn = columns.find(col => col.id === overId);
      if (targetColumn) {
        setSaveMessage(`🎯 Movendo "${activeLead.name}" para "${targetColumn.title}"`);
      }
    }
    // Se arrastou sobre outro lead
    else if (overId.startsWith("lead-")) {
      const overLeadId = overId.replace('lead-', '');
      const overLead = leads.find(lead => lead.id === overLeadId);
      if (overLead) {
        targetColumnId = overLead.columnId;
        setDragOverColumn(overLead.columnId);
        const targetColumn = columns.find(col => col.id === overLead.columnId);
        if (targetColumn) {
          setSaveMessage(`🎯 Movendo "${activeLead.name}" para "${targetColumn.title}"`);
        }
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
    setActiveLead(null);
    setDragOverColumn(null);
    
    if (!over) {
      console.log('❌ Drag cancelado - sem destino');
      return;
    }
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    console.log('🔍 ActiveId:', activeId, 'OverId:', overId);
    
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
      console.log('🎯 Processando movimento de lead');
      const leadId = activeId.replace('lead-', '');
      const activeLead = leads.find(lead => lead.id === leadId);
      if (!activeLead) {
        console.log('❌ Lead não encontrado:', leadId);
        return;
      }
      
      console.log('📋 Lead ativo:', activeLead.name, 'Coluna atual:', activeLead.columnId);
      console.log('🔍 Lead completo:', JSON.stringify(activeLead, null, 2));
      let targetColumnId = activeLead.columnId;
      
      // Determinar coluna de destino
      const columnIds = columns.map(col => col.id);
      console.log('🏛️ IDs das colunas:', columnIds);
      console.log('🎯 OverId:', overId, 'É coluna?', columnIds.includes(overId));
      
      if (columnIds.includes(overId)) {
        targetColumnId = overId;
        console.log('✅ Movendo para coluna:', targetColumnId);
      } else if (overId.startsWith("lead-")) {
        const overLeadId = overId.replace('lead-', '');
        const overLead = leads.find(lead => lead.id === overLeadId);
        if (overLead) {
          targetColumnId = overLead.columnId;
          console.log('✅ Movendo para coluna do lead:', targetColumnId);
        }
      }
      
      console.log('🔄 Coluna origem:', activeLead.columnId, '-> Coluna destino:', targetColumnId);
      console.log('🔍 Comparação:', `"${activeLead.columnId}" !== "${targetColumnId}"`, '=', activeLead.columnId !== targetColumnId);
      console.log('🔍 Tipos:', typeof activeLead.columnId, 'vs', typeof targetColumnId);
      
      // FORÇAR atualização sempre que houver drop em coluna diferente
      const shouldUpdate = targetColumnId !== activeLead.columnId || columnIds.includes(overId);
      console.log('🎯 Deve atualizar?', shouldUpdate, '(targetColumnId !== activeLead.columnId:', targetColumnId !== activeLead.columnId, '|| columnIds.includes(overId):', columnIds.includes(overId), ')');
      
      // Se mudou de coluna OU foi dropado em uma coluna, atualizar
      if (shouldUpdate && columnIds.includes(overId)) {
        console.log('💾 CONDIÇÃO ATENDIDA - Salvando mudança de coluna!');
        console.log('💾 Salvando mudança de coluna:', activeLead.columnId, '->', targetColumnId);
        
        // Obter nomes das colunas para mostrar na mensagem
        const sourceColumn = columns.find(col => col.id === activeLead.columnId);
        const targetColumn = columns.find(col => col.id === targetColumnId);
        
        // Mostrar mensagem detalhada imediatamente quando o drag acontece
        setSaveMessage(`Movendo "${activeLead.name}" para "${targetColumn?.title || 'Coluna'}"`);
        
        // Não atualizar estado local imediatamente para evitar conflitos
        // Os dados serão recarregados após a confirmação do servidor
        
        // Ativar loading durante a operação
        setDragLoading(true);
        
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
            console.log('🔄 Recarregando dados para sincronização...');
            
            // Mostrar mensagem de sucesso detalhada
            setSaveMessage(`Salvo com sucesso`);
            
            // Recarregar dados para garantir sincronização
            fetchData().then(() => {
              // Manter a mensagem por mais tempo após recarregar
              setTimeout(() => setSaveMessage(''), 3000);
            });
          })
          .catch(error => {
            console.error('❌ Erro ao mover lead:', error);
            
            // Mostrar mensagem de erro detalhada
            setSaveMessage(`Erro ao salvar`);
            setTimeout(() => setSaveMessage(''), 3000);
          })
          .finally(() => {
            // Desativar loading após operação
            setDragLoading(false);
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
            console.log('💾 Atualizando posições no banco:', reorderedLeads.map(l => ({ id: l.id, name: l.name, position: reorderedLeads.findIndex(rl => rl.id === l.id) })));
            
            reorderedLeads.forEach((lead, index) => {
              console.log(`🔄 Atualizando lead ${lead.name} para posição ${index}`);
              fetch(`/api/leads/${lead.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ position: index }),
              })
              .then(response => {
                if (!response.ok) throw new Error(`Falha ao atualizar posição do lead ${lead.name}`);
                console.log(`✅ Posição do lead ${lead.name} atualizada para ${index}`);
                return response.json();
              })
              .catch(error => {
                console.error(`❌ Erro ao atualizar posição do lead ${lead.name}:`, error);
              });
            });
          }
        }
      }
    }
  }
  
  // Função auxiliar para mapear coluna para status baseado no título
  function getStatusFromColumnId(columnId: string): string {
    const column = columns.find(col => col.id === columnId);
    if (!column) return 'novo';
    
    const titleLower = column.title.toLowerCase();
    
    // Mapear títulos de coluna para status
    if (titleLower.includes('novo') || titleLower.includes('lead')) return 'novo';
    if (titleLower.includes('contato') || titleLower.includes('em contato')) return 'em-contato';
    if (titleLower.includes('qualificado') || titleLower.includes('interessado')) return 'qualificado';
    if (titleLower.includes('negociação') || titleLower.includes('negociacao') || titleLower.includes('proposta')) return 'negociacao';
    if (titleLower.includes('fechado') || titleLower.includes('ganho') || titleLower.includes('vendido')) return 'fechado';
    
    // Se não encontrar correspondência, usar o título como status
    return titleLower.replace(/\s+/g, '-');
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
      status: getStatusFromColumnId(columnId),
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
      
      {/* Mensagem de status do drag and drop */}
       {saveMessage && (
         <div className={`fixed top-4 right-4 text-white px-8 py-4 rounded-xl shadow-2xl z-50 font-bold text-xl border-2 max-w-md ${
           saveMessage.includes('Salvo com sucesso') ? 'bg-green-600 border-green-400 animate-bounce' :
           saveMessage.includes('Erro ao salvar') ? 'bg-red-600 border-red-400 animate-pulse' :
           'bg-blue-600 border-blue-400 animate-pulse'
         }`}>
           <div className="flex items-center gap-3">
             <div className={`w-4 h-4 rounded-full ${
               saveMessage.includes('Salvo com sucesso') ? 'bg-green-300 animate-ping' :
               saveMessage.includes('Erro ao salvar') ? 'bg-red-300 animate-ping' :
               'bg-blue-300 animate-spin'
             }`}></div>
             <div className="text-sm leading-tight">{saveMessage}</div>
           </div>
         </div>
       )}
      
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
                const columnLeads = leads
                  .filter(lead => lead.columnId === column.id)
                  .sort((a, b) => (a.position || 0) - (b.position || 0));
                return (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    leads={columnLeads}
                    onAddCard={() => addLead(column.id)}
                    onUpdateTitle={(title) => updateColumn(column.id, title)}
                    onDelete={() => deleteColumn(column.id)}
                    isDropTarget={dragOverColumn === column.id}
                    isDragging={activeLead !== null}
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