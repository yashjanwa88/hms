# 🧪 PATIENT MODULE - TESTING GUIDE
## Step-by-Step Testing Instructions

---

## 🚀 **STEP 1: START THE APPLICATION**

```bash
cd "d:\Digital Hospital Infrastructure Company\DigitalHospital\frontend"
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## 🔐 **STEP 2: LOGIN**

1. Open browser: `http://localhost:5173/`
2. Login with credentials
3. You should see Dashboard

---

## 📋 **STEP 3: NAVIGATE TO PATIENTS MODULE**

### **Main Patients Page**
- Click on **"Patients"** in sidebar/menu
- URL: `http://localhost:5173/patients`

**You should see:**
- ✅ "Patients" heading
- ✅ Three buttons: **Masters**, **Quick Register**, **New Patient**
- ✅ Patient Search bar
- ✅ Patient List table

---

## 🎯 **STEP 4: TEST EACH FEATURE**

### **A. PATIENT MASTERS** ⭐

**Click "Masters" button**
- URL: `http://localhost:5173/patients/masters`

**You will see 3 tabs:**

#### **Tab 1: Patient Prefix**
1. Click "Add Prefix" button
2. Fill form:
   - Code: `MR`
   - Display Name: `Mr`
   - Gender: `Male`
   - Sort Order: `1`
3. Click "Save"
4. ✅ Should show in table below

**Test:**
- ✅ Add multiple prefixes (Mrs, Ms, Dr, Master, Baby)
- ✅ Edit existing prefix
- ✅ Delete prefix
- ✅ Search functionality

#### **Tab 2: Patient Types**
1. Click "Patient Types" tab
2. Click "Add Patient Type"
3. Fill form:
   - Code: `GEN`
   - Name: `General`
   - Display Name: `General Patient`
   - Color: Pick blue color
   - Icon: Select icon
   - Discount: `0`
4. Click "Save"

**Test:**
- ✅ Add types (General, Senior Citizen, VIP, Staff)
- ✅ Color picker works
- ✅ Icon selection works
- ✅ Edit/Delete works

#### **Tab 3: Registration Types**
1. Click "Registration Types" tab
2. Click "Add Registration Type"
3. Fill **Basic Info** tab:
   - Code: `GEN`
   - Name: `General Registration`
   - Category: `GEENRALCATEGORY`
   - Color: Pick color
   - Validity Days: `365`
   - Registration Fee: `500`
   - Renewal Fee: `300`
4. Click **Features Config** tab:
   - Enable/Disable features
   - Set expand/required flags
5. Click **Fee Structure** tab:
   - Add fees for different patient types
6. Click "Save"

**Test:**
- ✅ All 3 tabs work
- ✅ Feature enable/disable works
- ✅ Fee structure adds/removes rows
- ✅ Save/Edit/Delete works

---

### **B. PATIENT REGISTRATION** ⭐⭐⭐

**Click "New Patient" button**
- URL: `http://localhost:5173/patients/register`

**You will see 8 tabs:**

#### **Tab 1: Personal**
1. Fill Registration Details:
   - Registration Type: Select
   - Registration Date: Today
   - Registration Time: Current time
   - Patient Type: Select
2. Fill Patient Details:
   - Prefix: `Mr`
   - First Name: `John`
   - Middle Name: `Michael`
   - Last Name: `Doe`
   - Gender: `Male`
   - Date of Birth: `1990-01-01`
   - Blood Group: `O+`
   - Marital Status: `Married`
3. Age auto-calculates ✅
4. Test Newborn checkbox:
   - Check "Newborn"
   - Guardian fields appear ✅

#### **Tab 2: Identification**
1. Click "Add Document"
2. Fill:
   - ID Type: `Aadhar Card`
   - ID Number: `1234-5678-9012`
   - Issue Date: Select date
   - Expiry Date: Select date
3. Click "Add Document" again for multiple IDs

**Test:**
- ✅ Add multiple documents
- ✅ Delete document works

#### **Tab 3: Contact**
1. Select Urban/Rural
2. Fill:
   - Mobile: `9876543210`
   - Email: `john@example.com`
   - WhatsApp: `9876543210`
3. If Urban:
   - House No, Street, Location
