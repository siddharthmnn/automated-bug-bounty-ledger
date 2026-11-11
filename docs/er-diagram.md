# Entity–relationship model

The diagram reflects the MySQL schema after migrations 001–012. Qdrant is intentionally not an ER entity: it is a derived vector index synchronized from MySQL through VECTOR_SYNC_JOB.

~~~mermaid
erDiagram
    COMPANY ||--o{ PROGRAM : offers
    PROGRAM ||--o{ VULNERABILITY : receives
    RESEARCHER ||--o{ VULNERABILITY : submits
    VULNERABILITY ||--o| PATCH : resolved_by
    VULNERABILITY ||--o| PAYOUT : rewarded_with
    VULNERABILITY ||--o{ VULN_STATUS_HISTORY : records
    APP_USER o|--o| RESEARCHER : login_for
    APP_USER ||--o{ USER_SESSION : owns
    APP_USER o|--o{ VULN_STATUS_HISTORY : changes
    VULNERABILITY o|--o{ VULNERABILITY : duplicate_of

    COMPANY {
      int company_id PK
      varchar name
      varchar industry
      varchar website
    }
    PROGRAM {
      int program_id PK
      varchar name
      varchar scope
      enum status
      int company_id FK
    }
    RESEARCHER {
      int researcher_id PK
      varchar name
      varchar email UK
      varchar country
      int reputation_score
    }
    VULNERABILITY {
      int vuln_id PK
      varchar title
      text description
      enum severity
      decimal cvss_score
      enum status
      int duplicate_of_vuln_id FK
      date submitted_date
      int program_id FK
      int researcher_id FK
    }
    PATCH {
      int patch_id PK
      date patch_date
      varchar verified_by
      enum verification_status
      int vuln_id FK,UK
    }
    PAYOUT {
      int payout_id PK
      decimal amount
      varchar currency
      date payment_date
      enum payment_status
      int vuln_id FK,UK
    }
    APP_USER {
      int user_id PK
      varchar email UK
      char password_hash
      enum role
      int researcher_id FK,UK
      boolean is_active
    }
    USER_SESSION {
      bigint session_id PK
      int user_id FK
      char token_hash UK
      datetime expires_at
      datetime revoked_at
    }
    VULN_STATUS_HISTORY {
      bigint history_id PK
      int vuln_id FK
      int changed_by_user_id FK
      enum old_status
      enum new_status
      datetime changed_at
    }
    VECTOR_SYNC_JOB {
      bigint job_id PK
      int vuln_id
      enum operation
      enum state
      int attempts
      datetime created_at
    }
~~~

## Cardinality notes

- One company can offer many programs; each program belongs to exactly one company.
- One program can receive many reports; each report belongs to exactly one program.
- One researcher can submit many reports; each report has exactly one researcher.
- A report can have at most one patch and at most one payout; UNIQUE constraints on PATCH.vuln_id and PAYOUT.vuln_id enforce these 1:0..1 relationships.
- A researcher may have at most one login. An ADMIN login has no researcher link; a RESEARCHER login must have one.
- A report may point to one original report when its status is DUPLICATE. Many duplicate reports can reference the same original.
- Status history belongs to a report. Its actor is optional so audit history survives account deletion.
- VECTOR_SYNC_JOB intentionally has no foreign key to VULNERABILITY: DELETE jobs must survive deletion of the source report.
