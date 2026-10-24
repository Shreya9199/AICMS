# AICMS - AICTE Integrated Case Monitoring System
> **Official AICTE Institutional Grievance & Case Monitoring Platform**
> 
> *A unified, transparent case governance ecosystem for higher education institutions, students, faculty, and regulatory authorities.*

[![Repository](https://img.shields.io/badge/GitHub-Shreya9199%2FAICMS-blue?logo=github)](https://github.com/Shreya9199/AICMS)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-336791?logo=postgresql)](https://neon.tech)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%203-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

---

## 📌 Overview

**AICMS** (**AICTE Integrated Case Monitoring System**) is a production-grade institutional grievance and case governance platform. It streamlines the filing, tracking, investigation, and resolution of institutional complaints with strict regulatory oversight, transparent public audit trails, and automated 14-day Service Level Agreement (SLA) timers.

---

## ✨ Key Capabilities

### 1. 🛡️ Strict Dual-Portal Architecture & Mutual Role Exclusion
- **Complainant Portal (`/portal`)**:
  - Exclusively for citizens, students, and institutional complainants.
  - File detailed grievances with multi-file attachment evidence.
  - Track real-time progress, status milestones, and official feedback.
- **Official Authority Portal (`/admin`)**:
  - Exclusively for authorized Inquiry Officers, Bureau Administrators, and Super Administrators.
  - Complete workload queue, complaint assignment, priority triage, SLA countdown monitoring, and resolution closure.
- **Mutual Exclusion & Cross-Login Prevention**:
  - Complainants cannot log in through or access the Official portal.
  - Officers cannot access the Complainant portal.
  - Frontend route guards and backend JWT dependency layers enforce strict access barriers.

### 2. 🔍 Instant Public Grievance Verification (`/track`)
- Track complaint progress publicly using unique non-sequential reference IDs (e.g., `NIV-2026-F89A2`).
- No login required.
- Complainant personal contact details are completely redacted to ensure safety and privacy.
- Displays official status timeline and action notes.

### 3. ⚖️ Multi-Bureau Regulatory Oversight
Grievances are systematically channeled across specialized regulatory jurisdictions:
- **Finance & Fee Regulation**: Capitation fees, delayed caution deposit refunds, unapproved tuition surcharges.
- **Approvals & Affiliation**: Unapproved branches, unaccredited programs, prospectus misrepresentation.
- **Academic Standards**: Student-faculty ratio deficits, examination withholding, syllabus non-compliance.
- **Anti-Ragging & Campus Safety**: Hazing, harassment, safety violations with immediate escalation triggers.

### 4. ⏱️ 14-Day Mandatory SLA Countdown & Escalation
- Automated resolution target timers calculated upon submission.
- Color-coded badges for active, approaching deadline, and escalated complaints.
- Immutable audit logging for every status transition and note addition.

### 5. 🎨 Modern Interactive Experience
- Interactive particle background canvas that responds to cursor interaction.
- Glassmorphic panels, ambient gradient blobs, and responsive desktop/mobile layouts.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, React Router v7, Lucide Icons |
| **Styling** | TailwindCSS 3, Vanilla CSS Design System, Glassmorphism |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **ORM & Database** | SQLAlchemy 2, Neon Serverless PostgreSQL |
| **Authentication** | OAuth2 Password Bearer, JWT (JSON Web Tokens), Passlib (Bcrypt) |

---

## 📁 Repository Structure

```text
AICMS/
├── backend/
│   ├── app/
│   │   ├── core/            # Database engine, JWT security, auth dependencies
│   │   ├── models/          # SQLAlchemy ORM models (User, Complaint, Bureau, AuditLog)
│   │   ├── routers/         # API endpoints (auth, portal, admin, analytics)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Workflow state machine, duplicate detection, email
│   │   ├── main.py          # FastAPI application entrypoint
│   │   ├── seed.py          # Database seeding script
│   │   └── sync_users.py    # Role credentials sync script
│   ├── requirements.txt     # Python dependencies
│   └── uploads/             # Supporting documents storage
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, StatusBadge, Timeline, AnimatedBackground
│   │   ├── context/         # AuthContext (state & JWT handling)
│   │   ├── pages/           # LandingPage, LoginPage, RegisterPage, AdminDashboard, etc.
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx          # Protected route wrappers & route table
│   │   └── index.css        # Design tokens, glassmorphism & keyframe animations
│   ├── index.html           # Single Page Application entry
│   ├── package.json         # Frontend dependencies & scripts
│   ├── tailwind.config.js   # Tailwind design extensions
│   └── vite.config.js       # Vite bundler configuration
├── .env.example             # Template for environment configuration
├── .gitignore               # Ignored dependencies & build artifacts
├── docker-compose.yml       # Container orchestration template
└── README.md                # Project documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** and **npm** installed
- A **PostgreSQL** database (e.g., [Neon Serverless Postgres](https://neon.tech))

---

### 1. Clone the Repository

```bash
git clone https://github.com/Shreya9199/AICMS.git
cd AICMS
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
# source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example .env
# Edit .env and supply your PostgreSQL DATABASE_URL and SECRET_KEY

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The interactive OpenAPI docs will be available at:
`http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```

Open your browser at:
`http://localhost:5173`

---

## 🔐 Default Seed Credentials

For evaluation and testing, predefined demo accounts are available:

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **Super Administrator** | `superadmin@nivaran.gov.in` | `password123` | Official Portal (`/login?tab=official`) |
| **Bureau Administrator** | `bureauadmin@nivaran.gov.in` | `password123` | Official Portal (`/login?tab=official`) |
| **Inquiry Officer** | `officer@nivaran.gov.in` | `password123` | Official Portal (`/login?tab=official`) |
| **Complainant** | `complainant@nivaran.gov.in` | `password123` | Complainant Portal (`/login?tab=citizen`) |

*Citizens and complainants can also register freely at `/register`.*

---

## 📜 API Endpoints Overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new complainant account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile & role |
| `GET` | `/api/v1/portal/track/{id}`| Public | Public grievance lookup by reference ID |
| `POST` | `/api/v1/portal/complaints`| Complainant | Submit new grievance dossier |
| `GET` | `/api/v1/portal/my-complaints` | Complainant | Fetch complainant's filed grievances |
| `GET` | `/api/v1/admin/complaints` | Official | Query, filter, and search all grievances |
| `POST` | `/api/v1/admin/complaints/{id}/status` | Official | Update grievance stage & append note |
| `GET` | `/api/v1/analytics/summary` | Official | Get bureau KPI metrics & SLA compliance |

---

## 📄 License & Attribution

Developed for institutional grievance redressal monitoring. Released under the [MIT License](LICENSE).  
Maintained by [@Shreya9199](https://github.com/Shreya9199).
