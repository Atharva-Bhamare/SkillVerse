# SkillVerse – Smart Placement & Career Management Platform

\<p align="center">   \<strong>A centralized platform connecting students, placement officers, and recruiters to simplify and streamline the campus placement process.\</strong> \</p>

\<p align="center">   \<img src="[https://img.shields.io/badge/Project-SkillVerse-6366f1?style=for-the-badge](https://img.shields.io/badge/Project-SkillVerse-6366f1?style=for-the-badge)" />   \<img src="[https://img.shields.io/badge/Status-Active%20Development-success?style=for-the-badge](https://img.shields.io/badge/Status-Active%20Development-success?style=for-the-badge)" />   \<img src="[https://img.shields.io/badge/Architecture-MERN%20Inspired-blue?style=for-the-badge](https://img.shields.io/badge/Architecture-MERN%20Inspired-blue?style=for-the-badge)" /> \</p>

\<p align="center">   \<a href="MY_VERCEL_URL">Live Demo\</a> •   \<a href="#features">Features\</a> •   \<a href="#tech-stack">Tech Stack\</a> •   \<a href="#installation--setup">Installation\</a> •   \<a href="#project-structure">Project Structure\</a> \</p>

---

## 📌 Overview

**SkillVerse** is a full-stack, web-based placement and career management platform designed to modernize the campus recruitment ecosystem.

Traditional placement processes often involve disconnected communication channels, manual student data management, scattered job notifications, and time-consuming application tracking.

SkillVerse addresses these challenges by providing a centralized platform where students can manage their professional profiles, explore job opportunities, apply for positions, and track their application progress, while placement officers can manage recruitment activities and oversee placement operations.

The platform implements **Role-Based Access Control (RBAC)** to provide separate access and functionality for students, placement officers, and administrators.

Whether it is managing student profiles, publishing job opportunities, handling applications, or monitoring placement activities, SkillVerse aims to make the entire placement journey more organized, transparent, and efficient.

## 🎯 Objectives

- Digitize and streamline the campus placement process.
- Provide a centralized platform for students and placement officers.
- Simplify job discovery and application management.
- Maintain structured student and professional profiles.
- Implement secure authentication and role-based authorization.
- Simplify resume and document management.
- Improve communication and transparency throughout recruitment activities.
- Provide a scalable foundation for future placement analytics and automation.

---

## ✨ Features

### 🔐 Authentication & Authorization

- Secure user registration and login.
- JWT-based authentication.
- Access token and refresh token management.
- Password hashing using bcrypt.
- Role-Based Access Control (RBAC).
- Protected routes and authorization middleware.
- Role-specific access for students, placement officers, and administrators.

### 🎓 Student Module

- Student registration and authentication.
- Profile creation and management.
- Profile completion tracking.
- Profile picture and resume uploads.
- Resume management through Cloudinary.
- Browse available job opportunities.
- Apply for eligible job opportunities.
- Track submitted applications.
- View relevant placement notifications.

### 💼 Job & Recruitment Management

- Create and publish job opportunities.
- Manage job information and requirements.
- Browse available opportunities.
- Search and filter job listings.
- Manage job application workflows.
- Track applications associated with recruitment opportunities.
- Manage job availability and status.

### 🏢 Placement Officer Module

- Placement officer authentication and authorization.
- Manage recruitment activities.
- Publish and manage job opportunities.
- Monitor student applications.
- Access relevant student and placement information.
- Manage placement-related operations.

### 🛡️ Administrator Module

- Dedicated administrator access.
- Administrative dashboard.
- Manage organizational recruitment data.
- Manage company information.
- Assign placement officers to relevant responsibilities.
- Control access through role-based authorization.

### 📊 Dashboard & Notifications

- Role-specific dashboards.
- Centralized placement information.
- Application-related notifications.
- Placement activity monitoring.
- Structured information presentation for different user roles.

### 📁 File Management

- Resume uploads.
- Profile image uploads.
- Cloudinary-based file storage.
- Multipart file handling.
- Secure backend file-processing workflows.

### 🎨 User Interface

- Modern and responsive user interface.
- Clean navigation and dashboard layouts.
- Consistent light and dark themes.
- Theme preference persistence.
- Form validation and user-friendly error messages.
- Organized and accessible application workflows.

---

## 👥 User Roles & Permissions

