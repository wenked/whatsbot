/*
  Warnings:

  - Added the required column `owner_serialized_id` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Group` ADD COLUMN `owner_serialized_id` VARCHAR(191) NOT NULL;
