-- CreateTable
CREATE TABLE `Member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serialized_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `house` ENUM('Slytherin', 'Gryffindor', 'Hufflepuff', 'Ravenclaw') NOT NULL,

    UNIQUE INDEX `Member_serialized_id_key`(`serialized_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
