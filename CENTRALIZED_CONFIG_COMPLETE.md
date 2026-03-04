# ✅ Centralized Configuration - Complete

## 🎯 Problem Solved
**Before:** Hardcoded URLs in each service file  
**After:** Single `.env` file for all service URLs

## 📝 Configuration File

### `.env` (Single Source of Truth)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_IDENTITY_SERVICE_URL=http://localhost:5001
VITE_PATIENT_SERVICE_URL=http://localhost:5003
VITE_APPOINTMENT_SERVICE_URL=http://localhost:5004
VITE_BILLING_SERVICE_URL=http://localhost:5010
VITE_PHARMACY_SERVICE_URL=http://localhost:5006
VITE_LABORATORY_SERVICE_URL=http://localhost:5007
VITE_DOCTOR_SERVICE_URL=http://localhost:5008
VITE_EMR_SERVICE_URL=http://localhost:5012
```

## 🔧 Updated Services

### 1. doctorService.ts
```typescript
const DOCTOR_SERVICE = import.meta.env.VITE_DOCTOR_SERVICE_URL;
// Uses: api instance (auto headers)
```

### 2. appointmentService.ts
```typescript
const APPOINTMENT_SERVICE = import.meta.env.VITE_APPOINTMENT_SERVICE_URL;
// Uses: api instance (auto headers)
```

### 3. billingService.ts
```typescript
const BILLING_SERVICE = import.meta.env.VITE_BILLING_SERVICE_URL;
// Uses: api instance (auto headers)
```

### 4. billingReportsService.ts
```typescript
const BILLING_SERVICE = import.meta.env.VITE_BILLING_SERVICE_URL;
// Uses: api instance (auto headers)
```

## ✅ Benefits

### 1. Single Point of Change
```
Change port? → Edit .env only
Deploy to prod? → Change .env only
Add new service? → Add to .env only
```

### 2. Environment-Specific
```
.env.development → Local URLs
.env.staging → Staging URLs
.env.production → Production URLs
```

### 3. No Code Changes
```
Port change: Edit .env → Restart frontend → Done!
No need to touch service files
```

### 4. Consistent Pattern
```typescript
// All services follow same pattern:
const SERVICE_URL = import.meta.env.VITE_SERVICE_NAME_URL;
const response = await api.get(`${SERVICE_URL}/api/...`);
```

## 🚀 How to Change URLs

### Development (Local)
```bash
# Edit .env
VITE_BILLING_SERVICE_URL=http://localhost:5010

# Restart frontend
npm run dev
```

### Production
```bash
# Edit .env.production
VITE_BILLING_SERVICE_URL=https://api.hospital.com/billing

# Build
npm run build
```

### Docker
```dockerfile
# Pass as environment variables
ENV VITE_BILLING_SERVICE_URL=http://billing-service:5010
```

## 📊 Service Port Mapping

| Service | Port | Env Variable |
|---------|------|--------------|
| Identity | 5001 | VITE_IDENTITY_SERVICE_URL |
| Patient | 5003 | VITE_PATIENT_SERVICE_URL |
| Appointment | 5004 | VITE_APPOINTMENT_SERVICE_URL |
| Billing | 5010 | VITE_BILLING_SERVICE_URL |
| Pharmacy | 5006 | VITE_PHARMACY_SERVICE_URL |
| Laboratory | 5007 | VITE_LABORATORY_SERVICE_URL |
| Doctor | 5008 | VITE_DOCTOR_SERVICE_URL |
| EMR | 5012 | VITE_EMR_SERVICE_URL |

## 🔐 API Instance Benefits

### Automatic Headers (from api.ts)
```typescript
// No need to manually add in each service:
- Authorization: Bearer token
- X-Tenant-Id
- X-User-Id
- X-Tenant-Code
```

### Automatic Error Handling
```typescript
// 401 → Auto logout
// Error messages → Auto toast
```

### Interceptors
```typescript
// Request interceptor → Add auth headers
// Response interceptor → Handle errors
```

## 📝 Migration Summary

### Files Updated: 4
1. ✅ `.env` - Added DOCTOR_SERVICE_URL, fixed ports
2. ✅ `doctorService.ts` - Use env + api instance
3. ✅ `appointmentService.ts` - Use env + api instance
4. ✅ `billingService.ts` - Use env + api instance
5. ✅ `billingReportsService.ts` - Use env + api instance

### Pattern Changed:
```typescript
// OLD (Bad)
const API_BASE_URL = 'http://localhost:5010/api/billing/v1';
const headers = { Authorization: ..., X-Tenant-Id: ... };
await axios.get(url, { headers });

// NEW (Good)
const BILLING_SERVICE = import.meta.env.VITE_BILLING_SERVICE_URL;
await api.get(`${BILLING_SERVICE}/api/billing/v1/...`);
```

## 🎯 Project Manager Perspective

### Scalability ✅
- Add 100 services → Just add to .env
- Change all URLs → Edit 1 file

### Maintainability ✅
- Clear configuration
- Easy to understand
- No scattered URLs

### Deployment ✅
- Different envs → Different .env files
- No code changes needed
- CI/CD friendly

### Team Collaboration ✅
- Everyone knows where URLs are
- No confusion
- Standard pattern

---

**Status:** ✅ COMPLETE  
**Pattern:** Centralized + Consistent  
**Maintainability:** Excellent  
**Scalability:** Production Ready

**Created:** March 4, 2025
