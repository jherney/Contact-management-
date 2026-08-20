# Contact Management System

A full-stack contact management application built with React, Vite, and Express. Organize, filter, search, and track interactions with your personal and professional contacts. Features session-based authentication with per-user data isolation, optional cloud persistence via Vercel Postgres or Vercel KV, and a localStorage fallback for offline use.

## Features

- **Authentication & Multi-User Support**: Session-based auth with secure HTTP-only cookies and per-user contact isolation
- **Contact CRUD**: Create, read, update, delete contacts with rich details (scoped to authenticated user)
- **Favorites & Tagging**: Star important contacts and organize with tags
- **Interaction Logging**: Track calls, emails, meetings, and notes with timestamps
- **Multiple Views**: Switch between grid (visual cards) and table (detailed list) views
- **Powerful Filtering**: Search by name, filter by category, tag, favorites, recent activity
- **Import/Export**: Backup and restore your contacts as JSON or CSV with flexible merge strategies
- **Responsive Design**: Works on desktop and mobile devices
- **Persistent Storage**:
  - Optional Vercel Postgres (PostgreSQL) for relational storage
  - Optional Vercel KV (Redis) for session and key-value storage
  - Automatic localStorage fallback when cloud services aren't configured
- **CSRF Protection**: Built-in CSRF token validation for all state-changing requests
- **Data Migration**: Automatic migration of existing local contacts to your user account on first login

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite 6 for fast development and building
- Tailwind CSS 4 for styling
- Lucide React for icons
- React Context for auth state management

### Backend
- Node.js with Express
- TypeScript for type safety
- bcrypt for password hashing
- cookie-parser for session cookie management
- csurf for CSRF protection
- Vercel Postgres SDK for PostgreSQL integration
- Vercel KV SDK for Redis/session integration
- Vite middleware for serving frontend in development

### Data Persistence
- Users table in Postgres for authentication
- Single `vercel_contacts` table with `user_id` for per-user data isolation
- Alternative: Vercel KV (key: `contacts_list`)
- Fallback: Browser localStorage + server memory

### Build & Dev Tools
- TypeScript compiler (`tsc`)
- Esbuild for production server bundling
- Vite for frontend bundling and HMR
- npm scripts for development, building, and preview

## Project Structure

```
contact-management/
├── src/                     # Frontend source code
│   ├── components/          # Reusable UI components
│   │   ├── ContactCard.tsx  # Grid view contact card
│   │   ├── ContactTableRow.tsx # Table view contact row
│   │   ├── AuthModal.tsx    # Login/Register modal
│   │   ├── modals/          # Contact detail, form, import/export, DB status modals
│   │   └── layout/          # Navbar, Sidebar
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── services/            # Backend service wrappers
│   │   ├── vercelDatabase.ts # API calls for contact sync and DB status
│   │   ├── authApi.ts       # Frontend auth API calls
│   │   └── sessionStore.ts  # Server-side session store (KV)
│   ├── utils/               # Helper functions
│   │   ├── contactUtils.ts  # Filtering and sorting logic
│   │   └── validation.ts    # Input validation
│   ├── types.ts             # TypeScript interfaces
│   ├── data/                # Initial sample data and migrations
│   │   ├── initialContacts.ts
│   │   └── migrations/
│   │       └── 001_add_users_and_user_id.sql
│   ├── App.tsx              # Main application component
│   └── main.tsx             # React entry point
├── server.ts                # Express backend with Vite middleware
├── index.html               # SPA entry point
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration with Tailwind plugin
```

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm, yarn, or pnpm
- Git
- Vercel Postgres database (for auth and multi-user support)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/jherney/Contact-management-.git
   cd Contact-management-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Copy `.env.example` to `.env` and fill in your Vercel Postgres and KV credentials.
   ```bash
   cp .env.example .env
   ```
   
   Required for authentication:
   - `POSTGRES_URL` — your Vercel Postgres connection string
   - `SESSION_SECRET` — a random secret string for signing session cookies

   Optional:
   - `KV_REST_API_URL`, `KV_REST_API_TOKEN` — for Vercel KV (sessions and caching)

