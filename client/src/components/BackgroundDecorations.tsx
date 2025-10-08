import { BookOpen, Dna, Microscope, Star, FlaskConical, Stethoscope } from "lucide-react";

export function BackgroundDecorations() {
  const decorations = [
    { Icon: BookOpen, className: "top-20 left-10 w-16 h-16 animate-float", delay: "0s" },
    { Icon: Dna, className: "top-40 right-20 w-20 h-20 animate-float-slow", delay: "1s" },
    { Icon: Microscope, className: "bottom-32 left-32 w-16 h-16 animate-float", delay: "2s" },
    { Icon: Star, className: "top-60 right-40 w-12 h-12 animate-float-slow", delay: "0.5s" },
    { Icon: FlaskConical, className: "bottom-20 right-24 w-16 h-16 animate-float", delay: "1.5s" },
    { Icon: Stethoscope, className: "top-32 left-1/3 w-14 h-14 animate-float-slow", delay: "2.5s" },
    { Icon: BookOpen, className: "bottom-40 right-1/4 w-12 h-12 animate-float", delay: "3s", rotation: "rotate-12" },
    { Icon: Star, className: "top-1/4 right-1/3 w-10 h-10 animate-float-slow", delay: "0.8s" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" data-testid="background-decorations">
      {decorations.map((decoration, index) => {
        const Icon = decoration.Icon;
        return (
          <div
            key={index}
            className={`absolute ${decoration.className} ${decoration.rotation || ''} opacity-[0.08] text-primary`}
            style={{ 
              animationDelay: decoration.delay,
            }}
            data-testid={`decoration-icon-${index}`}
          >
            <Icon className="w-full h-full" />
          </div>
        );
      })}
    </div>
  );
}
