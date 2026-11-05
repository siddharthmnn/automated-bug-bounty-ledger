-- =====================================================================
-- 001_phase1_baseline.sql
-- Phase 1 schema, reproduced exactly from our Phase 1 DDL submission.
-- Six tables: COMPANY, PROGRAM, RESEARCHER, VULNERABILITY, PATCH, PAYOUT.
-- Phase 1 began with CREATE DATABASE / USE; here the database is chosen
-- by the migration runner instead, so the same file can build both the
-- development database and the test database.
-- Every later change is made by a separate ALTER/CREATE migration so the
-- examiner can see exactly what Phase 2 changed.
-- =====================================================================

CREATE TABLE COMPANY (
    company_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    industry    VARCHAR(50),
    website     VARCHAR(100)
);

-- 1:M  COMPANY OFFERS PROGRAM  (FK on the "many" side)
CREATE TABLE PROGRAM (
    program_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    scope       VARCHAR(200),
    status      ENUM('ACTIVE','PAUSED','CLOSED') DEFAULT 'ACTIVE',
    company_id  INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES COMPANY(company_id) ON DELETE CASCADE
);

CREATE TABLE RESEARCHER (
    researcher_id     INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    country           VARCHAR(50),
    reputation_score  INT DEFAULT 0
);

-- M:1 with PROGRAM (RECEIVES) and M:1 with RESEARCHER (SUBMITS)
CREATE TABLE VULNERABILITY (
    vuln_id         INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    description     VARCHAR(500),
    severity        ENUM('LOW','MEDIUM','HIGH','CRITICAL'),
    cvss_score      DECIMAL(3,1) CHECK (cvss_score BETWEEN 0.0 AND 10.0),
    status          ENUM('SUBMITTED','TRIAGED','ACCEPTED','REJECTED','DUPLICATE') DEFAULT 'SUBMITTED',
    submitted_date  DATE NOT NULL,
    program_id      INT NOT NULL,
    researcher_id   INT NOT NULL,
    FOREIGN KEY (program_id) REFERENCES PROGRAM(program_id) ON DELETE CASCADE,
    FOREIGN KEY (researcher_id) REFERENCES RESEARCHER(researcher_id) ON DELETE CASCADE
);

-- 1:1 VULNERABILITY RESOLVED_BY PATCH (UNIQUE on the FK enforces 1:1)
CREATE TABLE PATCH (
    patch_id             INT AUTO_INCREMENT PRIMARY KEY,
    patch_date           DATE NOT NULL,
    verified_by          VARCHAR(100),
    verification_status  ENUM('PENDING','VERIFIED','FAILED') DEFAULT 'PENDING',
    notes                VARCHAR(300),
    vuln_id              INT NOT NULL UNIQUE,
    FOREIGN KEY (vuln_id) REFERENCES VULNERABILITY(vuln_id) ON DELETE CASCADE
);

-- 1:1 VULNERABILITY REWARDED_WITH PAYOUT (UNIQUE on the FK enforces 1:1)
CREATE TABLE PAYOUT (
    payout_id       INT AUTO_INCREMENT PRIMARY KEY,
    amount          DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency        VARCHAR(10) DEFAULT 'USD',
    payment_date    DATE,
    payment_status  ENUM('PENDING','COMPLETED','FAILED') DEFAULT 'PENDING',
    vuln_id         INT NOT NULL UNIQUE,
    FOREIGN KEY (vuln_id) REFERENCES VULNERABILITY(vuln_id) ON DELETE CASCADE
);
