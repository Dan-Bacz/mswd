-- Migration 001: Beneficiary household (family composition)
-- Run once against the server DB: mysql -u <user> -p <dbname> < database/migrations/001_household.sql
-- (Idempotent — safe to run multiple times.)

CREATE TABLE IF NOT EXISTS `beneficiary_household` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `member_name` VARCHAR(255) NOT NULL,
  `relation` VARCHAR(100) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `sex` ENUM('Male','Female','Other') DEFAULT NULL,
  `occupation` VARCHAR(150) DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_household_beneficiary
  ON `beneficiary_household`(`beneficiary_id`);