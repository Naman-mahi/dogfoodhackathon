# DOGFOOD Documentation Hub

Welcome to the comprehensive documentation for the **DOGFOOD Autonomous Hackathon Evaluation & Scoring Platform**.

---

## Documentation Directory

| Document | Description |
|:---|:---|
| 📐 **[ARCHITECTURE.md](ARCHITECTURE.md)** | System topology, single-port appliance design, reverse proxy, zero-trust peer isolation, and sequence diagrams. |
| 🔌 **[API_REFERENCE.md](API_REFERENCE.md)** | Complete REST API endpoint reference, authentication methods, payload schemas, and response examples. |
| 🗄️ **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** | PostgreSQL relational schema, tables, column constraints, indexes, ER diagrams, and seeding rules. |
| ⚖️ **[JUDGING_AND_SCORING.md](JUDGING_AND_SCORING.md)** | Mathematical formulation of Empirical Bayes score calibration ($k=2.0$), rubric weight customization, and round-robin judge assignment. |
| 📖 **[USER_GUIDE.md](USER_GUIDE.md)** | End-to-end user manual covering Admin, Organizer, Judge, and Participant workflows and interface features. |
| 🚀 **[DEPLOYMENT_AND_OPERATIONS.md](DEPLOYMENT_AND_OPERATIONS.md)** | Production Docker single-port setup, environment configuration, database backup/restore, and health monitoring. |

---

## Quick Reference

- **Web Application**: [`http://localhost:8080`](http://localhost:8080)
- **OpenAPI Swagger UI**: [`http://localhost:8080/docs`](http://localhost:8080/docs)
- **Lead Demo Credentials**:
  - Organizer: `organizer@dogfood.dev` / `demo2026`
  - Judge: `tomas.varga@example.org` / `demo2026`
  - System Admin: `admin@dogfood.internal` / `demo2026`
  - Participant: `ada@example.org` / `demo2026`