4. **Run database migration**
   Execute the SQL migration against your Postgres database:
   ```bash
   psql $POSTGRES_URL -f src/data/migrations/001_add_users_and_user_id.sql
   ```
   Or run the SQL manually in the Vercel Postgres dashboard.

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

### Production Build

1. **Build for production**
   ```bash
   npm run build
   ```
   This creates an optimized build in the `dist/` directory

2. **Start the production server**
   ```bash
   npm start
   ```
   The server will serve the static frontend and API on `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
APP_URL="http://localhost:3000"

# Required for authentication
SESSION_SECRET="generate-a-random-secret-string-here"
POSTGRES_URL="your_postgres_connection_string"

# Optional: Vercel KV for sessions and caching
KV_REST_API_URL="your_kv_rest_api_url"
KV_REST_API_TOKEN="your_kv_rest_api_token"
```

## Authentication & Multi-User Architecture

### How It Works
- **Session-Based Auth**: Users register/login with email and password. Passwords are hashed with bcrypt (12 rounds).
- **HTTP-Only Cookies**: Session IDs are stored in secure, HTTP-only cookies (7-day TTL).
- **Per-User Data Isolation**: All contact data includes a `user_id` field. API endpoints filter contacts by the authenticated user's ID.
- **CSRF Protection**: All state-changing requests require a valid CSRF token.
- **Data Migration**: On first login after enabling auth, existing local contacts are automatically migrated to your account.

### API Endpoints

The Express backend provides these API endpoints:

- `GET /api/database/status` - Check database connection status and active provider
- `GET /api/auth/csrf` - Get CSRF token for form submissions
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Log in and create session
- `POST /api/auth/logout` - Log out and destroy session
- `GET /api/auth/me` - Get current authenticated user
- `GET /api/contacts` - Fetch all contacts for authenticated user
- `POST /api/contacts` - Save/sync contacts for authenticated user
- `DELETE /api/contacts/:id` - Delete a single contact
- `GET /api/contacts/count` - Get contact count for authenticated user

## Usage

### Authentication
- **Register**: Click "Sign In" in the navbar, then switch to "Create Account"
- **Login**: Click "Sign In" and enter your credentials
- **Logout**: Click your name in the navbar, then "Logout"

### Managing Contacts
- **Add Contact**: Click the "+" button in the navbar or mobile FAB (requires login)
- **Edit Contact**: Click on a contact card/row, then click the edit button in the detail modal
- **Delete Contact**: Click the delete button in the contact card/row or detail modal
- **Toggle Favorite**: Click the star icon on a contact card/row or in the detail modal
- **View Details**: Click on any contact to open the detail modal

### Filtering & Search
- Use the search box in the navbar to filter by name
- Use the sidebar filters to narrow by category, tags, favorites, and recent activity
- Click the "Reset" button to clear all filters

### Import/Export
- **Export**: Click the "Import/Export" button in the navbar, then "Export Contacts"
- **Import**: Click the "Import/Export" button, select a JSON or CSV file, choose a merge strategy (skip/replace/allow), and confirm

### Database Status
- Click the database icon in the navbar to view connection status and provider information
- The status shows whether you're connected to Vercel Postgres, Vercel KV, or using localStorage fallback

## Deployment

### Vercel (Recommended)
1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add your environment variables (Postgres/KV credentials) in Vercel Settings
4. Run the database migration in the Vercel Postgres dashboard
5. Vercel will automatically detect the Node.js project and build/deploy it

### Docker
```bash
# Build the Docker image
docker build -t contact-manager .

# Run the container
docker run -p 3000:3000 -d contact-manager
```

### Manual Server Deployment
1. Copy the built `dist/` folder and `package.json` to your server
2. Run `npm install --production` on the server
3. Start with `npm start` or use a process manager like PM2

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Vercel](https://vercel.com) for providing Postgres and KV integrations
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Lucide](https://lucide.dev) for the beautiful open-source icons
- The open-source React and Vite communities

---

*Built with ❤️ for organized networking*
