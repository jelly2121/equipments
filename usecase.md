# Use Case Diagram
## Equipment Inventory and Borrowing System

```mermaid
flowchart LR

    Admin((Admin))
    Borrower((Borrower))

    subgraph System["Equipment Inventory and Borrowing System"]

        UC1([Login])

        UC2([Add Equipment])
        UC3([View Equipment])
        UC4([Update Equipment])
        UC5([Delete Equipment])
        UC6([Search Equipment])

        UC7([View Equipment Availability])
        UC8([Borrow Equipment])
        UC9([Return Equipment])

        UC10([Record Borrow Transaction])
        UC11([Record Return Transaction])

    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC10
    Admin --> UC11

    Borrower --> UC1
    Borrower --> UC3
    Borrower --> UC6
    Borrower --> UC7
    Borrower --> UC8
    Borrower --> UC9

    UC8 -.->|includes| UC10
    UC9 -.->|includes| UC11