// Sistema de eventos para comunicação entre páginas
type EventCallback = (data?: any) => void;

class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
    
    // Também salvar no localStorage para comunicação entre abas/páginas
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_event', JSON.stringify({ event, data, timestamp: Date.now() }));
    }
  }
}

export const eventEmitter = new EventEmitter();

// Hook para escutar eventos do localStorage
export const useStorageEvents = () => {
  if (typeof window === 'undefined') return;
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'crm_event' && e.newValue) {
      try {
        const { event, data } = JSON.parse(e.newValue);
        eventEmitter.emit(event, data);
      } catch (error) {
        console.error('Erro ao processar evento do storage:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// Eventos disponíveis
export const EVENTS = {
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_DELETED: 'lead_deleted',
  COLUMN_CREATED: 'column_created',
  COLUMN_UPDATED: 'column_updated',
  COLUMN_DELETED: 'column_deleted',
} as const;