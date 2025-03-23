# Migrating from React Router to Next.js

This guide helps developers transition from the React Router-based application to the new Next.js architecture.

## Key Differences

### Routing
- **React Router**: Uses component-based routing with route definitions in `App.js`
- **Next.js**: Uses file-based routing where files in the `pages` directory automatically become routes

### Component Structure
- **React Router**: Routes render components directly
- **Next.js**: Page components are in the `pages` directory, while reusable components remain in `src/components`

### Data Fetching
- **React Router**: Data fetching typically happens inside components with hooks or effects
- **Next.js**: Offers specialized data fetching methods like `getServerSideProps`, `getStaticProps`, and `getStaticPaths`

## Migration Steps

### 1. Understanding Component Location

**React Router components**:
```jsx
<Route path="/dashboard" element={<Dashboard />} />
```

**Next.js equivalent**:
```jsx
// File: pages/dashboard.js
export default function DashboardPage() {
  return <Dashboard />;
}
```

### 2. Using the Router Adapter

For components that expect React Router hooks, use our custom adapter:

```jsx
// Old code
import { useNavigate } from 'react-router-dom';

// New code
import { useNavigate } from '../src/components/RouterAdapter';
```

### 3. CSS Handling

- Global CSS: Import in `_app.js` only
- Component CSS: Use CSS Modules with the `.module.css` extension

### 4. Authentication and Protected Routes

Instead of the `PrivateRoute` wrapper component, use client-side protection:

```jsx
// pages/protected-page.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/AuthContext';

export default function ProtectedPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) return <div>Loading...</div>;

  return <YourProtectedComponent />;
}
```

### 5. SEO and Head Management

Use the `NextSEO` component for consistent head management:

```jsx
import NextSEO from '../src/components/NextSEO';

export default function Page() {
  return (
    <>
      <NextSEO 
        title="Page Title"
        description="Page description"
        canonical="/page-path"
      />
      {/* Page content */}
    </>
  );
}
```

### 6. Links and Navigation

Replace React Router links with Next.js links:

```jsx
// Old code
import { Link } from 'react-router-dom';
<Link to="/about">About</Link>

// New code
import Link from 'next/link';
<Link href="/about">About</Link>
```

Or use our custom NextLink component for backward compatibility:

```jsx
import NextLink from '../src/components/NextLink';
<NextLink to="/about">About</NextLink>
```

## Testing Your Migration

1. Run `npm run dev` to start the Next.js development server
2. Visit all routes to ensure they work as expected
3. Test authentication flows
4. Verify that dynamic routes work correctly

## Common Issues

- **CSS Modules**: Make sure class names are accessed with `styles.className`
- **React Router Hooks**: Replace with our adapter hooks
- **useLayoutEffect Warnings**: These are expected in development mode and won't appear in production

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Router to Next.js Migration](https://nextjs.org/docs/migrating/from-react-router) 