"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompanySettings {
  nomeEmpresa: string;
  email: string;
  telefone: string;
  url: string;
  tema: 'claro' | 'escuro';
}

interface SettingsContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  isLoading: boolean;
}

const defaultSettings: CompanySettings = {
  nomeEmpresa: 'ZapBot CRM',
  email: '',
  telefone: '',
  url: '',
  tema: 'escuro'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    const savedSettings = localStorage.getItem('companySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Aplicar tema ao documento
  useEffect(() => {
    const root = document.documentElement;
    if (settings.tema === 'claro') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [settings.tema]);

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('companySettings', JSON.stringify(updatedSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
}