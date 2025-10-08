import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface ThemeToggleProps {
  isGlass: boolean;
  onToggle: (isGlass: boolean) => void;
}

export function ThemeToggle({ isGlass, onToggle }: ThemeToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card" data-testid="theme-toggle-container">
      <div className="flex items-center gap-3">
        <Sparkles className={`w-5 h-5 ${isGlass ? 'text-primary' : 'text-muted-foreground'}`} />
        <div>
          <Label htmlFor="theme-toggle" className="text-base font-medium cursor-pointer">
            Glassmorphism Theme
          </Label>
          <p className="text-sm text-muted-foreground">
            {isGlass ? 'Modern glass effect enabled' : 'Using default cream theme'}
          </p>
        </div>
      </div>
      <Switch
        id="theme-toggle"
        checked={isGlass}
        onCheckedChange={onToggle}
        data-testid="switch-theme"
      />
    </div>
  );
}
