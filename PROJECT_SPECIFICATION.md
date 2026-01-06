# VIT SCOPES Research Portal: Project Specification

## EXECUTIVE SUMMARY

**Project Title:** VIT SCOPES Research Portal: An Integrated Faculty-Scholar Appointment Management System
**Project Duration:** 6 Months (January 2025 - June 2025)
**Project Budget:** Estimated ₹8,50,000

---

## 1. PROBLEM STATEMENT IDENTIFICATION

### 1.1 Current Challenges
The VIT Research ecosystem currently faces significant inefficiencies in managing faculty-scholar interactions:
- **Time-Intensive Manual Coordination:** Scholars spend 3-5 hours weekly coordinating via email/phone.
- **Schedule Conflicts:** 35-40% last-minute cancellations.
- **Administrative Overhead:** Faculty spend 2-3 hours daily managing requests.
- **Document Management Chaos:** Dispersed documents across emails.
- **Lack of Visibility:** No centralized tracking of appointments/outcomes.
- **Compliance Tracking:** Difficulty ensuring adherence to VIT regulations.

### 1.2 Impact Analysis
- **Quantitative:** 15-20 hours lost per scholar/semester; 25% reduction in productive research time.
- **Qualitative:** Reduced feedback quality, increased stress, compliance risks.

### 1.3 Stakeholder Analysis
- **Research Scholars:** Need efficient booking & document submission.
- **Faculty Members:** Need organized schedules & centralized document access.
- **Research Administration:** Need oversight & compliance monitoring.
- **School/Department Heads:** Need analytics & resource insights.

---

## 2. PROJECT ABSTRACT

### 2.1 Solution Overview
Comprehensive web-based application (React.js, Supabase, TypeScript) for managing the research interaction lifecycle.

### 2.2 Key Innovations
- **Slot Management:** Dynamic calendar, conflict detection.
- **Role-Based Access:** Faculty, Scholar, Admin.
- **Document Repository:** Centralized, version-controlled storage.
- **Notifications:** Automated reminders & alerts.
- **Analytics:** Utilization metrics & progress tracking.

### 2.3 Technical Architecture
- **Frontend:** React.js 18.3.1, TypeScript, Tailwind CSS, ShadCN UI.
- **Backend:** Supabase (PostgreSQL 17.6), Edge Functions.
- **Security:** JWT Auth, RLS, HTTPS/TLS.
- **Infrastructure:** Supabase Cloud, CDN.

---

## 3. SOFTWARE DEVELOPMENT LIFECYCLE (SDLC)

**Model:** Agile (Scrum)
**Sprints:** 12 Sprints (2 weeks each)

- **Sprint 1-2 (Foundation):** Requirements, Design, DB Schema (Weeks 1-4)
- **Sprint 3-4 (Core Dev):** Authentication, User Roles (Weeks 5-8)
- **Sprint 5-6 (Appointment System):** Availability, Booking, Calendar (Weeks 9-12)
- **Sprint 7-8 (Document Mgmt):** Uploads, Access Control (Weeks 13-16)
- **Sprint 9-10 (Integration):** Notifications, VTOP Integration Analytics (Weeks 17-20)
- **Sprint 11 (Testing):** Unit/Integration/UAT, Security Audit (Weeks 21-22)
- **Sprint 12 (Deployment):** Production, Training, Handover (Weeks 23-24)

---

## 4. PROJECT MANAGEMENT FRAMEWORK

### 4.1 Work Breakdown Structure
1.  **Requirements Documentation**
2.  **System Design** (Arch, DB, UI/UX)
3.  **Development Modules** (Auth, Users, Booking, Docs, Notify, Admin)
4.  **Testing & QA**
5.  **Deployment & Support**

### 4.2 Resource Allocation
- **Team:** 1 PM, 2 Backend, 2 Frontend, 1 QA. Support: Designer, DevOps, Writer.
- **Budget:** Personnel (~₹23L), Infrastructure (~₹2L). Total ~₹27.5L (Scaled to ₹8.5L for academic scope).

---

## 5. REQUIREMENTS ENGINEERING

### 5.2 Functional Requirements (Selected)
- **FR1 Auth:** Secure registration, RBAC, JWT.
- **FR2 Profile:** Faculty/Scholar profiles.
- **FR3 Availability:** Faculty sets schedule, blocks dates. (*Note: Currently implemented as automated fixed slots*)
- **FR4 Booking:** Scholars filter & book, prevent double-booking.
- **FR5 Documents:** Upload PDF/DOC, versioning, search.
- **FR6 Notifications:** Email confirmation, reminders.
- **FR7 Admin:** View appointments, reports, user mgmt.
- **FR8 Integration:** VTOP redirection.

### 5.3 Non-Functional Requirements
- **Performance:** Load < 2s, 500 concurrent users.
- **Security:** HTTPS, bcrypt, CSRF, RLS.
- **Reliability:** 99.9% uptime, daily backups.

---

## 6. SYSTEM DESIGN

### 6.1 Architecture
Three-Tier: React SPA (Presentation) -> Supabase Edge Functions (App) -> PostgreSQL (Data).

### 6.2 Database Design
- **Entities:** Users, User_Roles, Availability, Faculty_Slots, Appointments, Documents, Slot_Requests.
- **Security:** RLS enabled.

---

## 7. TESTING STRATEGY
- **Unit:** Vitest/Jest (80% coverage).
- **Integration:** API & DB flow.
- **System:** End-to-end workflows.
- **UAT:** Real-world scenarios with stakeholders.
- **Performance:** JMeter/k6 (100 concurrent bookings).
- **Security:** OWASP Top 10 checks.

---

## 8. QUALITY STANDARDS
- **ISO 9001:2015** & **ISO/IEC 25010** alignment.
- **Metrics:** Velocity, Defect Density, Code Coverage, Uptime, Response Time.
