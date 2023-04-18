/*
  Warnings:

  - Added the required column `qr_code` to the `Whatsapp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Commands` MODIFY `command_content` VARCHAR(2000) NOT NULL;

-- AlterTable
ALTER TABLE `Whatsapp` ADD COLUMN `qr_code` VARCHAR(1000) NOT NULL;
