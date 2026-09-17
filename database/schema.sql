-- MSWD Management System Database Schema
-- MySQL

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `mswd_mahayag` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mswd_mahayag`;

-- =====================================================
-- ROLES
-- =====================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO `roles` (`name`, `description`) VALUES
('admin', 'System Administrator - Full access to all modules'),
('officer', 'Sector Officer - Access limited to assigned sector');

-- =====================================================
-- SECTORS
-- =====================================================
CREATE TABLE IF NOT EXISTS `sectors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO `sectors` (`name`, `slug`, `description`) VALUES
('Juvenile', 'juvenile', 'Juvenile welfare and development'),
('Solo Parent', 'solo-parent', 'Solo parent welfare and assistance'),
('Senior Citizens', 'senior-citizens', 'Senior citizen welfare and services'),
('PWD', 'pwd', 'Persons with Disabilities welfare');

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `suffix` VARCHAR(20) DEFAULT NULL,
  `contact_number` VARCHAR(20) DEFAULT NULL,
  `role_id` INT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 0,
  `is_approved` TINYINT(1) DEFAULT 0,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON `users`(`role_id`);
CREATE INDEX idx_users_active ON `users`(`is_active`);

-- =====================================================
-- OFFICER ASSIGNMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS `officer_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `sector_id` INT NOT NULL,
  `assigned_by` INT DEFAULT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`),
  FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_active_assignment` (`user_id`, `sector_id`, `is_active`)
) ENGINE=InnoDB;

CREATE INDEX idx_assignment_user ON `officer_assignments`(`user_id`);
CREATE INDEX idx_assignment_sector ON `officer_assignments`(`sector_id`);

-- =====================================================
-- BENEFICIARIES (Common table)
-- =====================================================
CREATE TABLE IF NOT EXISTS `beneficiaries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_number` VARCHAR(50) NOT NULL UNIQUE,
  `sector_id` INT NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `suffix` VARCHAR(20) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `sex` ENUM('Male','Female','Other') DEFAULT NULL,
  `civil_status` ENUM('Single','Married','Widowed','Separated','Divorced') DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `barangay` VARCHAR(100) DEFAULT NULL,
  `contact_number` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `registration_date` DATE DEFAULT (CURRENT_DATE),
  `status` ENUM('Active','Inactive','Archived') DEFAULT 'Active',
  `registered_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`),
  FOREIGN KEY (`registered_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_beneficiary_sector ON `beneficiaries`(`sector_id`);
CREATE INDEX idx_beneficiary_status ON `beneficiaries`(`status`);
CREATE INDEX idx_beneficiary_barangay ON `beneficiaries`(`barangay`);
CREATE INDEX idx_beneficiary_number ON `beneficiaries`(`beneficiary_number`);
CREATE INDEX idx_beneficiary_name ON `beneficiaries`(`last_name`, `first_name`);

-- =====================================================
-- JUVENILE RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS `juvenile_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `case_number` VARCHAR(50) NOT NULL UNIQUE,
  `case_status` ENUM('New','Under Assessment','Active','Under Intervention','For Follow-up','Closed','Referred') DEFAULT 'New',
  `case_type` VARCHAR(100) DEFAULT NULL,
  `case_description` TEXT DEFAULT NULL,
  `guardian_name` VARCHAR(255) DEFAULT NULL,
  `guardian_contact` VARCHAR(20) DEFAULT NULL,
  `school_name` VARCHAR(255) DEFAULT NULL,
  `grade_level` VARCHAR(50) DEFAULT NULL,
  `risk_level` ENUM('Low','Medium','High','Critical') DEFAULT 'Low',
  `assigned_officer_id` INT DEFAULT NULL,
  `date_opened` DATE DEFAULT (CURRENT_DATE),
  `date_closed` DATE DEFAULT NULL,
  `outcome` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_juvenile_case_number ON `juvenile_records`(`case_number`);
CREATE INDEX idx_juvenile_status ON `juvenile_records`(`case_status`);
CREATE INDEX idx_juvenile_beneficiary ON `juvenile_records`(`beneficiary_id`);

-- =====================================================
-- SOLO PARENT RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS `solo_parent_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `record_number` VARCHAR(50) NOT NULL UNIQUE,
  `spouse_name` VARCHAR(255) DEFAULT NULL,
  `spouse_status` ENUM('Deceased','Separated','Abandoned','Missing','Other') DEFAULT NULL,
  `number_of_children` INT DEFAULT 0,
  `monthly_income` DECIMAL(12,2) DEFAULT NULL,
  `employment_status` VARCHAR(100) DEFAULT NULL,
  `employer_name` VARCHAR(255) DEFAULT NULL,
  `needs_assessment` TEXT DEFAULT NULL,
  `registration_type` ENUM('Initial','Renewal') DEFAULT 'Initial',
  `pcso_number` VARCHAR(100) DEFAULT NULL,
  `valid_until` DATE DEFAULT NULL,
  `assigned_officer_id` INT DEFAULT NULL,
  `status` ENUM('Active','Inactive','Expired') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_sp_record_number ON `solo_parent_records`(`record_number`);
CREATE INDEX idx_sp_beneficiary ON `solo_parent_records`(`beneficiary_id`);

