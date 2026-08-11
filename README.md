# Contact Management System

A full-stack contact management application built with React, Vite, and Express. Organize, filter, search, and track interactions with your personal and professional contacts. Features optional cloud persistence via Vercel Postgres or Vercel KV, with a localStorage fallback for offline use.

## Features

- **Contact CRUD**: Create, read, update, delete contacts with rich details
- **Favorites & Tagging**: Star important contacts and organize with tags
- **Interaction Logging**: Track calls, emails, meetings, and notes with timestamps
- **Multiple Views**: Switch between grid (visual cards) and table (detailed list) views
- **Powerful Filtering**: Search by name, filter by category, tag, favorites, recent activity
- **Import/Export**: Backup and restore your contacts as JSON with flexible merge strategies
- **Responsive Design**: Works on desktop and mobile devices
- **Persistent Storage**: 
  - Optional Vercel Postgres (PostgreSQL) for relational storage
  - Optional Vercel KV (Redis) for key-value storage
  - Automatic localStorage fallback when cloud services aren't configured
- **Real-time Sync**: Changes automatically sync to configured cloud database
- **Status Monitoring**: Check database connection status and provider information

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite 6 for fast development and building
- Tailwind CSS 4 for styling
- Lucide React for icons
- Framer Motion for animations
- React Hooks for state management

### Backend
- Node.js with Express
- TypeScript for type safety
- Vercel Postgres SDK for PostgreSQL integration
- Vercel KV SDK for Redis integration
- Vite middleware for serving frontend in development

### Data Persistence
- Primary: Vercel Postgres (table: `vercel_contacts`)
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
│   │   ├── modals/          # Contact detail, form, import/export, DB status modals
│   │   └── layout/          # Navbar, Sidebar
│   ├── services/            # Backend service wrappers
│   │   └── vercelDatabase.ts # API calls for contact sync and DB status
│   ├── utils/               # Helper functions
│   │   ├── contactUtils.ts  # Filtering and sorting logic
│   │   └── validation.ts    # Input validation
│   ├── types.ts             # TypeScript interfaces
│   ├── data/                # Initial sample data
│   │   └── initialContacts.ts
│   ├── App.tsx              # Main application component
│   └── main.tsx             # React entry point
├── server.ts                # Express backend with Vite middleware
├── index.html               # SPA entry point
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
�└── vite.config.ts           # Vite configuration with Tailwind plugin
```

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm, yarn, or pnpm
- Git

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

3. **Configure environment (optional)**
   Copy `.env.example` to `.env` and fill in your Vercel Postgres or Vercel KV credentials if you want cloud persistence.
   For local-only usage, no configuration is needed.

4. **Start the development server**
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
# APP_URL: The URL where this app is hosted (used for self-referential links)
APP_URL="http://localhost:3000"

# VERCEL POSTGRES DATABASE CONFIGURATION (Option A)
# Get these from your Vercel Postgres integration
POSTGRES_URL="your_postgres_connection_string"
POSTGRES_PRISMA_URL="optional_prisma_url"
POSTGRES_URL_NON_POOLING="optional_direct_connection"
POSTGRES_USER="your_username"
POSTGRES_HOST="your_host"
POSTGRES_PASSWORD="your_password"
POSTGRES_DATABASE="your_database_name"

# VERCEL KV (REDIS) DATABASE CONFIGURATION (Option B)
# Get these from your Vercel KV integration
KV_URL="your_kv_url"
KV_REST_API_URL="your_kv_rest_api_url"
KV_REST_API_TOKEN="your_kv_rest_api_token"
KV_REST_API_READ_ONLY_TOKEN="optional_read_only_token"
```

**Note**: You only need to configure either Postgres OR KV (or neither for localStorage-only mode). The application automatically detects which services are configured.

## API Endpoints

The Express backend provides these API endpoints:

- `GET /api/database/status` - Check database connection status and active provider
- `GET /api/contacts` - Fetch all contacts (from Postgres, KV, or memory fallback)
- `POST /api/contacts` - Save/sync all contacts to the configured database

## Usage

### Managing Contacts
- **Add Contact**: Click the "+" button in the navbar or mobile FAB
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
- **Import**: Click the "Import/Export" button, select a JSON file, choose a merge strategy (skip/replace/allow), and confirm

### Database Status
- Click the database icon in the navbar to view connection status and provider information
- The status shows whether you're connected to Vercel Postgres, Vercel KV, or using localStorage fallback

## Deployment

### Vercel (Recommended)
1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add your environment variables (Postgres/KV credentials) in Vercel Settings
4. Vercel will automatically detect the Node.js project and build/deploy it

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
- [Framer Motion](https://www.framer.com/motion/) for animations
- The open-source React and Vite communities

--- 

*Built with �� ❤��️ for organized networking*