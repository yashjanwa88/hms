# Digital Hospital Frontend

Production-ready React + TypeScript frontend for Digital Hospital SaaS platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **ShadCN UI** - Component library
- **React Router v6** - Routing
- **Redux Toolkit** - State management (auth)
- **React Query** - Server state management
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form validation
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

## Architecture

### Folder Structure

```
src/
├── assets/              # Static assets
├── components/
│   ├── ui/             # Reusable UI components (Button, Card, Input, etc.)
│   └── layout/         # Layout components (Sidebar, Header, Layout)
├── features/           # Feature-based modules
│   ├── auth/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   ├── dashboard/
│   ├── emr/
│   ├── laboratory/
│   ├── pharmacy/
│   ├── inventory/
│   └── billing/
├── hooks/              # Custom React hooks
├── lib/                # Utilities (api, utils)
├── pages/              # Page components
├── routes/             # Route configuration
├── store/              # Redux store
│   └── slices/         # Redux slices
├── types/              # TypeScript types
└── utils/              # Helper functions
```

### Key Features

✅ **Authentication**
- JWT-based authentication
- Token storage in localStorage
- Automatic token refresh
- Role-based access control

✅ **Routing**
- Protected routes
- Lazy loading
- Role-based redirection

✅ **State Management**
- Redux Toolkit for auth state
- React Query for server state
- Optimistic updates

✅ **UI/UX**
- Responsive design (desktop-first)
- Dark/light mode toggle
- Toast notifications
- Loading states
- Error handling

✅ **Data Tables**
- Sorting
- Filtering
- Pagination
- Search

✅ **Forms**
- React Hook Form
- Zod validation
- Error messages

## Modules

### 1. Authentication
- Login page
- JWT token management
- Role-based redirection

### 2. Dashboard
- Revenue summary
- Active encounters count
- Pending lab orders
- Low stock alerts
- Weekly revenue chart

### 3. EMR (Electronic Medical Records)
- Create encounter
- View encounter details
- Add vitals (auto BMI calculation)
- Add diagnosis (ICD-10)
- Add clinical notes (SOAP format)
- Close encounter

### 4. Laboratory
- Lab order list
- Enter test results
- View lab reports

### 5. Pharmacy
- Medicine inventory
- Low stock alerts
- Dispense medicines

### 6. Billing
- Invoice list
- Payment entry
- Invoice status tracking

### 7. Inventory
- Stock management (placeholder)

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_IDENTITY_SERVICE_URL=http://localhost:5001
VITE_PATIENT_SERVICE_URL=http://localhost:5003
VITE_APPOINTMENT_SERVICE_URL=http://localhost:5004
VITE_BILLING_SERVICE_URL=http://localhost:5010
VITE_PHARMACY_SERVICE_URL=http://localhost:5006
VITE_LABORATORY_SERVICE_URL=http://localhost:5007
VITE_EMR_SERVICE_URL=http://localhost:5008
```

### Development

```bash
npm run dev
```

Access at: http://localhost:3000

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Docker

### Build Image

```bash
docker build -t digital-hospital-frontend .
```

### Run Container

```bash
docker run -p 80:80 digital-hospital-frontend
```

## API Integration

### Axios Interceptors

- Automatically adds JWT token to requests
- Adds tenant headers (X-Tenant-Id, X-User-Id, X-Tenant-Code)
- Global error handling
- Automatic redirect on 401

### Example API Call

```typescript
import api from '@/lib/api';

const response = await api.get('/api/emr/encounters');
```

## Components

### Reusable UI Components

- **Button** - Multiple variants (default, destructive, outline, etc.)
- **Card** - Container with header and content
- **Input** - Form input with validation
- **Label** - Form label
- **DataTable** - Table with sorting, filtering, pagination

### Layout Components

- **Sidebar** - Navigation sidebar
- **Header** - Top header with user profile and theme toggle
- **Layout** - Main layout wrapper

## State Management

### Redux (Auth State)

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, logout } from '@/store/slices/authSlice';

// Login
dispatch(setCredentials({ user, accessToken, refreshToken }));

// Logout
dispatch(logout());

// Access state
const { isAuthenticated, user } = useSelector((state) => state.auth);
```

### React Query (Server State)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['encounters'],
  queryFn: () => emrService.getEncounters(),
});

// Mutate data
const mutation = useMutation({
  mutationFn: emrService.createEncounter,
  onSuccess: () => {
    queryClient.invalidateQueries(['encounters']);
  },
});
```

## Routing

### Protected Routes

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={['Doctor', 'Admin']}>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

## Forms

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## Styling

### TailwindCSS

Utility-first CSS framework with custom theme configuration.

### Dark Mode

Toggle between light and dark themes using the header button.

## Performance

- Code splitting with React.lazy
- Lazy-loaded routes
- Optimized bundle size
- React Query caching
- Memoization where needed

## Security

- JWT authentication
- Protected routes
- Role-based access control
- XSS protection
- CSRF protection

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Deployment

### Docker

```bash
docker build -t digital-hospital-frontend .
docker run -p 80:80 digital-hospital-frontend
```

### Nginx

The production build uses Nginx for serving static files and SPA routing.

## Contributing

1. Follow the established folder structure
2. Use TypeScript for type safety
3. Follow component naming conventions
4. Write reusable components
5. Use React Query for server state
6. Use Redux only for auth state

## License

Proprietary - All Rights Reserved

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
