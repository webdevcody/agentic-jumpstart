import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Home, LogOut, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "~/hooks/use-auth";
import { useProfile } from "~/hooks/use-profile";
import { ModeToggle } from "~/components/ModeToggle";

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const user = useAuth();
  const { data: profile } = useProfile();

  if (!user) {
    return (
      <div className={className}>
        <div className="p-4 border-t space-y-3">
          <a href="/api/login/google">
            <Button className="w-full">
              <User className="mr-2 h-4 w-4" />
              Login
            </Button>
          </a>
          <div className="flex justify-center">
            <ModeToggle />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="p-4 border-t space-y-3">
        {/* Navigation */}
        <div className="flex flex-col gap-2">
          <Link to="/">
            <Button
              variant="outline"
              className="text-center w-full justify-center"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <a href="/api/logout" className="flex-1">
              <Button>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </a>
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