-- =====================================================
-- SENIOR CITIZEN RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS `senior_citizen_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `record_number` VARCHAR(50) NOT NULL UNIQUE,
  `osca_number` VARCHAR(100) DEFAULT NULL,
  `pension_status` ENUM('Received','Not Received','Suspended') DEFAULT 'Not Received',
  `monthly_pension` DECIMAL(12,2) DEFAULT NULL,
  `health_condition` TEXT DEFAULT NULL,
  `living_situation` ENUM('With Family','Alone','In Institution','With Spouse') DEFAULT 'With Family',
  `emergency_contact_name` VARCHAR(255) DEFAULT NULL,
  `emergency_contact_number` VARCHAR(20) DEFAULT NULL,
  `assigned_officer_id` INT DEFAULT NULL,
  `status` ENUM('Active','Inactive','Deceased') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_sc_record_number ON `senior_citizen_records`(`record_number`);
CREATE INDEX idx_sc_beneficiary ON `senior_citizen_records`(`beneficiary_id`);

-- =====================================================
-- PWD RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS `pwd_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `record_number` VARCHAR(50) NOT NULL UNIQUE,
  `pwd_number` VARCHAR(100) DEFAULT NULL,
  `disability_type` VARCHAR(255) NOT NULL,
  `disability_cause` VARCHAR(255) DEFAULT NULL,
  `disability_level` ENUM('Mild','Moderate','Severe','Profound') DEFAULT 'Mild',
  `assistive_device` VARCHAR(255) DEFAULT NULL,
  `education_attainment` VARCHAR(100) DEFAULT NULL,
  `employment_status` VARCHAR(100) DEFAULT NULL,
  `monthly_income` DECIMAL(12,2) DEFAULT NULL,
  `guardian_name` VARCHAR(255) DEFAULT NULL,
  `guardian_contact` VARCHAR(20) DEFAULT NULL,
  `assigned_officer_id` INT DEFAULT NULL,
  `status` ENUM('Active','Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_pwd_record_number ON `pwd_records`(`record_number`);
CREATE INDEX idx_pwd_beneficiary ON `pwd_records`(`beneficiary_id`);
CREATE INDEX idx_pwd_disability ON `pwd_records`(`disability_type`);

-- =====================================================
-- SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `sector_id` INT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_services_sector ON `services`(`sector_id`);

-- =====================================================
-- CASE SERVICES (services provided for a case)
-- =====================================================
CREATE TABLE IF NOT EXISTS `case_services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `provided_by` INT DEFAULT NULL,
  `date_provided` DATE DEFAULT (CURRENT_DATE),
  `details` TEXT DEFAULT NULL,
  `status` ENUM('Pending','Completed','Ongoing','Cancelled') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`provided_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_case_svc_beneficiary ON `case_services`(`beneficiary_id`);
CREATE INDEX idx_case_svc_service ON `case_services`(`service_id`);

-- =====================================================
-- CASE NOTES
-- =====================================================
CREATE TABLE IF NOT EXISTS `case_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `sector_record_id` INT DEFAULT NULL,
  `sector_record_type` VARCHAR(50) DEFAULT NULL,
  `note` TEXT NOT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_notes_beneficiary ON `case_notes`(`beneficiary_id`);

-- =====================================================
-- CASE FOLLOW-UPS
-- =====================================================
CREATE TABLE IF NOT EXISTS `case_followups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `sector_record_id` INT DEFAULT NULL,
  `sector_record_type` VARCHAR(50) DEFAULT NULL,
  `followup_type` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `scheduled_date` DATE DEFAULT NULL,
  `completed_date` DATE DEFAULT NULL,
  `status` ENUM('Scheduled','Completed','Missed','Cancelled') DEFAULT 'Scheduled',
  `assigned_to` INT DEFAULT NULL,
  `result` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_followup_beneficiary ON `case_followups`(`beneficiary_id`);
CREATE INDEX idx_followup_status ON `case_followups`(`status`);
CREATE INDEX idx_followup_date ON `case_followups`(`scheduled_date`);

-- =====================================================
-- DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_id` INT NOT NULL,
  `uploaded_by` INT DEFAULT NULL,
  `document_name` VARCHAR(255) NOT NULL,
  `document_type` VARCHAR(100) DEFAULT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_docs_beneficiary ON `documents`(`beneficiary_id`);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `type` ENUM('info','warning','success','danger') DEFAULT 'info',
  `link` VARCHAR(500) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notif_user ON `notifications`(`user_id`);
CREATE INDEX idx_notif_read ON `notifications`(`is_read`);

-- =====================================================
-- AUDIT LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(100) DEFAULT NULL,
  `record_id` INT DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_audit_user ON `audit_logs`(`user_id`);
CREATE INDEX idx_audit_action ON `audit_logs`(`action`);
CREATE INDEX idx_audit_module ON `audit_logs`(`module`);
CREATE INDEX idx_audit_created ON `audit_logs`(`created_at`);

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('system_name', 'MSWD Mahayag', 'System display name'),
('municipality', 'Mahayag, Zamboanga del Sur', 'Municipality name'),
('contact_email', '', 'System contact email'),
('contact_phone', '', 'System contact phone');

-- =====================================================
-- DEFAULT ADMIN USER
-- Password: admin123 (CHANGE IMMEDIATELY after first login in production)
-- =====================================================
INSERT INTO `users` (`username`, `email`, `password_hash`, `first_name`, `last_name`, `role_id`, `is_active`, `is_approved`)
VALUES ('admin', 'admin@mswd.gov.ph', '$2a$10$LCMgFiIYP4SXtwMTP/qRJeGE7z6ZevE4XAs1UdBaZFPEbZJZ6oLY2', 'System', 'Administrator', 1, 1, 1);

SET FOREIGN_KEY_CHECKS = 1;
