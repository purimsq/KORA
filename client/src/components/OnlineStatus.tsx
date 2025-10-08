import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
      data-testid="online-status"
    >
      {isOnline ? (
        <>
          <div className="relative">
            <Wifi className="w-4 h-4 text-green-600" data-testid="icon-online" />
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
          </div>
          <span className="text-green-700 font-medium">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-600" data-testid="icon-offline" />
          <span className="text-red-700 font-medium">Offline Mode</span>
        </>
      )}
    </div>
  );
}
