# NEVER DO THESE THINGS

## Module Rules

1. dynamically fetching modules inside of functions, such as the following:

```typescript
// NEVER DO THIS
function doThing() {
  const module = await import("~/data-access/my-fun");
}
```

## Tanstack Rules

- Do not try to use middleware on a createFileRoute... for example, the following is incorrect code:

```typescript
export const Route = createFileRoute("/affiliate-dashboard")({
  middleware: [authenticatedMiddleware],
```

## Zod Validation

- do not do z.string().url, it's actually just z.url()
