import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { Button } from "~/components/ui/button";

export function FloatingFeedbackButton() {
  return (
    <Link to="/create-testimonial" className="fixed bottom-6 right-6 z-50">
      <Button size="lg">
        <MessageSquare className="w-5 h-5 mr-2" />
        Leave a Testimonial
      </Button>
    </Link>
  );
}
