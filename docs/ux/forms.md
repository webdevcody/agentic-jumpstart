# Form Patterns Documentation

This document outlines the form implementation patterns used in the TechTube application, based on the sign-up form implementation.

## Core Dependencies

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
```

## Schema Definition Pattern

Forms use Zod for validation schemas with TypeScript inference:

```typescript
const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpForm = z.infer<typeof signUpSchema>;
```

## Form Setup Pattern

Forms are initialized with react-hook-form and Zod resolver:

```typescript
const form = useForm<SignUpForm>({
  resolver: zodResolver(signUpSchema),
  defaultValues: {
    name: "",
    email: "",
    password: "",
  },
});
```

## State Management Pattern

Forms manage loading, error states, and UI state:

```typescript
const [isLoading, setIsLoading] = useState(false);
const [authError, setAuthError] = useState("");
const [showPassword, setShowPassword] = useState(false); // For password fields
```

## Submit Handler Pattern

Async form submission with error handling:

```typescript
const onSubmit = async (data: SignUpForm) => {
  setIsLoading(true);
  setAuthError("");

  try {
    const result = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (result.error) {
      setAuthError(result.error.message || "Sign up failed");
    } else {
      router.navigate({ to: "/" });
    }
  } catch (err) {
    setAuthError("An unexpected error occurred");
  } finally {
    setIsLoading(false);
  }
};
```

## Form Structure Pattern

Forms use shadcn/ui Form components with controlled fields:

```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <div className="grid gap-4">
      {/* Error Display */}
      {authError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{authError}</p>
        </div>
      )}

      {/* Form Fields */}
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Submit Button */}
      <Button disabled={isLoading} type="submit">
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
        )}
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
    </div>
  </form>
</Form>
```

## Password Field Pattern

Password fields include show/hide toggle functionality:

```typescript
<FormField
  control={form.control}
  name="password"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Password</FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            placeholder="Create a password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            disabled={isLoading}
            className="pr-10"
            {...field}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Input Attributes Pattern

Standard input attributes for better UX:

```typescript
// Email field
type="email"
autoComplete="email"
autoCapitalize="none"
autoCorrect="off"

// Name field
type="text"
autoComplete="given-name"

// Password field
type={showPassword ? "text" : "password"}
autoComplete="new-password" // or "current-password" for login
```

## Error Display Pattern

Global form errors are displayed above the form:

```typescript
{authError && (
  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
    <p className="text-sm text-destructive">{authError}</p>
  </div>
)}
```

Field-level errors are automatically handled by `<FormMessage />` from the validation schema.

## Loading States Pattern

Buttons show loading indicators and disable during submission:

```typescript
<Button disabled={isLoading} type="submit">
  {isLoading && (
    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
  )}
  {isLoading ? "Creating account..." : "Create Account"}
</Button>
```

## Key Conventions

1. **Schema First**: Define Zod schema before form setup
2. **Type Safety**: Use `z.infer<typeof schema>` for form types
3. **Error Handling**: Separate API errors from validation errors
4. **Loading States**: Disable form during submission
5. **Accessibility**: Include proper ARIA labels and autocomplete attributes
6. **UX Enhancements**: Password visibility toggle, loading indicators
7. **Consistent Styling**: Use shadcn/ui components for consistent appearance
8. **Enabled Buttons** keep buttons clickable and show sonner toast on errors
