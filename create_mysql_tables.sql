-- Script SQL para criar as tabelas do ZapBot no MySQL
-- Execute este script no phpMyAdmin ou cliente MySQL

-- Usar o banco de dados
USE `default`;

-- Criar tabela User
CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar tabela Column
CREATE TABLE IF NOT EXISTS `Column` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar tabela Lead
CREATE TABLE IF NOT EXISTS `Lead` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `source` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'novo',
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `columnId` VARCHAR(191) NULL,
  `position` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `Lead_columnId_fkey` (`columnId`),
  CONSTRAINT `Lead_columnId_fkey` FOREIGN KEY (`columnId`) REFERENCES `Column` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar tabela Integration
CREATE TABLE IF NOT EXISTS `Integration` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `config` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Inserir dados iniciais das colunas do Kanban
INSERT IGNORE INTO `Column` (`id`, `title`, `position`, `createdAt`, `updatedAt`) VALUES
('col-1', 'Novos Leads', 0, NOW(3), NOW(3)),
('col-2', 'Em Contato', 1, NOW(3), NOW(3)),
('col-3', 'Qualificados', 2, NOW(3), NOW(3)),
('col-4', 'Proposta Enviada', 3, NOW(3), NOW(3)),
('col-5', 'Fechados', 4, NOW(3), NOW(3));

-- Inserir usuário admin padrão (senha: admin123)
INSERT IGNORE INTO `User` (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`) VALUES
('user-admin', 'Administrador', 'admin@zapbot.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(3), NOW(3));

-- Inserir alguns leads de exemplo
INSERT IGNORE INTO `Lead` (`id`, `name`, `email`, `phone`, `source`, `status`, `notes`, `columnId`, `position`, `createdAt`, `updatedAt`) VALUES
('lead-1', 'João Silva', 'joao@email.com', '(11) 99999-9999', 'Website', 'novo', 'Lead interessado em nossos serviços', 'col-1', 0, NOW(3), NOW(3)),
('lead-2', 'Maria Santos', 'maria@email.com', '(11) 88888-8888', 'Facebook', 'novo', 'Veio através do Facebook Ads', 'col-1', 1, NOW(3), NOW(3)),
('lead-3', 'Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 'Indicação', 'em_contato', 'Indicado por cliente atual', 'col-2', 0, NOW(3), NOW(3));

-- Inserir integrações de exemplo
INSERT IGNORE INTO `Integration` (`id`, `name`, `type`, `config`, `createdAt`, `updatedAt`) VALUES
('int-1', 'WhatsApp Business', 'whatsapp', '{"api_key": "", "phone_number": ""}', NOW(3), NOW(3)),
('int-2', 'Facebook Leads', 'facebook', '{"access_token": "", "page_id": ""}', NOW(3), NOW(3)),
('int-3', 'Google Sheets', 'sheets', '{"sheet_id": "", "credentials": ""}', NOW(3), NOW(3));

SELECT 'Tabelas criadas com sucesso!' as status;