# 🎯 MASTER PROMPT FOR PROJECT ANALYSIS

Use this single prompt to analyze your Digital Hospital project anytime:

---

## 📋 THE MASTER PROMPT

```
Analyze my Digital Hospital project completely:

1. Check all backend services in src/ folder
2. Check all frontend pages in frontend/src/features/ folder
3. Identify what's implemented vs what's missing
4. Compare backend APIs with frontend pages
5. List missing features in both backend and frontend
6. Prioritize what needs to be built next
7. Give me implementation order

Focus on:
- Services that exist but have missing features
- Frontend pages that exist but are not routed
- Backend APIs that exist but have no frontend
- Critical enterprise features that are missing
- Build errors or database issues

Provide:
- Current completion percentage
- What's working vs what's broken
- Priority order for implementation
- Estimated time for each feature
```

---

## 🔍 SPECIFIC ANALYSIS PROMPTS

### Backend Analysis
```
Analyze all backend services in src/ folder:
1. List all services and their completion status
2. Check for build errors
3. Check database scripts
4. Identify missing APIs
5. Check if controllers have all CRUD operations
6. Verify repository implementations
```

### Frontend Analysis
```
Analyze frontend application:
1. List all pages in features/ folder
2. Check which pages are routed in App.tsx
3. Identify pages that exist but are not routed
4. Check which backend APIs have no frontend
5. List missing UI components
6. Check navigation menu completeness
```

### Feature Gap Analysis
```
Compare backend and frontend for feature gaps:
1. List backend APIs that have no frontend UI
2. List frontend pages that have no backend API
3. Identify incomplete workflows
4. Find missing integrations
5. Prioritize what to build next
```

### Database Analysis
```
Analyze database schemas:
1. Check all SQL scripts in each service
2. Identify missing tables
3. Check for schema errors
4. Verify indexes and constraints
5. List missing migrations
```

---

## 🚀 IMPLEMENTATION PROMPTS

### Quick Fix Prompt
```
Fix these immediate issues in Digital Hospital:
1. Add AR Aging Report route to App.tsx (page exists but not routed)
2. Fix PharmacyService database schema error
3. Fix build errors in EncounterService, InsuranceService, AnalyticsService
4. Verify all services can start successfully
```

### Feature Implementation Prompt
```
Implement [FEATURE_NAME] in Digital Hospital:

Backend:
- Database schema changes needed
- Repository methods required
- Service layer implementation
- Controller endpoints
- DTOs and models

Frontend:
- Pages needed
- Components required
- Service methods
- Routes to add
- Navigation updates

Provide complete implementation with code.
```

### Testing Prompt
```
Create comprehensive tests for [SERVICE_NAME]:
1. Unit tests for repositories
2. Unit tests for services
3. Integration tests for controllers
4. End-to-end workflow tests
5. Test data setup
```

---

## 📊 STATUS CHECK PROMPTS

### Quick Status Check
```
Give me a quick status of Digital Hospital project:
- How many services are working?
- How many have build errors?
- What's the overall completion percentage?
- What are the top 3 priorities?
```

### Detailed Status Report
```
Generate detailed status report for Digital Hospital:
1. Service-by-service completion status
2. Frontend page completion status
3. Missing critical features
4. Build errors and issues
5. Database migration status
6. Priority implementation order
7. Estimated time to production ready
```

### Enterprise Readiness Check
```
Evaluate Digital Hospital for enterprise readiness:
1. Security features status
2. RBAC implementation completeness
3. Audit logging coverage
4. Multi-tenancy implementation
5. Performance considerations
6. Scalability readiness
7. Missing enterprise features
```

---

## 🛠️ TROUBLESHOOTING PROMPTS

### Build Error Fix
```
Fix build errors in [SERVICE_NAME]:
1. Identify all compilation errors
2. Check missing using statements
3. Verify dependency injection
4. Check repository implementations
5. Verify DTO definitions
6. Provide fixes for all errors
```

### Database Error Fix
```
Fix database error in [SERVICE_NAME]:
Error: [ERROR_MESSAGE]
1. Identify the root cause
2. Check SQL script syntax
3. Verify table definitions
4. Check index definitions
5. Provide corrected SQL script
```

