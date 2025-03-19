# Cymasphere Deno Server

This is the Deno version of the Cymasphere server, converted from the original Node.js implementation.

## Prerequisites

- [Deno](https://deno.land/) v1.37.0 or higher
- MongoDB database (local or remote)
- Stripe account (for payment processing)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server configuration
PORT=8000
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=86400

# MongoDB configuration
DB_CONNECTION=mongodb://localhost:27017/cymasphere
DB_USER=
DB_PASS=

# Stripe configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# SMTP configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@localhost

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

For local development, you can use the default values. For production, you should update the values accordingly.

## Installation

1. Clone the repository
2. Set up environment variables in the `.env` file
3. Run the server

## Running the Server

### Development Mode

```bash
deno task dev
```

This will start the server in development mode with hot reloading.

### Production Mode

```bash
deno task start
```

## Local Development Setup

For local development, you can use the following tools:

### MongoDB

You can run MongoDB locally using Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### SMTP Server

For testing email functionality, you can use MailHog:

```bash
docker run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog
```

This will start a local SMTP server on port 1025 and a web interface on port 8025.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/logout` - Logout

### User

- `GET /api/user` - Get current user
- `PUT /api/user` - Update user
- `DELETE /api/user` - Delete user
- `GET /api/user/:id` - Get user by ID (admin only)

### Stripe

- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/create-billing-portal-session` - Create billing portal session
- `GET /api/stripe/subscription-status` - Get subscription status
- `POST /api/stripe/webhook` - Stripe webhook endpoint

## Project Structure

```
cymasphere_server/
├── .env
├── .env.example
├── deno.json
├── deno.jsonc
├── deno.lock
├── README.md
└── src/
    ├── middleware/
    │   └── authMiddleware.ts
    ├── models/
    │   └── user.ts
    ├── routes/
    │   ├── auth.ts
    │   ├── email.ts
    │   ├── log.ts
    │   ├── receipt.ts
    │   ├── share.ts
    │   ├── stripe.ts
    │   ├── tag.ts
    │   ├── user.ts
    │   └── vibe.ts
    ├── services/
    │   ├── authService.ts
    │   ├── emailService.ts
    │   ├── stripeService.ts
    │   └── userService.ts
    ├── utils/
    │   ├── db.ts
    │   └── formatters.ts
    └── server.ts
```

## Converting from Node.js to Deno

This server was converted from a Node.js implementation to Deno. The main differences include:

1. Using ES modules instead of CommonJS
2. Using Deno's standard library and third-party modules
3. Using Oak instead of Express
4. Using TypeScript by default
5. Using Deno's permissions system

## License

[MIT](LICENSE)
