# Google Ads Campaign Simulator

An educational platform for simulating Google Ads search campaign auctions with real-time predictions, AI-powered optimizations, and comprehensive analytics.

## 🚀 Features

- **Campaign Wizard**: Step-by-step campaign creation with intuitive UI
- **Auction Simulation**: Realistic ad auction simulation with Quality Score, CPC, and bidding strategies
- **AI-Powered Keyword Generation**: Gemini AI integration for automatic keyword suggestions
- **Real-time Analytics**: Interactive charts and detailed performance metrics
- **User Management**: Role-based access control with admin dashboard
- **Database Integration**: SQL Server backend for data persistence
- **Caching System**: Deterministic simulation results with intelligent caching

## 📋 Prerequisites

- **Python**: 3.9 or higher
- **Node.js**: 16.x or higher
- **SQL Server**: 2022 or higher (or use Docker)
- **Google Ads API Access**: Developer token and OAuth credentials
- **Gemini API Key**: For AI-powered features (optional)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/google-ads-sim.git
cd google-ads-sim
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd gads-sim-backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `gads-sim-backend` directory:

```bash
cp env.example .env
```

Edit `.env` and add your credentials:

```env
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_login_customer_id
GOOGLE_ADS_USE_PROTO_PLUS=True

# Gemini AI API (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=GoogleAdsSim
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_DRIVER=SQL Server
```

#### Setup SQL Server Database

**Option 1: Using Docker** (Recommended)

```bash
cd ..
docker-compose up -d
```

**Option 2: Local SQL Server**

Ensure SQL Server is running and accessible, then initialize the database:

```bash
cd gads-sim-backend
python init_database.py
```

#### Start Backend Server

```bash
cd gads-sim-backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd gads-sim-frontend
npm install
```

#### Configure Environment Variables

Create a `.env.local` file in the `gads-sim-frontend` directory:

```bash
cp env.example .env.local
```

Edit `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Google OAuth (for user authentication)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_secret_here

# Admin Email (comma-separated)
ADMIN_EMAILS=your_admin_email@example.com
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

#### Start Frontend Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## 🔑 Getting Google Ads API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Ads API
4. Create OAuth 2.0 credentials
5. Apply for Google Ads Developer Token
6. Generate refresh token using OAuth playground

For detailed instructions, visit: [Google Ads API Setup Guide](https://developers.google.com/google-ads/api/docs/first-call/overview)

## 🔑 Getting Gemini API Key (Optional)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy the API key to your `.env` file

## 📁 Project Structure

```
google-ads-sim/
├── gads-sim-backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Business logic
│   │   ├── services/         # External services
│   │   ├── utils/            # Utilities
│   │   ├── database.py       # Database configuration
│   │   ├── models.py         # Data models
│   │   └── main.py           # Application entry point
│   ├── cache/                # Cached data (gitignored)
│   ├── tests/                # Unit tests
│   ├── env.example           # Environment template
│   ├── requirements.txt      # Python dependencies
│   └── init_database.py      # Database initialization
│
├── gads-sim-frontend/         # Next.js frontend
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes
│   │   ├── admin/           # Admin dashboard
│   │   ├── campaign/        # Campaign wizard
│   │   └── keyword-planner/ # Keyword tools
│   ├── components/           # React components
│   ├── lib/                 # Utilities and configs
│   ├── public/              # Static assets
│   ├── env.example          # Environment template
│   └── package.json         # Node dependencies
│
├── scripts/                  # Setup scripts
├── docker-compose.yml        # Docker configuration
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## 🚦 Usage

### Create a Campaign

1. Navigate to `http://localhost:3000`
2. Sign in with Google or credentials
3. Click "New Campaign"
4. Follow the 8-step wizard:
   - Campaign goals
   - Keywords (manual or AI-generated)
   - Budgets and bids
   - Geographic targeting
   - Ad creation
   - Preview and review
   - Run simulation
   - View results

### Admin Dashboard

Admins can access additional features:

- User management
- Access request approval
- Database viewer
- System analytics

Access admin dashboard at: `http://localhost:3000/admin`

## 🧪 Running Tests

### Backend Tests

```bash
cd gads-sim-backend
pytest tests/
```

### Frontend Tests

```bash
cd gads-sim-frontend
npm run test
```

## 📊 API Documentation

Interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔒 Security Notes

- **Never commit** `.env` files or `config.yaml` with real credentials
- Use environment variables for all sensitive data
- Change default database passwords in production
- Enable HTTPS in production environments
- Implement rate limiting for production APIs
- Regularly rotate API keys and secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Database Connection Issues

- Verify SQL Server is running: `docker ps` or check Windows Services
- Confirm credentials in `.env` file
- Check firewall settings for port 1433
- Run database initialization: `python init_database.py`

### Google Ads API Errors

- Verify all credentials are correct in `.env`
- Ensure developer token is approved
- Check API quota limits
- Review Google Ads API documentation

### Frontend Build Errors

- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Verify all environment variables are set in `.env.local`

### Port Already in Use

- Backend (8000): Change in `uvicorn` command
- Frontend (3000): Change in `package.json` dev script or use `npm run dev -- -p 3001`

## 📧 Support

For issues and questions:

- Open an issue on GitHub
- Check existing documentation
- Review API documentation at `/docs`

## 🙏 Acknowledgments

- Google Ads API for campaign data
- Google Gemini AI for keyword generation
- Next.js and FastAPI communities
- All contributors to this project

---

**Note**: This is an educational simulation tool. Results may not reflect actual Google Ads performance. Always test with real campaigns for production decisions.

