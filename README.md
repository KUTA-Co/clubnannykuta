# Club Nanny

A modern platform connecting families with trusted, professional nannies.

## Project Overview

Club Nanny is a comprehensive childcare platform that helps families find experienced, verified nannies while providing nannies with tools to manage their bookings, earnings, and professional profiles.

## Technologies

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library for data visualization

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── lib/           # Utility functions and configurations
└── main.tsx       # Application entry point
```

## Features

### For Families
- Search and browse verified nannies
- View detailed nanny profiles with reviews
- Book nannies with date range selection
- Manage bookings and payments
- Chat with nannies (max 5 active conversations)
- Write and manage reviews
- Wallet system for payments

### For Nannies
- Professional profile management
- Booking management with start/end dates
- Earnings tracking and analytics
- Performance metrics and statistics
- Chat with families (max 5 active conversations)
- Review management
- Availability and schedule management

## Development

The development server runs on `http://localhost:8080` by default.

## Deployment

Build the project for production:

```sh
npm run build
```

The production build will be in the `dist` directory, ready to be deployed to any static hosting service.
