# Q&A Forum Application

A full-stack Q&A forum application built with FastAPI (backend) and Next.js (frontend), featuring real-time question and answer management with an admin panel.

## Features

- **User Features**
  - Ask questions
  - Answer questions
  - View all questions and answers
  - Real-time updates with WebSockets and SWR
  - Instant notifications for new questions

- **Admin Features**
  - Secure authentication with JWT
  - Manage question status (Pending, Escalated, Answered)
  - Delete answers
  - Dashboard with statistics
  - Priority sorting for escalated questions

### Installation & Setup

#### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/Sha1kh4/Forum
cd Forum
```
2. Create .env file for backend url in frontend DIR

```bash 
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env
```
or for powershell

```bash
"NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File -Append .env
```

3. Build and start the containers:
```bash
docker-compose up --build
```

4. Create a admin user by making curl request to backend 
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/register' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "username": "string",
  "password": "admin",
  "email": "string"
}'
```
5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Local Development

**Backend Setup:**

```bash
cd backend
pip install uv
uv sync
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
fastapi dev main.py
```

**Frontend Setup:**

```bash
cd frontend
npm install
npm run dev
```

Create a `.env.local` file in the frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Create a admin user by making curl request to backend 
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/register' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "username": "string",
  "password": "admin",
  "email": "string"
}'
```
## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **WebSockets** - Real-time bi-directional communication
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Python Jose** - JWT implementation

### Frontend
- **Next.js 15** - React framework
- **React** - UI library
- **Tailwind CSS** - Styling
- **SWR** - Data fetching and caching
- **Radix UI** - Accessible component primitives

## Architecture Overview

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile Browser]
    end
    
    subgraph "Frontend - Next.js"
        C[React Components]
        D[WebSocket Client]
        E[SWR Cache]
    end
    
    subgraph "Backend - FastAPI"
        F[REST API Endpoints]
        G[WebSocket Server]
        H[ConnectionManager]
        I[Auth Middleware]
    end
    
    subgraph "Data Layer"
        J[(SQLite Database)]
        K[SQLAlchemy ORM]
    end
    
    A --> C
    B --> C
    C --> F
    C --> D
    D <-->|Real-time Updates| G
    G --> H
    F --> I
    I --> K
    K --> J
    F --> K
    
    style G fill:#4F46E5
    style D fill:#4F46E5
    style H fill:#4F46E5
```

### WebSocket Real-time Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant WS as WebSocket Server
    participant API as REST API
    participant DB as Database
    
    Note over U1,U2: Users connect via WebSocket
    U1->>WS: Connect WebSocket
    U2->>WS: Connect WebSocket
    WS-->>U1: Connection Accepted
    WS-->>U2: Connection Accepted
    
    Note over U1,DB: User 1 posts a question
    U1->>API: POST /question
    API->>DB: Save Question
    DB-->>API: Question Saved
    API-->>U1: 200 OK
    
    Note over WS,U2: Broadcast to all clients
    API->>WS: Broadcast new_question
    WS-->>U1: New Question Event
    WS-->>U2: New Question Event
    
    Note over U2,DB: User 2 posts an answer
    U2->>API: POST /answer
    API->>DB: Save Answer
    DB-->>API: Answer Saved
    API-->>U2: 200 OK
    
    API->>WS: Broadcast new_answer
    WS-->>U1: New Answer Event
    WS-->>U2: New Answer Event
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Auth as Auth Endpoint
    participant JWT as JWT Handler
    participant DB as Database
    
    User->>Frontend: Enter Credentials
    Frontend->>Auth: POST /auth/token
    Auth->>DB: Verify User
    DB-->>Auth: User Found
    Auth->>JWT: Generate Token
    JWT-->>Auth: JWT Token
    Auth-->>Frontend: Access Token
    Frontend->>Frontend: Store in localStorage
    
    Note over User,DB: Making Authenticated Requests
    User->>Frontend: Access Admin Panel
    Frontend->>Auth: Request with Bearer Token
    Auth->>JWT: Verify Token
    JWT-->>Auth: Token Valid
    Auth->>DB: Fetch Data
    DB-->>Auth: Return Data
    Auth-->>Frontend: Protected Data
    Frontend-->>User: Display Content
