# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Server Architecture

The application now uses a client-server architecture:

1. **Frontend**: React application that handles UI and user interactions
2. **Backend**: Deno server that handles authentication, data storage, and business logic

### Why This Architecture?

We've moved sensitive operations like authentication and data storage to a secure backend server for several reasons:

- **Security**: API keys and sensitive operations are now handled on the server, not exposed in the client
- **Control**: More control over authentication flows and data validation
- **Scalability**: Easier to scale and maintain separate frontend and backend codebases

### Environment Variables

The Deno server uses environment variables for configuration:

```
PORT=8000
JWT_SECRET=your-secure-jwt-secret-replace-in-production
JWT_EXPIRATION=86400
```

These are loaded from a `.env` file in the `cymasphere_server` directory.

### Running the Application

To run the complete application:

1. Start the Deno server:

   ```bash
   cd cymasphere_server
   deno task dev
   ```

2. Start the React frontend:
   ```bash
   npm start
   ```

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:8000.

## Next.js Implementation

This project now includes a Next.js implementation for enhanced performance and SEO. To use the Next.js version:

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Key Features of Next.js Implementation:

- **Server-Side Rendering (SSR)**: Pre-renders pages for better performance and SEO
- **API Routes**: Built-in API functionality (see `/pages/api`)
- **Optimized Routing**: File-based routing system
- **CSS Modules**: Component-scoped styling
- **Image Optimization**: Automatic image optimization

### Getting Started with Next.js

For comprehensive documentation on Next.js features, check [NEXT_README.md](./README_NEXT.md)

For the original React implementation, use:

```bash
npm run react-start
```
