# Cymasphere Next.js Implementation

This project has been migrated to use Next.js for improved performance, server-side rendering, and additional features like API routes.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Server-Side Rendering (SSR)**: Pre-renders pages on the server for better performance and SEO
- **API Routes**: Backend API functionality built directly into Next.js
- **CSS Modules**: Component-scoped CSS to avoid style collisions
- **Static Site Generation**: Generate static pages at build time for optimal performance
- **Image Optimization**: Automatic image optimization with Next.js Image component
- **Middleware**: Custom middleware for authentication and route protection

## Project Structure

- `pages/`: Next.js page components with file-based routing
- `pages/api/`: API routes that run on the server
- `public/`: Static assets served from the root path
- `src/`: Original React components and utilities
  - `components/`: Reusable UI components
  - `contexts/`: React context providers for state management
  - `hooks/`: Custom React hooks
  - `utils/`: Utility functions and helpers

## Routing

Next.js uses file-based routing:

- `pages/index.js` → `/`
- `pages/login.js` → `/login`
- `pages/dashboard.js` → `/dashboard`

Protected routes are secured both on the client-side using React's `useEffect` and can be further secured using middleware.

## Authentication Flow

Authentication is managed through the AuthContext provider, which is wrapped around the entire application in `_app.js`.

Protected routes check for authenticated users and redirect to the login page if a user is not authenticated.

## API Routes

API routes are defined in the `pages/api` directory:

- `pages/api/hello.js` → `/api/hello`

These are server-side endpoints that run on-demand and support middleware for authentication and validation.

## Development Notes

- CSS Modules (`.module.css`) should be used instead of global CSS imports to avoid style conflicts
- Use Next.js's `<Link>` component for client-side navigation
- Use `getServerSideProps` for server-side rendering or `getStaticProps` for static generation when appropriate
- The middleware.js file at the root handles route protection and redirects

## Legacy Mode

The original React app functionality has been preserved with scripts:

- `npm run react-start`: Start the original React app
- `npm run react-build`: Build the original React app

## Building for Production

```bash
npm run build
npm run start
```

This will generate an optimized production build and start the Next.js server. 