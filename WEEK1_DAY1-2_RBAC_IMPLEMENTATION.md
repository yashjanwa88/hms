# Week 1, Day 1-2: User & Role Management - RBAC Completion

## 📋 IMPLEMENTATION CHECKLIST

### Backend Implementation

#### 1. Permission Repository Extensions ✅
- [x] GetUserPermissionsAsync (EXISTS)
- [x] GetRolePermissionsAsync (EXISTS)
- [x] HasPermissionAsync (EXISTS)
- [ ] GetAllPermissionsAsync (NEW)
- [ ] GetPermissionByIdAsync (NEW)
- [ ] GetPermissionsByModuleAsync (NEW)
- [ ] CreatePermissionAsync (NEW)
- [ ] UpdatePermissionAsync (NEW)
- [ ] DeletePermissionAsync (NEW)
- [ ] AssignPermissionToRoleAsync (NEW)
- [ ] RemovePermissionFromRoleAsync (NEW)
- [ ] GetRolePermissionIdsAsync (NEW)

#### 2. Permission Service (NEW)
- [ ] Create IPermissionService interface
- [ ] Implement PermissionService with all CRUD operations
- [ ] Add caching for performance

#### 3. Permission Controller (NEW)
- [ ] GET /api/identity/v1/permissions - List all permissions
- [ ] GET /api/identity/v1/permissions/{id} - Get permission by ID
- [ ] GET /api/identity/v1/permissions/module/{module} - Get by module
- [ ] POST /api/identity/v1/permissions - Create permission
- [ ] PUT /api/identity/v1/permissions/{id} - Update permission
- [ ] DELETE /api/identity/v1/permissions/{id} - Delete permission
- [ ] GET /api/identity/v1/permissions/user/{userId} - Get user permissions
- [ ] GET /api/identity/v1/permissions/role/{roleId} - Get role permissions

#### 4. Role-Permission Management
- [ ] POST /api/identity/v1/roles/{roleId}/permissions - Assign permissions to role
- [ ] DELETE /api/identity/v1/roles/{roleId}/permissions/{permissionId} - Remove permission
- [ ] PUT /api/identity/v1/roles/{roleId}/permissions/bulk - Bulk update role permissions

#### 5. Token Revocation
- [ ] POST /api/identity/v1/auth/revoke-token - Revoke specific token
- [ ] POST /api/identity/v1/auth/revoke-all-tokens - Revoke all user tokens
- [ ] GET /api/identity/v1/auth/active-sessions - List active sessions

#### 6. Permission Middleware (NEW)
- [ ] Create RequirePermissionAttribute
- [ ] Implement permission checking middleware
- [ ] Add to all protected endpoints

### Frontend Implementation

#### 7. Permission Management Page
- [ ] Create PermissionsPage.tsx
- [ ] Permission list with search/filter
- [ ] Create/Edit permission modal
- [ ] Delete confirmation dialog
- [ ] Group by module

#### 8. Role-Permission Assignment
- [ ] Add permissions tab to UsersPage
- [ ] Create RolePermissionsModal.tsx
- [ ] Checkbox list of all permissions
- [ ] Show current role permissions
- [ ] Bulk assign/remove

#### 9. User Permission View
- [ ] Add permissions tab to user profile
- [ ] Display inherited permissions from role
- [ ] Show permission hierarchy

#### 10. Permission-Based UI Rendering
- [ ] Create usePermission hook
- [ ] Create PermissionGuard component
- [ ] Wrap all sensitive UI elements
- [ ] Hide/disable based on permissions

### Testing

#### 11. Backend Tests
- [ ] Test permission CRUD operations
- [ ] Test role-permission assignment
- [ ] Test permission inheritance
- [ ] Test permission revocation
- [ ] Test token revocation

#### 12. Frontend Tests
- [ ] Test permission management UI
- [ ] Test role-permission assignment
- [ ] Test permission-based rendering
- [ ] Test unauthorized access

---

## 🎯 API CONTRACTS

### Permission Endpoints

#### GET /api/identity/v1/permissions
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "patient.view",
      "name": "View Patients",
      "description": "View patient list and details",
      "module": "Patient",
      "createdAt": "2024-01-01T00:00:00Z",
      "isDeleted": false
    }
  ]
}
```

#### POST /api/identity/v1/permissions
**Request:**
```json
{
  "code": "doctor.manage",
  "name": "Manage Doctors",
  "description": "Full doctor management access",
  "module": "Doctor"
}
```

#### PUT /api/identity/v1/roles/{roleId}/permissions/bulk
**Request:**
```json
{
  "permissionIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Token Revocation Endpoints

#### POST /api/identity/v1/auth/revoke-token
**Request:**
```json
{
  "token": "refresh-token-string"
}
```

#### GET /api/identity/v1/auth/active-sessions
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "token": "abc...xyz",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastUsedAt": "2024-01-01T12:00:00Z",
      "expiresAt": "2024-01-08T00:00:00Z"
    }
  ]
}
```

---

## 📝 IMPLEMENTATION NOTES

### Security Considerations
1. **Permission Codes:** Use dot notation (module.action) for consistency
2. **Caching:** Cache user permissions for 5 minutes to reduce DB load
3. **Audit:** Log all permission changes (who, what, when)
4. **Token Revocation:** Mark as revoked, don't delete (audit trail)

### Performance Optimizations
1. **Batch Operations:** Bulk permission assignment in single transaction
2. **Index:** Add indexes on role_permissions(role_id, permission_id)
3. **Redis Cache:** Store user permissions in Redis

### Frontend UX
1. **Loading States:** Show skeleton while loading permissions
2. **Optimistic Updates:** Update UI immediately, rollback on error
3. **Confirmation:** Require confirmation for destructive actions
4. **Search:** Real-time search across permissions

---

## 🚀 IMPLEMENTATION ORDER

1. **Backend First** (Day 1 Morning)
   - Extend PermissionRepository
   - Create PermissionService
   - Create PermissionController
   - Update RoleController with permission management

2. **Token Revocation** (Day 1 Afternoon)
   - Extend RefreshTokenRepository
   - Add revocation endpoints to AuthController
   - Add active sessions endpoint

3. **Permission Middleware** (Day 1 Evening)
   - Create RequirePermissionAttribute
   - Add to critical endpoints
   - Test with different roles

4. **Frontend UI** (Day 2 Morning)
   - Create PermissionsPage
   - Create RolePermissionsModal
   - Update UsersPage with permissions tab

5. **Permission Guards** (Day 2 Afternoon)
   - Create usePermission hook
   - Create PermissionGuard component
   - Wrap sensitive UI elements

6. **Testing & Integration** (Day 2 Evening)
   - End-to-end testing
   - Fix bugs
   - Documentation

---

**Status:** Ready for Implementation  
**Start Date:** Week 1, Day 1  
**Estimated Completion:** Week 1, Day 2 Evening