### Integration Issue Fix
```
Fix integration between [SERVICE_A] and [SERVICE_B]:
1. Check service client implementation
2. Verify API endpoints
3. Check request/response DTOs
4. Verify authentication headers
5. Test end-to-end flow
```

---

## 📚 DOCUMENTATION PROMPTS

### API Documentation
```
Generate API documentation for [SERVICE_NAME]:
1. List all endpoints
2. Request/response examples
3. Authentication requirements
4. Error responses
5. Usage examples
```

### Setup Documentation
```
Create setup guide for Digital Hospital:
1. Prerequisites
2. Database setup steps
3. Service startup order
4. Configuration required
5. Testing instructions
6. Troubleshooting common issues
```

### Architecture Documentation
```
Document Digital Hospital architecture:
1. Microservices overview
2. Database design
3. Event-driven architecture
4. Authentication flow
5. Multi-tenancy implementation
6. Technology stack
```

---

## 🎯 WORKFLOW PROMPTS

### Complete Feature Workflow
```
Implement complete [FEATURE_NAME] workflow:

Example: "Implement complete refund approval workflow"

This should include:
1. Database schema (if needed)
2. Backend repositories
3. Backend services
4. Backend controllers
5. Frontend pages
6. Frontend components
7. Frontend services
8. Routes and navigation
9. Testing steps
10. Documentation

Provide step-by-step implementation.
```

### End-to-End Testing
```
Create end-to-end test for [WORKFLOW_NAME]:

Example: "Create end-to-end test for patient registration to appointment booking"

Include:
1. Test scenario description
2. Prerequisites
3. Step-by-step test steps
4. Expected results
5. API calls to make
6. UI interactions
7. Verification points
```

---

## 💡 BEST PRACTICES

### When to Use Master Prompt
- ✅ Starting a new work session
- ✅ After making significant changes
- ✅ When you're unsure what to work on next
- ✅ Before planning your week
- ✅ When showing project to stakeholders

### When to Use Specific Prompts
- ✅ When you know exactly what feature to implement
- ✅ When fixing specific errors
- ✅ When creating documentation
- ✅ When testing specific workflows

### Prompt Tips
1. **Be specific:** Mention exact service/feature names
2. **Provide context:** Include error messages or file paths
3. **Set expectations:** Specify if you want code, documentation, or analysis
4. **Iterate:** Start with analysis, then implementation, then testing
5. **Save outputs:** Keep generated documentation for reference

---

## 📝 EXAMPLE USAGE

### Scenario 1: Starting Your Day
```
Prompt: "Give me quick status of Digital Hospital and top 3 priorities for today"

Expected Output:
- Current status summary
- Top 3 actionable tasks
- Estimated time for each
```

### Scenario 2: Implementing New Feature
```
Prompt: "Implement refund approval workflow in Digital Hospital. 
Database schema exists (4.00.sql). Need backend APIs and frontend UI."

Expected Output:
- Complete backend implementation
- Complete frontend implementation
- Testing steps
```

### Scenario 3: Fixing Errors
```
Prompt: "Fix build errors in EncounterService. 
Check for missing implementations and incorrect PagedResult usage."

Expected Output:
- List of all errors
- Root cause analysis
- Fixed code
```

### Scenario 4: Weekly Planning
```
Prompt: "Analyze Digital Hospital and create 1-week implementation plan 
focusing on high-priority enterprise features."

Expected Output:
- Day-by-day task breakdown
- Estimated hours per task
- Dependencies and blockers
```

---

## 🎯 QUICK REFERENCE

**Most Used Prompts:**

1. **Project Analysis:** Use Master Prompt
2. **Feature Implementation:** Use Feature Implementation Prompt
3. **Bug Fixing:** Use Build Error Fix or Database Error Fix
4. **Status Check:** Use Quick Status Check
5. **Planning:** Use Detailed Status Report

**Remember:**
- Always analyze before implementing
- Test after each feature
- Document as you go
- Commit frequently

---

**Created by:** Amazon Q Developer  
**Last Updated:** March 4, 2025  
**Version:** 1.0
