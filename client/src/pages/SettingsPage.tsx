import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FontSelector } from "@/components/FontSelector";
import { BackgroundDecorations } from "@/components/BackgroundDecorations";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePreferences, useUpdatePreferences } from "@/hooks/usePreferences";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  
  const [theme, setTheme] = useState<'default' | 'glass'>('default');
  const [fontFamily, setFontFamily] = useState('sans');

  useEffect(() => {
    if (data?.preferences) {
      setTheme(data.preferences.theme as 'default' | 'glass');
      setFontFamily(data.preferences.fontFamily);
    }
  }, [data]);

  const handleThemeToggle = (isGlass: boolean) => {
    const newTheme = isGlass ? 'glass' : 'default';
    setTheme(newTheme);
    
    updatePreferences.mutate(
      { theme: newTheme, fontFamily },
      {
        onSuccess: () => {
          toast({
            title: "Theme Updated",
            description: `Switched to ${isGlass ? 'glassmorphism' : 'default cream'} theme`,
          });
        },
      }
    );
  };

  const handleFontChange = (font: string) => {
    setFontFamily(font);
    
    updatePreferences.mutate(
      { theme, fontFamily: font },
      {
        onSuccess: () => {
          toast({
            title: "Font Updated",
            description: `Articles will now use ${font} font`,
          });
        },
      }
    );
  };

  const getFontClass = () => {
    const fontMap: Record<string, string> = {
      sans: 'font-sans',
      serif: 'font-serif',
      display: 'font-display',
      script: 'font-script',
      body: 'font-body',
      elegant: 'font-elegant',
      reading: 'font-reading',
    };
    return fontMap[fontFamily] || 'font-sans';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundDecorations />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Settings
            </h1>
            <p className="text-lg text-muted-foreground">
              Customize your reading experience
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6 animate-fade-in">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                
                <ThemeToggle 
                  isGlass={theme === 'glass'}
                  onToggle={handleThemeToggle}
                />

                <Separator className="my-6" />

                <FontSelector 
                  selectedFont={fontFamily}
                  onFontChange={handleFontChange}
                />
              </Card>
            </div>

            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  This is how articles will appear with your selected settings
                </p>

                <div className={`p-6 rounded-lg border bg-card ${theme === 'glass' ? 'backdrop-blur-md bg-white/20 border-white/30' : ''}`}>
                  <h3 className={`text-2xl font-bold mb-3 ${getFontClass()}`}>
                    Understanding Diabetes
                  </h3>
                  <p className={`text-base leading-relaxed text-muted-foreground ${getFontClass()}`}>
                    Diabetes is a chronic condition characterized by high blood sugar levels. 
                    It is caused by either a lack of insulin production or insulin resistance, 
                    and it can lead to serious health complications if not properly managed.
                  </p>
                  <p className={`text-base leading-relaxed text-muted-foreground mt-3 ${getFontClass()}`}>
                    Type 1 diabetes is an autoimmune disorder, while Type 2 diabetes is the most common form. 
                    Managing diabetes involves lifestyle changes and medication.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">About KORA</h2>
                <p className="text-sm text-muted-foreground">
                  KORA is a medical article search and management system that allows you to discover, 
                  download, and annotate scientific literature with powerful offline capabilities.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
