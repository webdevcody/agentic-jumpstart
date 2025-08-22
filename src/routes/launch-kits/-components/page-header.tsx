export function PageHeader() {
  return (
    <div className="bg-card/30 border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-theme-500 to-theme-600 bg-clip-text text-transparent">
            Launch Kits
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover pre-built starter templates to jumpstart your next
            project. Each kit comes with modern tools and best practices built
            right in.
          </p>
        </div>
      </div>
    </div>
  );
}