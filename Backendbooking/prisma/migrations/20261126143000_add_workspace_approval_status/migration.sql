-- AlterTable
ALTER TABLE `space_owner` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'approved';

-- Update check constraint on users.role
ALTER TABLE `users` DROP CONSTRAINT IF EXISTS `chk_users_role`;
ALTER TABLE `users` ADD CONSTRAINT `chk_users_role` CHECK (`role` IN ('member', 'admin_space', 'superadmin'));
