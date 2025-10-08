import { Link, useLocation } from "wouter";
import { Brain, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnlineStatus } from "./OnlineStatus";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <a className="flex items-center gap-3 hover-elevate active-elevate-2 px-3 py-2 rounded-lg transition-all" data-testid="link-home">
              <Brain className="w-8 h-8 text-primary" data-testid="icon-logo" />
              <h1 className="text-2xl font-bold text-foreground">KORA</h1>
            </a>
          </Link>

          <div className="flex items-center gap-4">
            <OnlineStatus />
            
            <Link href="/downloads">
              <a data-testid="link-downloads">
                <Button 
                  variant={location === '/downloads' ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Downloads
                </Button>
              </a>
            </Link>

            <Link href="/settings">
              <a data-testid="link-settings">
                <Button 
                  variant="ghost"
                  size="icon"
                >
                  <Settings className="w-5 h-5" data-testid="icon-settings" />
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
