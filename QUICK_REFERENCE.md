# Quick Reference Guide - Enhanced Modules

## 🚀 Quick Start

### Run Frontend:
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

---

## 📋 Component Usage

### 1. Patient Registration Form

```tsx
import { PatientRegistrationForm } from '@/features/patients/components/PatientRegistrationForm';

// Create new patient
<PatientRegistrationForm
  onSubmit={(data) => {
    console.log('Patient data:', data);
    // Call API to create patient
  }}
  onCancel={() => setShowForm(false)}
/>

// Edit existing patient
<PatientRegistrationForm
  patientId="patient-uuid-here"
  onSubmit={(data) => {
    // Call API to update patient
  }}
  onCancel={() => setShowForm(false)}
/>
```

**Form Data Structure:**
```typescript
{
  // Personal Info
  patientPrefix: string,
  firstName: string,
  middleName: string,
  lastName: string,
  gender: 'Male' | 'Female' | 'Other',
  dateOfBirth: string,
  bloodGroup: string,
  
  // Contact
  mobileNumber: string,
  email: string,
  country: string,
  state: string,
  city: string,
  pincode: string,
  
  // Emergency
  emergencyContactName: string,
  emergencyContactMobile: string,
  
  // Insurance
  insuranceCompany: string,
  policyNumber: string,
  
  // ... more fields
}
```

---

### 2. Appointment Booking Modal

```tsx
import { BookAppointmentModalEnhanced } from '@/features/appointments/components/BookAppointmentModalEnhanced';

// Basic usage
<BookAppointmentModalEnhanced
  onClose={() => setShowModal(false)}
/>

// Pre-select patient
<BookAppointmentModalEnhanced
  onClose={() => setShowModal(false)}
  patientId="patient-uuid"
/>

// Edit appointment
<BookAppointmentModalEnhanced
  onClose={() => setShowModal(false)}
  appointmentId="appointment-uuid"
/>
```

**Booking Data Structure:**
```typescript
{
  patientId: string,
  doctorId: string,
  appointmentDate: string,
  startTime: string,
  endTime: string,
  appointmentType: 'Consultation' | 'FollowUp' | 'Emergency' | 'Procedure',
  reason: string,
  notes: string,
  priority: 'Normal' | 'Urgent' | 'Emergency',
  visitType: 'First Visit' | 'Follow Up' | 'Review'
}
```

---

### 3. Invoice Creation Form

```tsx
import { CreateInvoiceFormEnhanced } from '@/features/billing/components/CreateInvoiceFormEnhanced';

// Basic usage
<CreateInvoiceFormEnhanced
  onClose={() => setShowForm(false)}
  onSubmit={(data) => {
    console.log('Invoice data:', data);
    // Call API to create invoice
  }}
/>

// Pre-select patient
<CreateInvoiceFormEnhanced
  onClose={() => setShowForm(false)}
  onSubmit={(data) => createInvoice(data)}
  patientId="patient-uuid"
/>
```

**Invoice Data Structure:**
```typescript
{
  patientId: string,
  invoiceDate: string,
  dueDate: string,
  paymentMode: 'Cash' | 'Card' | 'UPI' | 'NetBanking' | 'Cheque' | 'Insurance',
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid',
  notes: string,
  items: [
    {
      serviceId: string,
      serviceName: string,
      description: string,
      quantity: number,
      unitPrice: number,
      discount: number,
      discountType: 'Percentage' | 'Amount',
      taxRate: number,
      amount: number
    }
  ],
  subtotal: number,
  totalDiscount: number,
  totalTax: number,
  grandTotal: number
}
```

---

## 🎨 UI Components

### Tabs Component

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  
  <TabsContent value="tab1">
    Content for tab 1
  </TabsContent>
  
  <TabsContent value="tab2">
    Content for tab 2
  </TabsContent>
</Tabs>
```

---

## 🔧 Common Patterns

### Form Validation with react-hook-form

```tsx
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm();

// Required field
<Input {...register('firstName', { required: true })} />
{errors.firstName && <span className="text-red-500">Required</span>}

// Pattern validation
<Input {...register('mobile', { 
  required: true, 
  pattern: /^[0-9]{10}$/ 
})} />
{errors.mobile && <span className="text-red-500">10 digits required</span>}