SkillVerse follows a Role-Based Access Control (RBAC) architecture.

| Role              | Responsibilities                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Student           | Manage profile, upload resume, explore jobs, apply for opportunities, track applications.        |
| Placement Officer | Manage recruitment activities, publish jobs, monitor applications, oversee placement operations. |
| Administrator     | Manage organizational data, companies, placement officers, and administrative operations.        |

Each role receives access only to the resources and operations authorized for that role.

---

## 🛠️ Tech Stack

The project uses a modular full-stack JavaScript architecture.

### Frontend

| Technology        | Purpose                        |
| ----------------- | ------------------------------ |
| HTML5             | Application structure          |
| CSS3              | Styling and responsive layouts |
| JavaScript (ES6+) | Frontend functionality         |
| Fetch API         | Backend communication          |
| Local Storage     | Theme preference persistence   |

### Backend

| Technology        | Purpose                             |
| ----------------- | ----------------------------------- |
| Node.js           | JavaScript runtime                  |
| Express.js        | Backend framework and REST APIs     |
| MongoDB           | NoSQL database                      |
| Mongoose          | Database modeling and interaction   |
| JWT               | Authentication and token management |
| bcryptjs          | Password hashing                    |
| express-validator | Request validation                  |
| Multer            | File upload handling                |
| Cloudinary        | Cloud-based file storage            |
| Winston           | Centralized application logging     |
| dotenv            | Environment configuration           |

### Development & Deployment Tools

| Tool               | Purpose                    |
| ------------------ | -------------------------- |
| Visual Studio Code | Development environment    |
| Git & GitHub       | Version control            |
| Postman            | API testing                |
| MongoDB Atlas      | Cloud database hosting     |
| Vercel             | Frontend deployment        |
| Live Server        | Local frontend development |
| npm                | Package management         |

---

## 🏗️ Project Architecture

SkillVerse follows a modular client-server architecture.

```text
                  ┌──────────────────────────┐
                  │       SkillVerse         │
                  │       Frontend           │
                  │   HTML, CSS, JavaScript  │
                  └────────────┬─────────────┘
                               │
                               │ REST API
                               │
                  ┌────────────▼─────────────┐
                  │       Express.js         │
                  │       Backend            │
                  │                          │
                  │  Authentication          │
                  │  Authorization           │
                  │  Controllers             │
                  │  Services                │
                  │  Validation              │
                  │  Middleware              │
                  └──────┬──────────┬────────┘
                         │          │
                ┌────────▼────┐  ┌──▼────────────┐
                │  MongoDB    │  │  Cloudinary   │
                │  Database   │  │  File Storage │
                └─────────────┘  └───────────────┘
```

### Architecture Highlights

- Separation of frontend and backend responsibilities.
- Modular backend structure.
- RESTful API communication.
- Centralized error handling.
- Reusable authentication and authorization middleware.
- Dedicated controllers, services, models, and validators.
- External cloud storage for uploaded files.

---

## 📂 Project Structure

The repository follows a separated frontend and backend structure.

```text
SkillVerse/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   │
│   ├── package.json
│   └── .env
│
├── docs/
│
├── .gitignore
└── README.md
```

*Note: This is a representative overview of the project structure. Individual files and modules may evolve as development progresses.*

---

## ⚙️ Installation & Setup

Follow these instructions to run SkillVerse locally.

### Prerequisites

