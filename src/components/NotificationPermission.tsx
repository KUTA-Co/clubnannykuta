import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPermissionProps {
  className?: string;
  variant?: 'card' | 'inline' | 'compact';
}

export function NotificationPermission({
  className,
  variant = 'card',
}: NotificationPermissionProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [localLoading, setLocalLoading] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    setLocalLoading(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setLocalLoading(false);
  };

  const loading = isLoading || localLoading;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={loading || permission === 'denied'}
        />
        <span className="text-sm text-muted-foreground">
          {isSubscribed ? 'Notifications on' : 'Notifications off'}
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-sage" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {permission === 'denied'
                ? 'Blocked in browser settings'
                : isSubscribed
                ? 'You will receive updates'
                : 'Get notified about bookings'}
            </p>
          </div>
        </div>
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={loading || permission === 'denied'}
        />
      </div>
    );
  }

  // Card variant (default)
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-white p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            isSubscribed ? 'bg-sage/10' : 'bg-muted'
          )}
        >
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-sage" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Push Notifications</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {permission === 'denied'
              ? 'Notifications are blocked. Please enable them in your browser settings.'
              : isSubscribed
              ? 'You will receive notifications about bookings and messages.'
              : 'Enable notifications to stay updated on bookings and messages.'}
          </p>

          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        {permission === 'denied' ? (
          <p className="text-xs text-muted-foreground">
            To enable notifications, go to your browser settings and allow
            notifications for this site.
          </p>
        ) : (
          <Button
            onClick={handleToggle}
            variant={isSubscribed ? 'outline' : 'default'}
            size="sm"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isSubscribed ? 'Disabling...' : 'Enabling...'}
              </>
            ) : isSubscribed ? (
              'Disable Notifications'
            ) : (
              'Enable Notifications'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
