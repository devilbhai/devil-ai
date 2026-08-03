---
name: form-patterns
description: Form handling patterns, validation with Zod, controlled components, reactive forms, and error display for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Form Patterns

Form handling patterns for the Devil AI codebase.

## When to Apply

- Creating new forms
- Implementing form validation
- Handling form submissions
- Displaying form errors
- Building reusable form components

---

## 1. Controlled Components

### Basic Controlled Input

```tsx
import { useState } from "react"

function TextInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
```

### Form State Object

```tsx
import { useState } from "react"

interface FormData {
  name: string
  email: string
  password: string
}

function SignupForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  })
  
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Name"
        value={formData.name}
        onChange={(value) => updateField("name", value)}
      />
      <TextInput
        label="Email"
        value={formData.email}
        onChange={(value) => updateField("email", value)}
      />
      <TextInput
        label="Password"
        type="password"
        value={formData.password}
        onChange={(value) => updateField("password", value)}
      />
    </form>
  )
}
```

---

## 2. Zod Validation

### Schema Definition

```typescript
import { z } from "zod"

// ✅ Reusable schemas
export const emailSchema = z.string().email("Invalid email address")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

// ✅ Form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
```

### Validation Hook

```typescript
import { useState, useCallback } from "react"
import { ZodSchema, ZodError } from "zod"

interface UseFormOptions<T> {
  schema: ZodSchema<T>
  initialValues: T
  onSubmit: (data: T) => Promise<void>
}

interface UseFormReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isDirty: boolean
  handleChange: (field: keyof T, value: unknown) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  reset: () => void
  setFieldError: (field: keyof T, error: string) => void
}

export function useForm<T extends Record<string, unknown>>({
  schema,
  initialValues,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const validate = useCallback(
    (data: T): boolean => {
      try {
        schema.parse(data)
        setErrors({})
        return true
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Partial<Record<keyof T, string>> = {}
          error.errors.forEach((err) => {
            const field = err.path[0] as keyof T
            if (field) {
              fieldErrors[field] = err.message
            }
          })
          setErrors(fieldErrors)
        }
        return false
      }
    },
    [schema]
  )

  const handleChange = useCallback(
    (field: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }))
      setIsDirty(true)
      
      // Clear error when user types
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!validate(values)) return
      
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } catch (error) {
        console.error("Form submission error:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setIsDirty(false)
  }, [initialValues])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    handleSubmit,
    reset,
    setFieldError,
  }
}
```

### Usage

```tsx
function LoginForm() {
  const form = useForm({
    schema: loginSchema,
    initialValues: { email: "", password: "" },
    onSubmit: async (data) => {
      await authApi.login(data)
    },
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <TextInput
        label="Email"
        value={form.values.email}
        onChange={(value) => form.handleChange("email", value)}
        error={form.errors.email}
      />
      <TextInput
        label="Password"
        type="password"
        value={form.values.password}
        onChange={(value) => form.handleChange("password", value)}
        error={form.errors.password}
      />
      <button
        type="submit"
        disabled={form.isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-lg"
      >
        {form.isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  )
}
```

---

## 3. React Hook Form Integration

### Setup

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

type FormData = z.infer<typeof schema>
```

### Usage

```tsx
function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await api.submitContact(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input {...register("name")} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>
      
      <div>
        <label>Email</label>
        <input {...register("email")} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  )
}
```

---

## 4. Form Components

### Reusable Input

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {hint && !error && <p className="text-gray-500 text-sm">{hint}</p>}
    </div>
  )
}
```

### Reusable Textarea

```tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function Textarea({
  label,
  error,
  hint,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {hint && !error && <p className="text-gray-500 text-sm">{hint}</p>}
    </div>
  )
}
```

### Reusable Select

```tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({
  label,
  error,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
```

### Checkbox

```tsx
interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}

export function Checkbox({
  label,
  checked,
  onChange,
  error,
}: CheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w4 text-blue-600 border-gray-300 rounded"
      />
      <label className="text-sm text-gray-700">{label}</label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
```

---

## 5. Form Layout

### Stacked Layout

```tsx
function StackedForm() {
  return (
    <form className="space-y-4">
      <Input label="Name" name="name" />
      <Input label="Email" name="email" type="email" />
      <Input label="Password" name="password" type="password" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2">
        Submit
      </button>
    </form>
  )
}
```

### Inline Layout

