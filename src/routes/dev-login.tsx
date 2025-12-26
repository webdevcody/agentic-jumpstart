import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { assertDevModeFn, devLoginFn } from "~/fn/dev";

export const Route = createFileRoute("/dev-login")({
  beforeLoad: () => assertDevModeFn(),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect_uri: (search.redirect_uri as string) || "/",
  }),
  component: DevLoginPage,
});

function DevLoginPage() {
  const { redirect_uri: redirectUri } = Route.useSearch();
  const [formData, setFormData] = useState({ email: "premium@localhost.test", name: "Premium User", isAdmin: false, isPremium: true });
  const [isLoading, setIsLoading] = useState(false);

  const updateUserType = (isAdmin: boolean, isPremium: boolean) => {
    let email = "user@localhost.test", name = "Basic User";
    if (isAdmin && isPremium) { email = "admin-premium@localhost.test"; name = "Admin Premium"; }
    else if (isAdmin) { email = "admin@localhost.test"; name = "Admin User"; }
    else if (isPremium) { email = "premium@localhost.test"; name = "Premium User"; }
    setFormData({ email, name, isAdmin, isPremium });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await devLoginFn({ data: formData });
      // Validate redirect is relative or same origin to prevent open redirect
      try {
        const url = new URL(redirectUri, window.location.origin);
        if (url.origin === window.location.origin) {
          window.location.href = url.pathname + url.search;
        } else {
          window.location.href = "/";
        }
      } catch {
        // If URL parsing fails, redirect to home
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Dev login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">DEV</span>
            Dev Login
          </CardTitle>
          <CardDescription>Bypass OAuth for local development.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="flex items-center space-x-4 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="isAdmin" checked={formData.isAdmin} onCheckedChange={(checked) => updateUserType(checked === true, formData.isPremium)} />
                <Label htmlFor="isAdmin" className="cursor-pointer">Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isPremium" checked={formData.isPremium} onCheckedChange={(checked) => updateUserType(formData.isAdmin, checked === true)} />
                <Label htmlFor="isPremium" className="cursor-pointer">Premium</Label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Logging in..." : "Login as Dev User"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
