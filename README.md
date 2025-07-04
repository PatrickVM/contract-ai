# Contract AI - Project Intake System

An AI-powered system for gathering software project details through chat and voice interactions.

## 🏗️ Architecture

### Frontend (Next.js 15)

- **Framework**: Next.js 15 with App Router
- **UI**: Chatscope UI Kit for chat interface
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Type**: Client Components for interactivity, Server Components for data fetching

### Backend (Node.js/Express)

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4 for conversation flow and report generation
- **Deployment**: DigitalOcean VPS

### Voice Infrastructure

- **Telephony**: Jambonz (Docker for local, VPS for production)
- **ASR**: OpenAI Whisper API (with Docker fallback)
- **TTS**: Coqui TTS in Docker
- **Testing**: Local SIP softphone (Linphone/Zoiper)

## ✨ Features

1. **Web Chat Interface**: Interactive chat to gather project details
2. **Voice Call System**: Phone-based project intake
3. **Structured Reports**: AI-generated feasibility assessments and tech recommendations
4. **Conversation Storage**: PostgreSQL database for all interactions
5. **Local Testing**: Docker-based development environment

## 📁 Project Structure

```
contract-ai/
├── frontend/                 # Next.js 15 application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   └── lib/            # API utilities
│   ├── package.json
│   └── Dockerfile
├── backend/                  # Express API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript types
│   ├── prisma/             # Database schema
│   ├── package.json
│   └── Dockerfile
├── voice/                    # Voice infrastructure
│   └── jambonz-config.json
├── database/                 # Database schema and migrations
├── docker/                   # Docker configurations
├── scripts/                  # Setup and utility scripts
├── docker-compose.yml        # Local testing setup
├── env.example              # Environment variables template
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL
- OpenAI API key

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd contract-ai

# Run the setup script
./scripts/setup.sh
```

### 2. Configure Environment

```bash
# Copy and edit environment variables
cp env.example .env

# Update .env with your configuration:
# - OpenAI API key
# - Database credentials
# - Backend/Frontend URLs
```

### 3. Start Development Environment

#### Option A: Individual Services (Recommended for Development)

```bash
# Start database
docker-compose up -d postgres

# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

#### Option B: Full Docker Environment (For Testing)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Database**: localhost:5432

## 🧪 Testing Voice Pipeline

### 1. Start Voice Services

```bash
# Start voice infrastructure
docker-compose up -d jambonz whisper coqui-tts
```

### 2. Configure SIP Client

1. Install a SIP softphone (Linphone, Zoiper, or similar)
2. Register with Jambonz using:
   - SIP Domain: localhost
   - Username: test_user
   - Password: test_password
   - Port: 5060

### 3. Test Call Flow

1. Make a call to the Jambonz number
2. Verify ASR → AI → TTS flow
3. Monitor logs: `docker-compose logs -f jambonz whisper coqui-tts`

## 📊 API Endpoints

### Chat API

- `POST /api/chat/message` - Send chat message
- `GET /api/chat/conversation/:sessionId` - Get conversation
- `POST /api/chat/conversation` - Create conversation
- `POST /api/chat/report/:sessionId` - Generate report
- `GET /api/chat/stats` - Get conversation statistics

### Voice API

- `POST /api/voice/webhook/answer` - Handle incoming calls
- `POST /api/voice/webhook/gather` - Process speech input
- `POST /api/voice/webhook/finalize` - Complete conversation
- `POST /api/voice/webhook/status` - Call status updates

## 🚀 Production Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (DigitalOcean VPS)

1. Create a DigitalOcean droplet
2. Install Docker and Docker Compose
3. Clone repository and configure environment
4. Run with Docker Compose in production mode

### Voice Infrastructure (DigitalOcean VPS)

1. Deploy Jambonz to VPS
2. Configure SIP trunk with your provider
3. Update webhook URLs to production backend
4. Test with real phone numbers

## 🔧 Development

### Database Management

```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run migrations
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

### Adding New Features

1. **Backend**: Add routes in `src/routes/`, services in `src/services/`
2. **Frontend**: Add components in `src/components/`, pages in `src/app/`
3. **Database**: Update schema in `prisma/schema.prisma`

### Component Architecture

- **Server Components**: Database operations, AI service calls
- **Client Components**: Chat interface, real-time updates, user interactions
- **API Routes**: REST endpoints for chat and voice webhooks

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check if PostgreSQL container is running
   - Verify DATABASE_URL in .env
   - Run `docker-compose logs postgres`

2. **OpenAI API Errors**

   - Verify OPENAI_API_KEY is set correctly
   - Check API quota and billing
   - Review API response logs

3. **Voice Services Not Working**

   - Ensure all voice containers are running
   - Check Jambonz configuration
   - Verify webhook URLs are accessible

4. **Frontend Build Errors**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `npm install`
   - Check TypeScript errors: `npm run type-check`

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f jambonz

# Check service status
docker-compose ps
```

## 📝 Environment Variables

See `env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `BACKEND_URL` - Backend API URL
- `NEXT_PUBLIC_BACKEND_URL` - Frontend-accessible backend URL
- `JAMBONZ_*` - Jambonz telephony configuration
- `WHISPER_API_URL` - Whisper ASR service URL
- `COQUI_TTS_URL` - Coqui TTS service URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs
3. Create an issue in the repository
4. Contact the development team
