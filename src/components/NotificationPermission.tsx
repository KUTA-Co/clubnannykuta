import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthFetch } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface NotificationPermissionProps {
  className?: string;
  variant?: 'card' | 'inline' | 'compact';
}

export function NotificationPermission({
  className,
  variant = 'card',
}: NotificationPermissionProps) {
  const authFetch = useAuthFetch();
  const { toast } = useToast();
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
  const [testing, setTesting] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    pushConfigured: boolean;
    activeSubscriptionCount: number;
  } | null>(null);

  const refreshServerStatus = async () => {
    try {
      const response = await authFetch('/api/push/status');
      const data = await response.json();
      if (data.success) {
        setServerStatus({
          pushConfigured: data.pushConfigured,
          activeSubscriptionCount: data.activeSubscriptionCount || 0,
        });
        return data;
      }
    } catch {
      // Status is diagnostic only; keep the UI usable if it fails.
    }
    return null;
  };

  useEffect(() => {
    if (isSupported && permission === 'granted') {
      refreshServerStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, permission, isSubscribed]);

  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-3 rounded-lg border border-border bg-white p-4', className)}>
        <BellOff className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            This browser cannot receive Club Nanny push notifications. Use Chrome, Edge, or an installed supported web app.
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    setLocalLoading(true);
    if (isSubscribed) {
      await unsubscribe();
      await refreshServerStatus();
    } else {
      const subscribed = await subscribe();
      if (subscribed) await refreshServerStatus();
    }
    setLocalLoading(false);
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      if (!isSubscribed) {
        const subscribed = await subscribe();
        if (!subscribed) {
          toast({
            title: 'Notifications not enabled',
            description: 'Please allow notifications first, then try the test again.',
            variant: 'destructive',
          });
          return;
        }
      }

      await refreshServerStatus();
      const response = await authFetch('/api/push/test-me', {
        method: 'POST',
        body: JSON.stringify({ url: window.location.pathname || '/' }),
      });
      const data = await response.json();

      await refreshServerStatus();

      if (data.success) {
        const total = data.result?.total || 0;
        const sent = data.result?.sent || 0;
        toast({
          title: sent > 0 ? 'Test notification sent' : total > 0 ? 'Push was blocked by the device' : 'No linked device yet',
          description: sent > 0
            ? 'If no popup appears, the device or browser is suppressing notifications.'
            : total > 0
            ? 'Club Nanny found this subscription, but the push service did not accept the alert. Turn notifications off and on again.'
            : 'Turn notifications off and on again to reconnect this device.',
          variant: sent > 0 ? 'default' : 'destructive',
        });
      } else {
        toast({
          title: 'Test failed',
          description: data.message || 'Could not send a test notification.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Test failed',
        description: 'Could not send a test notification.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const loading = isLoading || localLoading;
  const linkedDevices = serverStatus?.activeSubscriptionCount ?? 0;
  const serverLinked = linkedDevices > 0;
  const statusText = serverStatus && !serverStatus.pushConfigured
    ? 'Push notifications are not configured on the server'
    : permission === 'denied'
    ? 'Blocked in browser settings'
    : isSubscribed && serverLinked
    ? `Connected to ${linkedDevices} device${linkedDevices === 1 ? '' : 's'}`
    : isSubscribed
    ? 'Allowed here, but not linked to Club Nanny yet'
    : 'Get notified about bookings';

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
      <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-sage" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {statusText}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <div className="flex items-center gap-3">
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={loading || permission === 'denied'}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={loading || testing || permission === 'denied'}
              className="whitespace-nowrap"
            >
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Test
            </Button>
          </div>
          <p className="max-w-xs text-xs text-muted-foreground sm:text-right">
            Allow notifications in your browser or device settings to receive Club Nanny alerts on this device.
          </p>
        </div>
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
              : serverStatus && !serverStatus.pushConfigured
              ? 'Push notifications are not configured on the server.'
              : isSubscribed && serverLinked
              ? `Connected to ${linkedDevices} device${linkedDevices === 1 ? '' : 's'} for bookings and messages.`
              : isSubscribed
              ? 'Allowed in this browser, but not linked to Club Nanny yet.'
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
          <div className="grid gap-2 sm:grid-cols-2">
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
            <Button
              type="button"
              onClick={handleTestNotification}
              variant="outline"
              size="sm"
              disabled={loading || testing || permission === 'denied'}
              className="w-full"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Test
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