4. If Rural:
   - Village, Post Office
5. Fill:
   - Country, State, City, Pincode

**Test:**
- ✅ Urban/Rural toggle works
- ✅ Fields change based on selection

#### **Tab 4: Emergency**
1. Fill:
   - Contact Name: `Jane Doe`
   - Relationship: `Spouse`
   - Mobile: `9876543211`
   - Email: `jane@example.com`

#### **Tab 5: Referral**
1. Fill:
   - Referred By: `Dr. Smith`
   - Referred To: `Dr. Johnson`
   - Referring Date: Select date

#### **Tab 6: Biometric**
1. Upload Photo:
   - Click "Choose File"
   - Select image
   - Preview shows ✅
2. Upload Signature
3. Fingerprint capture (optional)

**Test:**
- ✅ Photo preview works
- ✅ File upload works

#### **Tab 7: Insurance**
1. Click "Add Insurance"
2. Fill:
   - Sponsor Type: `Insurance`
   - Policy No: `POL123456`
   - Policy Holder: `John Doe`
3. Add multiple insurance policies

**Test:**
- ✅ Add multiple policies
- ✅ Delete policy works

#### **Tab 8: Death**
1. Check "Mark as Deceased"
2. Fields appear:
   - Date of Death
   - Reason

**Test:**
- ✅ Checkbox toggle works
- ✅ Fields show/hide

#### **Final Step:**
1. Click "Register Patient" button
2. ✅ Success toast appears
3. ✅ Redirects to patients list
4. ✅ New patient appears in table

---

### **C. PATIENT LIST** ⭐⭐

**On Patients Page:**

#### **Quick Search**
1. Type in search bar: `John`
2. ✅ Results filter instantly

#### **Advanced Filters**
1. Click "Show Filters"
2. Fill any filter:
   - UHID
   - First Name
   - Mobile
   - Gender
   - Blood Group
   - Status
   - Age Range
   - City/State
   - Date Range
3. Click "Apply Filters"
4. ✅ Table updates

**Test:**
- ✅ Multiple filters work together
- ✅ Clear filters works
- ✅ Pagination works
- ✅ Per-page size changes

#### **Bulk Operations**
1. Select checkbox on multiple patients
2. ✅ Bulk action bar appears
3. Test:
   - Export Selected
   - Print Selected
   - Delete Selected

---

### **D. FILE MANAGER** ⭐⭐⭐

**Navigate to Patient Documents:**
1. Click on any patient UHID
2. Click "Documents" tab/button
- URL: `http://localhost:5173/patients/{id}/documents`

#### **Upload Documents**
1. Click "Upload Documents"
2. Fill form:
   - Category: `Medical`
   - Sub Category: `Blood Test`
   - Document Date: Select date
   - Description: `CBC Report`
   - Tags: `urgent, lab`
   - Check "Confidential" if needed
3. Select files (PDF, JPG, PNG)
4. Click "Upload"
5. ✅ Documents appear in grid

**Test:**
- ✅ Multiple file upload works
- ✅ Category filter works
- ✅ Search works
- ✅ Tags display

#### **View Documents**
1. Click "View" on any document
2. ✅ Full-screen viewer opens
3. For images:
   - ✅ Zoom in/out works (50%-200%)
4. For PDFs:
   - ✅ PDF displays inline
5. Click "Download"
6. ✅ File downloads

#### **Delete Documents**
1. Click delete icon
2. Confirm
3. ✅ Document removed

---

### **E. PATIENT INFO CARD** ⭐

**On Patient Profile Page:**
- URL: `http://localhost:5173/patients/{id}`

**You should see:**
- ✅ Patient photo/avatar
- ✅ UHID & Full name
- ✅ Status badge (color-coded)
- ✅ Age, Gender, Blood Group
- ✅ Contact info (Mobile, Email, Address)
- ✅ Medical summary:
  - Total visits
  - Allergies
  - Insurance status
- ✅ Outstanding amount (if any)
- ✅ Chronic conditions (highlighted)

---

### **F. PRINT PAGE** ⭐

**On Patient Profile:**
1. Click "Print Card" button
- URL: `http://localhost:5173/patients/{id}/print`

