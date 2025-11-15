# KidoRide - Car Pool Coordination Platform

A web and mobile responsive application for drivers and parents to coordinate rides for children. Built with Next.js 14, TypeScript, TailwindCSS, and shadcn/ui components.

## Features

- **Driver Dashboard**: Create and manage rides with date, direction, available seats, pickup address, and notes
- **Parent Dashboard**: View available rides, assign children to rides, and manage bookings
- **Real-time Seat Tracking**: Automatic seat availability checking and first-come, first-served assignment
- **Responsive Design**: Works seamlessly on web and mobile devices
- **Demo Mode**: Uses in-memory demo data (no database setup required)

## Technology Stack

- **Frontend**: React + Next.js 14 (App Router), TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **Data**: Demo data stored in-memory (ready for Supabase integration)
- **Deployment**: Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Users

The app comes with pre-configured demo users for testing:

**Drivers:**
- Email: `john@example.com` (John Driver)
- Email: `mike@example.com` (Mike Driver)

**Parents:**
- Email: `sarah@example.com` (Sarah Parent) - Has 2 children: Emma, Lucas
- Email: `lisa@example.com` (Lisa Parent) - Has 1 child: Sophia

## Usage

### For Drivers

1. Sign in with a driver email (e.g., `john@example.com`)
2. Click "Create New Ride" to add a new ride
3. Fill in the ride details:
   - Date
   - Direction (To School / From School)
   - Total seats available
   - Pickup address
   - Optional notes
4. View all your rides and see passenger assignments
5. Delete rides if needed

### For Parents

1. Sign in with a parent email (e.g., `sarah@example.com`)
2. Select a date to view available rides
3. Click "Assign Child" on any available ride
4. Select which child to assign
5. View and manage your children's ride assignments
6. Remove children from rides if needed

## Demo Data Structure

The demo data is stored in `/lib/demo-data.ts`. This file contains:
- User management functions
- Ride CRUD operations
- Passenger assignment logic
- In-memory data storage

When ready to use Supabase, replace the demo data functions with Supabase client calls.

## Project Structure

```
kidoride/
├── app/                    # Next.js App Router pages
│   ├── driver/            # Driver dashboard
│   ├── parent/            # Parent dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Login page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   └── auth-provider.tsx  # Authentication context
├── lib/                   # Utility functions
│   ├── demo-data.ts       # Demo data storage
│   └── utils.ts           # Helper functions
└── public/                # Static assets
```

## Key Features Implementation

- **Seat Tracking**: Automatically calculates available seats when passengers are added/removed
- **First-Come, First-Served**: Seats are assigned in order of registration
- **Ride Closure**: Rides automatically close when all seats are filled
- **Direction Filtering**: Parents can see rides for both directions
- **Date Filtering**: Parents can filter rides by specific dates

## Future Enhancements

- Integrate Supabase for real-time database
- Add user authentication with Supabase Auth
- Implement real-time updates using Supabase Realtime
- Add notifications for ride updates
- Add ride history and analytics
- Implement payment integration (optional)

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will automatically detect Next.js and configure the build
4. Deploy!

For production, you'll want to:
- Set up Supabase project
- Configure environment variables
- Replace demo data with Supabase client

## License

See LICENSE file for details.