Make sure the following tools are installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database)
- [Cloudinary](https://cloudinary.com/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project directory:

```bash
cd SkillVerse
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

Add the required configuration:

```env
PORT=5000

NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

JWT_EXPIRES_IN=15m

CLIENT_URL=http://localhost:5500

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Important:**

- Replace all placeholder values with your actual credentials.
- Use strong, unique JWT secrets.
- Configure Cloudinary credentials from your Cloudinary dashboard.
- Add any additional environment variables required by `backend/src/config/env.js`.
- Never commit your `.env` file to GitHub.

### 4. Start the Backend Server

Run the development server:

```bash
npm run dev
```

The backend should start on:

```text
http://localhost:5000
```

### 5. Run the Frontend

Open the frontend directory:

```bash
cd ../frontend
```

Open `index.html` using the VS Code Live Server extension.

The frontend will typically run at:

```text
http://localhost:5500
```

Make sure the `CLIENT_URL` environment variable matches the actual frontend origin.

### 6. Access the Application

Open your browser and navigate to:

```text
http://localhost:5500
```

You can now explore the SkillVerse application.

---

## 🔑 Environment Configuration

The backend requires environment variables for authentication, database connectivity, file storage, and application configuration.

| Variable              | Description                  |
| --------------------- | ---------------------------- |
| PORT                  | Backend server port          |
| NODE_ENV              | Application environment      |
| MONGO_URI             | MongoDB connection string    |
| JWT_SECRET            | Access token signing secret  |
| JWT_REFRESH_SECRET    | Refresh token signing secret |
| JWT_EXPIRES_IN        | Access token expiration      |
| CLIENT_URL            | Allowed frontend origin      |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud identifier  |
| CLOUDINARY_API_KEY    | Cloudinary API key           |
| CLOUDINARY_API_SECRET | Cloudinary API secret        |

Refer to the backend environment validation configuration for the complete list of required variables.

---

## 🔒 Security Implementation

Security is an important part of SkillVerse.

The backend incorporates:

- JWT-based authentication.
- Secure password hashing using bcrypt.
- Role-based authorization.
- Protected API routes.
- Input validation using express-validator.
- Centralized error handling.
- Environment-based secret management.
- CORS configuration.
- Secure file upload processing.
- Separation of authentication and authorization responsibilities.

Sensitive credentials and configuration values must remain on the backend and should never be exposed in frontend source code or public repositories.

---

## 🧪 API Testing

Backend APIs can be tested using [Postman](https://www.postman.com/).

Testing should cover:

- User registration and login.
- Authentication and token validation.
- Role-based access restrictions.
- Student profile management.
- Resume and profile image uploads.
- Job creation and management.
- Job application workflows.
- Application tracking.
- Notification operations.
- Unauthorized and invalid request handling.

---

## 🚀 Deployment

### Frontend Deployment – Vercel

The SkillVerse frontend is deployed using Vercel.

Deployment configuration:

| Setting          | Value                                |
| ---------------- | ------------------------------------ |
| Platform         | Vercel                               |
| Root Directory   | frontend                             |
| Framework Preset | Other                                |
| Output Directory | .                                    |
| Build Command    | Not required for the static frontend |

**Live Application:** YOUR_VERCEL_URL

### Backend Deployment

The backend requires a separate deployment with:

- Node.js runtime support.
- Production environment variables.
- MongoDB Atlas connectivity.
- Cloudinary credentials.
- Production frontend CORS configuration.

The frontend API configuration must point to the deployed backend URL rather than `localhost`.

---

## 🔮 Future Enhancements

The following enhancements can further extend the SkillVerse ecosystem:

- Automated email verification and password recovery.
- Advanced placement analytics and reporting.
- Intelligent resume screening using AI/ML.
- Automated resume analysis and ATS scoring.
- Smart job recommendations based on student profiles.
- Advanced job search and filtering.
- Real-time notifications.
- Interview scheduling and management.
- Placement drive management.
- Recruitment performance dashboards.
- Enhanced reporting and data visualization.
- Integration with additional recruitment services.

---

## 🎓 Project Information

**Project Name:** SkillVerse

**Project Category:** Full-Stack Web Application

**Domain:** Campus Placement & Career Management

**Architecture:** Client-Server Architecture

**Backend:** Node.js & Express.js

**Database:** MongoDB

**Frontend:** HTML, CSS & JavaScript

**Deployment:** Vercel (Frontend)

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a new feature branch.

```bash
git checkout -b feature/YourFeatureName
```

3. Commit your changes.

```bash
git commit -m "Add: Your feature description"
```

4. Push your branch.

```bash
git push origin feature/YourFeatureName
```

5. Open a Pull Request.

---

## 📜 License

A license has not yet been specified for this repository. Please check the repository's license information before reusing or distributing the project.

---

## 👨‍💻 Author

**Atharva Bhamare**

B.Tech – Computer Science and Engineering
Specialization: IoT, Cybersecurity & Blockchain Technology

**GitHub:** [Atharva-Bhamare](https://github.com/Atharva-Bhamare)

---

\<p align="center">
&#x20; \<strong>SkillVerse – Empowering Students. Simplifying Placements. Connecting Opportunities.\</strong>
\</p>

\<p align="center">
&#x20; Built with dedication to make campus recruitment smarter, simpler, and more accessible.
\</p>
