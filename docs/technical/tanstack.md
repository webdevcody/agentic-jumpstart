## Tanstack Start / Tanstack Router

### How to use search params on a route file

```typescript
// /routes/posts.tsx
export const Route = createFileRoute("/posts")({
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: ({ deps: { offset, limit } }) =>
    fetchPosts({
      offset,
      limit,
    }),
});
```
