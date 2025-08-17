import { Link } from "@tanstack/react-router";
import { DISCORD_INVITE_LINK } from "~/config";
import { useFirstSegment } from "~/hooks/use-first-segment";

export function FooterSection() {
  const firstSegment = useFirstSegment();

  return (
    <footer className="relative py-12 px-6 bg-muted/50 dark:bg-background">
      <div className="section-divider-glow-top"></div>
      <div className="max-w-4xl mx-auto text-muted-foreground">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">Learn</h3>
            <ul className="space-y-2">
              <li>
                {firstSegment.data && (
                  <Link
                    to="/learn/$slug"
                    params={{ slug: firstSegment.data.slug }}
                    className="hover:text-foreground transition-colors"
                  >
                    Get Started
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Purchase</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/purchase"
                  className="hover:text-foreground transition-colors"
                >
                  Buy Now
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms-of-service"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:webdevcody@gmail.com"
                  className="hover:text-foreground transition-colors"
                >
                  webdevcody@gmail.com
                </a>
              </li>
              <li>
                <a
                  href={DISCORD_INVITE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-border">
          <p>© 2025 Seibert Software Solutions, LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
