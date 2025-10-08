import { CheckCircle } from "lucide-react";

interface PulseAnimationProps {
  show: boolean;
}

export function PulseAnimation({ show }: PulseAnimationProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50" data-testid="pulse-animation">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse-ring" />
        <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        <CheckCircle className="w-16 h-16 text-green-600 relative z-10 animate-fade-in" data-testid="icon-complete" />
      </div>
    </div>
  );
}