```tsx
function InlineForm() {
  return (
    <form className="flex gap-2">
      <Input label="" name="search" placeholder="Search..." className="flex-1" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2">
        Search
      </button>
    </form>
  )
}
```

### Horizontal Layout

```tsx
function HorizontalForm() {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" name="firstName" />
        <Input label="Last Name" name="lastName" />
      </div>
      <Input label="Email" name="email" type="email" />
      <div className="flex justify-end gap-2">
        <button type="button" className="px-4 py-2 border rounded-lg">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Save
        </button>
      </div>
    </form>
  )
}
```

---

## 6. Dynamic Forms

### Field Arrays

```tsx
import { useFieldArray } from "react-hook-form"

function DynamicFieldForm() {
  const { control, register } = useForm({
    defaultValues: {
      items: [{ name: "", quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 mb-2">
          <input {...register(`items.${index}.name`)} placeholder="Item name" />
          <input
            {...register(`items.${index}.quantity`)}
            type="number"
            placeholder="Qty"
          />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: "", quantity: 1 })}>
        Add Item
      </button>
    </form>
  )
}
```

### Conditional Fields

```tsx
function ConditionalForm() {
  const [accountType, setAccountType] = useState<"personal" | "business">("personal")

  return (
    <form className="space-y-4">
      <Select
        label="Account Type"
        value={accountType}
        onChange={(e) => setAccountType(e.target.value as "personal" | "business")}
        options={[
          { value: "personal", label: "Personal" },
          { value: "business", label: "Business" },
        ]}
      />
      
      <Input label="Name" name="name" />
      
      {accountType === "business" && (
        <>
          <Input label="Company" name="company" />
          <Input label="Tax ID" name="taxId" />
        </>
      )}
    </form>
  )
}
```

---

## 7. Form Submission

### Optimistic Updates

```tsx
function TodoForm() {
  const [todos, setTodos] = useState<Todo[]>([])
  
  const handleSubmit = async (data: FormData) => {
    const newTodo = {
      id: crypto.randomUUID(),
      ...data,
      completed: false,
    }
    
    // Optimistic update
    setTodos((prev) => [...prev, newTodo])
    
    try {
      await api.createTodo(data)
    } catch (error) {
      // Revert on error
      setTodos((prev) => prev.filter((t) => t.id !== newTodo.id))
    }
  }
}
```

### Form with Loading State

```tsx
function SubmitForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await api.submit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  )
}
```

---

## 8. Form Error Display

### Field-Level Errors

```tsx
function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-red-500 text-sm mt-1">{error}</p>
}

// Usage
<Input
  label="Email"
  value={email}
  onChange={setEmail}
  error={errors.email}
/>
```

### Form-Level Errors

```tsx
function FormErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
      <ul className="list-disc list-inside text-red-700 text-sm">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Success Messages

```tsx
function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
      {message}
    </div>
  )
}
```

---

## 9. Advanced Patterns

### Debounced Validation

```tsx
import { useCallback, useRef } from "react"

function DebouncedInput({
  value,
  onChange,
  delay = 300,
}: {
  value: string
  onChange: (value: string) => void
  delay?: number
}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleChange = useCallback(
    (newValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        onChange(newValue)
      }, delay)
    },
    [onChange, delay]
  )
  
  return <input value={value} onChange={(e) => handleChange(e.target.value)} />
}
```

### Multi-Step Forms

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({})
  
  const nextStep = () => setStep((s) => Math.min(s + 1, 3))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))
  
  return (
    <div>
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              s === step ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {s}
          </div>
        ))}
      </div>
      
      {step === 1 && <Step1 data={formData} onChange={setFormData} />}
      {step === 2 && <Step2 data={formData} onChange={setFormData} />}
      {step === 3 && <Step3 data={formData} />}
      
      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={step === 3 ? handleSubmit : nextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {step === 3 ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  )
}
```

---

## Best Practices

1. **Controlled components** — Use controlled inputs for full control
2. **Zod validation** — Validate at schema level, not in components
3. **Clear errors on input** — Remove field error when user starts typing
4. **Optimistic updates** — Update UI immediately, revert on error
5. **Loading states** — Disable submit button during submission
6. **Accessible forms** — Proper labels, aria attributes, focus management
7. **Mobile-friendly** — Large touch targets, proper input types
8. **Form reset** — Provide clear/reset functionality
9. **Debounced validation** — For expensive validation (email uniqueness, etc.)
10. **Multi-step forms** — For complex forms, break into steps