```

### System Diagrams

### Admin Panel Workflow

```mermaid
flowchart TD
    Start([User Visits /admin]) --> CheckAuth{Authenticated?}
    
    CheckAuth -->|No| LoginForm[Show Login Form]
    LoginForm --> EnterCreds[Enter Username & Password]
    EnterCreds --> Submit[Submit Credentials]
    Submit --> Verify{Valid Credentials?}
    Verify -->|No| ShowError[Display Error Message]
    ShowError --> LoginForm
    Verify -->|Yes| StoreToken[Store JWT in localStorage]
    
    CheckAuth -->|Yes| LoadDashboard[Load Dashboard Data]
    StoreToken --> LoadDashboard
    
    LoadDashboard --> FetchQuestions[Fetch All Questions]
    FetchQuestions --> FetchAnswers[Fetch Answers for Each Question]
    FetchAnswers --> DisplayDash[Display Dashboard]
    
    DisplayDash --> Actions{Admin Action}
    
    Actions --> ChangeStatus[Change Question Status]
    Actions --> DeleteAnswer[Delete Answer]
    Actions --> Logout[Logout]
    
    ChangeStatus --> UpdateDB[Update Database]
    DeleteAnswer --> UpdateDB
    UpdateDB --> Refresh[Refresh Dashboard]
    Refresh --> DisplayDash
    
    Logout --> ClearToken[Clear localStorage]
    ClearToken --> Start
    
    style Start fill:#4F46E5,color:#fff
    style DisplayDash fill:#10B981,color:#fff
    style ShowError fill:#EF4444,color:#fff
    style StoreToken fill:#F59E0B,color:#fff
```

### Question Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Question Created
    
    Pending --> Escalated: Admin Escalates
    Pending --> Answered: Answer Provided
    
    Escalated --> Answered: Answer Provided
    Escalated --> Pending: Admin De-escalates
    
    Answered --> Pending: Admin Reopens
    Answered --> Escalated: Admin Escalates
    
    Answered --> [*]: Resolved
    
    note right of Pending
        Default state for
        new questions
    end note
    
    note right of Escalated
        High priority
        requires attention
    end note
    
    note right of Answered
        Question has been
        answered by community
    end note
```

## Database Schema

```mermaid
erDiagram
    Users ||--o{ Questions : creates
    Users ||--o{ Answers : creates
    Questions ||--o{ Answers : has
    
    Users {
        int userid PK
        string username UK
        string email UK
        string password
        string role
    }
    
    Questions {
        int questionid PK
        int userid FK
        string message
        enum Status
        datetime created_at
    }
    
    Answers {
        int answerid PK
        int questionid FK
        int userid FK
        string message
    }
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.12+ (for local development)


## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/token` - Login and get access token
- `GET /auth/users/me` - Get current user info
- `DELETE /auth/answer` - Delete an answer (authenticated)
- `POST /auth/change-status` - Change question status (authenticated)

### Questions & Answers
- `GET /` - Health check
- `POST /question` - Create a new question
- `GET /questions` - Get all questions
- `POST /answer` - Submit an answer
- `GET /answers/{questionid}` - Get answers for a specific question

### WebSocket
- `WS /ws` - WebSocket connection for real-time question updates


## Database Schema

### Users Table
- `userid` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `role` - User role (default: "admin")

### Questions Table
- `questionid` - Primary key
- `userid` - Foreign key to Users
- `message` - Question text
- `Status` - Enum (Pending, Escalated, Answered)
- `created_at` - Timestamp

### Answers Table
- `answerid` - Primary key
- `questionid` - Foreign key to Questions
- `userid` - Foreign key to Users
- `message` - Answer text

## Admin Panel

Access the admin panel at `/admin` to:
- View dashboard statistics
- Manage question statuses
- Delete inappropriate answers
- Monitor all questions and answers

Default admin credentials can be set up through the registration endpoint.

## Configuration

### Environment Variables

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Backend API URL

**Backend:**
- `SECRET_KEY` - JWT secret key (currently hardcoded, should be moved to env)
- `ALGORITHM` - JWT algorithm (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time

## Security Considerations

⚠️ **Important:** Before deploying to production:

1. Update CORS origins from `["*"]` to specific domains
2. Enable HTTPS
3. Implement rate limiting
4. Add input validation and sanitization
5. Set up proper logging and monitoring

## Development


### Code Style

- Backend: Follow PEP 8 guidelines
- Frontend: ESLint configuration included

## Docker Commands

```bash
# Build and start services
docker-compose up --build

# Start services in detached mode
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose up --build backend
```

## Troubleshooting

### Backend not connecting to database
- Ensure SQLite file has proper permissions
- Check if the database file is being created in the correct directory

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check if backend container is running: `docker-compose ps`
- Ensure both services are on the same Docker network

### Authentication issues
- Clear localStorage in browser
- Check JWT token expiration
- Verify credentials are correct

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FastAPI for the excellent Python web framework
- Next.js team for the React framework
- Tailwind CSS for the utility-first CSS framework
- Radix UI for accessible component primitives