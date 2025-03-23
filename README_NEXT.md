# CymaSphere Next.js Implementation

This project utilizes Next.js for enhanced performance, SEO optimization, and a better developer experience.

## Getting Started

1. Install dependencies (with legacy peer dependencies to avoid conflicts)
   ```bash
   npm install --legacy-peer-deps
   ```

2. Run the development server
   ```bash
   npm run dev
   ```

3. Build for production
   ```bash
   npm run build
   ```

4. Start production server
   ```bash
   npm run start
   ```

## Key Features

### 📋 File-based Routing

Next.js uses the file system for routing - no need for manual route configuration:

- `pages/index.js` → `/`
- `pages/dashboard.js` → `/dashboard`
- `pages/settings.js` → `/settings`

### 🔒 Authentication

Authentication is handled through the AuthProvider:

- Client-side protection for all protected routes
- Easy to set up server-side protection with middleware
- Smooth transition between authenticated and non-authenticated states

### 🎨 Styling Approach

This project uses a combination of:

- Styled Components for component-specific styling
- CSS Modules for component-specific styles that need class selectors
- Global CSS imported only in `_app.js`

### 🔄 React Router Compatibility

For backward compatibility with React Router:

- `RouterAdapter` provides React Router-like context
- Custom hooks like `useNavigate` and `useLocation`
- Components that expect React Router will continue to work

### 🚀 Performance Optimization

- Server-side rendering for faster initial loads
- Code splitting for smaller bundle sizes
- Image optimization with next/image
- Script optimization with next/script

### 📱 Responsive Design

The application is fully responsive across:

- Desktop screens
- Tablets
- Mobile devices

### 🌐 Internationalization

Multi-language support is maintained through:

- i18next integration
- Language selector component
- Automatic language detection

## Tools and Utilities

The project includes several utilities to make development easier:

- `NextSEO` - For consistent SEO management
- `NextScript` - For optimized script loading
- `ErrorBoundary` - For graceful error handling
- `ClientOnly` - For components that should only render on the client

## Architecture

```
├── pages/               # Next.js pages (routes)
│   ├── _app.js          # Application wrapper
│   ├── _document.js     # Custom document
│   ├── index.js         # Home page
│   └── [...other pages]
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── contexts/        # Context providers
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   └── pages/           # Legacy page components
├── middleware.js        # Route middleware
└── next.config.js       # Next.js configuration
```

## Migration

For teams transitioning from React Router to Next.js, please refer to [NEXT_MIGRATION_GUIDE.md](NEXT_MIGRATION_GUIDE.md) for detailed instructions.

## Further Improvements

See [NEXT_IMPROVEMENTS.md](NEXT_IMPROVEMENTS.md) for planned enhancements and optimizations. 