import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";

interface FontSelectorProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
}

const fonts = [
  { value: 'sans', label: 'Inter', family: 'font-sans', description: 'Clean and professional' },
  { value: 'serif', label: 'Crimson Text', family: 'font-serif', description: 'Scholarly articles' },
  { value: 'display', label: 'Playfair Display', family: 'font-display', description: 'Elegant reading' },
  { value: 'script', label: 'Dancing Script', family: 'font-script', description: 'Creative and engaging' },
  { value: 'body', label: 'Lora', family: 'font-body', description: 'Balanced readability' },
  { value: 'elegant', label: 'Cormorant Garamond', family: 'font-elegant', description: 'Refined typography' },
  { value: 'reading', label: 'Merriweather', family: 'font-reading', description: 'Optimized for reading' },
];

export function FontSelector({ selectedFont, onFontChange }: FontSelectorProps) {
  return (
    <div className="space-y-4" data-testid="font-selector">
      <div>
        <Label className="text-base font-medium">Article Font</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your preferred reading font
        </p>
      </div>

      <RadioGroup value={selectedFont} onValueChange={onFontChange}>
        <div className="grid gap-3">
          {fonts.map((font) => (
            <Label
              key={font.value}
              htmlFor={`font-${font.value}`}
              className="cursor-pointer"
            >
              <Card className={`p-4 hover-elevate transition-all ${selectedFont === font.value ? 'border-primary border-2' : ''}`}>
                <div className="flex items-start gap-3">
                  <RadioGroupItem 
                    value={font.value} 
                    id={`font-${font.value}`}
                    data-testid={`radio-font-${font.value}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium mb-1 ${font.family}`}>
                      {font.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {font.description}
                    </p>
                    <p className={`text-sm mt-2 ${font.family}`}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </div>
              </Card>
            </Label>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