// Email validation
<Input type="email" {...register('email', { 
  required: true,
  pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
})} />
```

### Dynamic Form Arrays

```tsx
import { useFieldArray } from 'react-hook-form';

const { fields, append, remove } = useFieldArray({
  control,
  name: 'items'
});

// Add item
<Button onClick={() => append({ name: '', price: 0 })}>
  Add Item
</Button>

// Render items
{fields.map((field, index) => (
  <div key={field.id}>
    <Input {...register(`items.${index}.name`)} />
    <Input {...register(`items.${index}.price`)} />
    <Button onClick={() => remove(index)}>Remove</Button>
  </div>
))}
```

### API Calls with React Query

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['patients'],
  queryFn: () => patientService.getPatients()
});

// Create/Update
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: patientService.createPatient,
  onSuccess: () => {
    toast.success('Patient created');
    queryClient.invalidateQueries({ queryKey: ['patients'] });
  },
  onError: (error) => {
    toast.error('Failed to create patient');
  }
});

// Submit
mutation.mutate(formData);
```

---

## 🎯 Styling Patterns

### Status Badges

```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800';
    case 'Inactive': return 'bg-gray-100 text-gray-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

<span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
  {status}
</span>
```

### Currency Formatting

```tsx
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

<span>{formatCurrency(1500)}</span> // ₹1,500.00
```

### Date Formatting

```tsx
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

<span>{formatDate('2024-03-15')}</span> // 15 Mar 2024
```

---

## 🐛 Common Issues & Solutions

### Issue: Form not submitting
**Solution:** Check if all required fields are filled and validation passes
```tsx
const onSubmit = (data) => {
  console.log('Form data:', data); // Debug
  // Check for errors
};
```

### Issue: API calls failing
**Solution:** Verify headers and authentication
```tsx
headers: {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'X-Tenant-Id': localStorage.getItem('tenantId') || '',
  'X-User-Id': localStorage.getItem('userId') || '',
}
```

### Issue: State not updating
**Solution:** Use proper state setters
```tsx
// Wrong
formData.name = 'John';

// Correct
setFormData({ ...formData, name: 'John' });
```

### Issue: Calculations not working
**Solution:** Use useEffect to watch dependencies
```tsx
useEffect(() => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  setGrandTotal(total);
}, [items]); // Recalculate when items change
```

---

## 📱 Responsive Design

### Grid Layouts
```tsx
// 1 column on mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Content */}
</div>
```

### Hide on Mobile
```tsx
<div className="hidden md:block">
  Desktop only content
</div>
```

### Stack on Mobile
```tsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Stacks vertically on mobile, horizontal on desktop */}
</div>
```

---

## 🔐 Authentication

### Check if user is logged in
```tsx
const isAuthenticated = !!localStorage.getItem('accessToken');

if (!isAuthenticated) {
  navigate('/login');
}
```

### Get current user info
```tsx
const userId = localStorage.getItem('userId');
const tenantId = localStorage.getItem('tenantId');
const role = localStorage.getItem('role');
```

---

## 📊 Testing Checklist

- [ ] All required fields show validation errors
- [ ] Optional fields work without errors
- [ ] Form submits successfully
- [ ] Loading states display correctly
- [ ] Success/error toasts appear
- [ ] Data refreshes after create/update
- [ ] Modal closes after submission
- [ ] Responsive on mobile/tablet/desktop
- [ ] Icons and images load properly
- [ ] Calculations are accurate

---

## 🎓 Best Practices

1. **Always validate user input**
2. **Show loading states during API calls**
3. **Display user-friendly error messages**
4. **Use TypeScript for type safety**
5. **Keep components small and focused**
6. **Extract reusable logic into hooks**
7. **Use React Query for server state**
8. **Implement proper error boundaries**
9. **Test on different screen sizes**
10. **Follow consistent naming conventions**

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the main documentation (ENHANCED_MODULES_SUMMARY.md)
3. Check console for errors
4. Verify API endpoints are running
5. Test with sample data

---

**Last Updated:** March 2026  
**Version:** 1.0.0
