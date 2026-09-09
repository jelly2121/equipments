# Entity Relationship Diagram

```mermaid
erDiagram
    EQUIPMENT ||--o{ BORROW_TRANSACTIONS : "has"

    EQUIPMENT {
        BIGINT id PK
        TEXT equipment_name
        TEXT category
        TEXT asset_code UK
        TEXT condition
        TEXT availability
        TIMESTAMPTZ created_at
    }

    BORROW_TRANSACTIONS {
        BIGINT id PK
        BIGINT equipment_id FK
        TEXT borrower_name
        TEXT borrower_type
        TEXT department
        DATE borrow_date
        DATE return_date
        TEXT status
    }