**You should see:**
- ✅ Professional registration card
- ✅ Hospital header
- ✅ Patient photo
- ✅ QR code placeholder
- ✅ All patient details
- ✅ Emergency contact section
- ✅ Barcode with UHID
- ✅ Valid till date

**Test:**
1. Click "Print" button
2. ✅ Print dialog opens
3. Click "Download PDF"
4. ✅ PDF downloads

---

## 🎨 **UI ELEMENTS TO CHECK**

### **Colors & Styling**
- ✅ Status badges are color-coded
- ✅ Buttons have hover effects
- ✅ Cards have shadows
- ✅ Tables are responsive
- ✅ Forms are well-spaced

### **Icons**
- ✅ All icons display correctly
- ✅ Icon colors match context

### **Responsive Design**
1. Resize browser window
2. ✅ Layout adjusts
3. ✅ Tables scroll horizontally
4. ✅ Forms stack on mobile

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue 1: Components not showing**
**Fix:**
```bash
# Check if all imports are correct
# Restart dev server
npm run dev
```

### **Issue 2: API errors**
**Fix:**
- Check backend is running
- Check API URLs in `.env`
- Check network tab in browser DevTools

### **Issue 3: Routing not working**
**Fix:**
- Check `App.tsx` has all routes
- Check URL in browser
- Clear browser cache

### **Issue 4: Styling issues**
**Fix:**
```bash
# Rebuild Tailwind
npm run build
```

---

## ✅ **TESTING CHECKLIST**

### **Master Data**
- [ ] Patient Prefix CRUD works
- [ ] Patient Types CRUD works
- [ ] Registration Types CRUD works
- [ ] Color picker works
- [ ] Icon selection works
- [ ] Search/Filter works

### **Patient Registration**
- [ ] All 8 tabs accessible
- [ ] Form validation works
- [ ] Age auto-calculation works
- [ ] Newborn toggle works
- [ ] Urban/Rural toggle works
- [ ] Photo upload works
- [ ] Multiple IDs can be added
- [ ] Multiple insurance can be added
- [ ] Save button works
- [ ] Cancel button works

### **Patient List**
- [ ] Table displays patients
- [ ] Quick search works
- [ ] Advanced filters work
- [ ] Pagination works
- [ ] Bulk selection works
- [ ] Status badges show
- [ ] Actions (View/Edit/Delete) work

### **File Manager**
- [ ] Upload form opens
- [ ] Multiple files upload
- [ ] Category filter works
- [ ] Search works
- [ ] View opens full-screen
- [ ] Zoom works (images)
- [ ] PDF displays inline
- [ ] Download works
- [ ] Delete works
- [ ] Tags display

### **Patient Info Card**
- [ ] Photo displays
- [ ] All details show
- [ ] Status badge correct color
- [ ] Medical summary shows
- [ ] Outstanding amount highlights
- [ ] Chronic conditions highlight

### **Print Page**
- [ ] Card displays correctly
- [ ] All details present
- [ ] Print button works
- [ ] Download PDF works
- [ ] Layout is professional

---

## 🎯 **TESTING FLOW (Complete Journey)**

1. **Login** → Dashboard
2. **Navigate** → Patients
3. **Click Masters** → Add Prefix, Types, Registration Types
4. **Click New Patient** → Fill all 8 tabs → Register
5. **Patient List** → See new patient
6. **Click UHID** → View patient profile
7. **Click Documents** → Upload files → View/Download
8. **Click Print** → Print registration card
9. **Back to List** → Test search/filters
10. **Test Bulk Operations** → Select multiple → Export/Delete

---

## 📊 **EXPECTED RESULTS**

After complete testing:
- ✅ All 15+ components working
- ✅ All 50+ features functional
- ✅ No console errors
- ✅ Smooth navigation
- ✅ Fast loading
- ✅ Responsive design
- ✅ Professional UI

---

## 🚀 **NEXT STEPS**

If all tests pass:
1. ✅ Patient Module is PRODUCTION READY
2. Move to Appointment Module
3. Move to Billing Module
4. Integration testing

---

## 📞 **SUPPORT**

If any issue:
1. Check browser console (F12)
2. Check network tab
3. Check backend logs
4. Restart dev server
5. Clear cache and reload

**Your Patient Module is World-Class! 🌍🏆**
