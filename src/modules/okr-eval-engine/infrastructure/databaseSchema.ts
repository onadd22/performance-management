/**
 * DATABASE SCHEMA & ENTITY-RELATIONSHIP DIAGRAM (ERD) SCHEMATIC
 * FOR OKR PERFORMANCE EVALUATION ENGINE
 * 
 * This file maps the relational schema and documentation for deployment.
 */

export const DATABASE_SCHEMA_DOCUMENTATION = {
  version: "1.0.0",
  engine: "PostgreSQL / SQLite Compatible",
  description: "Relational schema designed to support Clean Architecture OKR Evaluation.",
  
  tables: {
    employees: {
      name: "employees",
      columns: [
        { name: "id", type: "VARCHAR(50)", constraints: "PRIMARY KEY" },
        { name: "name", type: "VARCHAR(150)", constraints: "NOT NULL" },
        { name: "email", type: "VARCHAR(150)", constraints: "UNIQUE NOT NULL" },
        { name: "department", type: "VARCHAR(100)", constraints: "NOT NULL" }
      ]
    },
    
    quarters: {
      name: "quarters",
      columns: [
        { name: "id", type: "VARCHAR(20)", constraints: "PRIMARY KEY" }, // e.g. "Q1 2026"
        { name: "start_date", type: "DATE", constraints: "NOT NULL" },
        { name: "end_date", type: "DATE", constraints: "NOT NULL" }
      ]
    },
    
    objectives: {
      name: "objectives",
      columns: [
        { name: "id", type: "VARCHAR(50)", constraints: "PRIMARY KEY" },
        { name: "employee_id", type: "VARCHAR(50)", constraints: "FOREIGN KEY REFERENCES employees(id)" },
        { name: "quarter_id", type: "VARCHAR(20)", constraints: "FOREIGN KEY REFERENCES quarters(id) NOT NULL" },
        { name: "title", type: "TEXT", constraints: "NOT NULL" },
        { name: "score", type: "DECIMAL(4,2)", constraints: "DEFAULT 0.00 NOT NULL CHECK (score >= 0.00 AND score <= 1.00)" },
        { name: "status", type: "VARCHAR(30)", constraints: "DEFAULT 'Under Performance' NOT NULL" }
      ],
      indexes: [
        "idx_objectives_quarter",
        "idx_objectives_employee"
      ]
    },
    
    key_results: {
      name: "key_results",
      columns: [
        { name: "id", type: "VARCHAR(50)", constraints: "PRIMARY KEY" },
        { name: "objective_id", type: "VARCHAR(50)", constraints: "FOREIGN KEY REFERENCES objectives(id) ON DELETE CASCADE NOT NULL" },
        { name: "title", type: "TEXT", constraints: "NOT NULL" },
        { name: "okr_type", type: "VARCHAR(20)", constraints: "NOT NULL CHECK (okr_type IN ('committed', 'aspirational'))" },
        { name: "score", type: "DECIMAL(4,2)", constraints: "DEFAULT 0.00 NOT NULL CHECK (score >= 0.00 AND score <= 1.00)" },
        { name: "status", type: "VARCHAR(30)", constraints: "NOT NULL" }
      ],
      indexes: [
        "idx_key_results_objective"
      ]
    }
  },

  erd_diagram: `
+-------------------------------------------------------------+
|                     ENTITY RELATIONSHIP DIAGRAM             |
+-------------------------------------------------------------+
|                                                             |
|   [ employees ]                                             |
|   -----------                                               |
|   PK  id          VARCHAR(50) <---+                         |
|       name        VARCHAR(150)    |                         |
|       email       VARCHAR(150)    | (1 to Many)             |
|       department  VARCHAR(100)    |                         |
|                                   |                         |
|   [ quarters ]                    |                         |
|   ----------                      |                         |
|   PK  id          VARCHAR(20) <---+                         |
|       start_date  DATE            |                         |
|       end_date    DATE            |                         |
|                                   |                         |
|   [ objectives ]                  |                         |
|   ------------                    |                         |
|   PK  id          VARCHAR(50) <---+ (FK: employee_id)       |
|   FK  employee_id VARCHAR(50)     + (FK: quarter_id)        |
|   FK  quarter_id  VARCHAR(20)                               |
|       title       TEXT                                      |
|       score       DECIMAL(4,2)  <---+                       |
|       status      VARCHAR(30)       |                       |
|                                     | (1 to Many)           |
|   [ key_results ]                   |                       |
|   -------------                     |                       |
|   PK  id          VARCHAR(50)       |                       |
|   FK  objective_id VARCHAR(50) -----+                       |
|       title       TEXT                                      |
|       okr_type    VARCHAR(20)  ('committed', 'aspirational')|
|       score       DECIMAL(4,2)                               |
|       status      VARCHAR(30)                               |
+-------------------------------------------------------------+
`
};
