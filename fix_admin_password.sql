-- Script para corrigir a senha do usuário admin
-- Execute este comando no phpMyAdmin para corrigir o login

UPDATE User SET password = '$2b$10$4DN9ONVk.zKNMB8X4IuTVOS2UBWb1V6LQ/HKRYiOU6PF1q6rSxat2' WHERE email = 'admin@zapbot.com';

-- Verificar se o usuário foi atualizado
SELECT id, name, email, 'Senha atualizada com sucesso!' as status FROM User WHERE email = 'admin@zapbot.com';