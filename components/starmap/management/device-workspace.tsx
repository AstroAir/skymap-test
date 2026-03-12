'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCcw, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDeviceStore } from '@/lib/stores/device-store';
import type { DeviceProfile } from '@/lib/core/types/device';

function formatTimestamp(value?: string): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function profileSort(left: DeviceProfile, right: DeviceProfile): number {
  if (left.type === right.type) return left.name.localeCompare(right.name);
  return left.type.localeCompare(right.type);
}

export function DeviceWorkspace() {
  const profiles = useDeviceStore((state) => state.profiles);
  const connections = useDeviceStore((state) => state.connections);
  const diagnostics = useDeviceStore((state) => state.diagnostics);
  const readiness = useDeviceStore((state) => state.readiness);
  const syncFromEquipmentStore = useDeviceStore((state) => state.syncFromEquipmentStore);
  const syncFromMountStore = useDeviceStore((state) => state.syncFromMountStore);
  const recomputeReadiness = useDeviceStore((state) => state.recomputeReadiness);
  const retryConnection = useDeviceStore((state) => state.retryConnection);

  const sortedProfiles = useMemo(
    () => [...profiles].sort(profileSort),
    [profiles],
  );

  const handleRefresh = () => {
    syncFromEquipmentStore();
    syncFromMountStore();
    recomputeReadiness();
  };

  return (
    <Card className="py-0">
      <CardHeader className="py-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Device Workspace
          </CardTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRefresh}>
            <RefreshCcw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
          <span className="text-xs text-muted-foreground">Session readiness</span>
          <Badge variant={readiness.state === 'ready' ? 'default' : (readiness.state === 'warning' ? 'secondary' : 'destructive')}>
            {readiness.state}
          </Badge>
        </div>

        {readiness.issues.length > 0 && (
          <div className="space-y-1">
            {readiness.issues.map((issue) => (
              <div key={`${issue.code}-${issue.profileId ?? issue.type}`} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {sortedProfiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">No device profiles available.</p>
        ) : (
          <div className="space-y-2">
            {sortedProfiles.map((profile) => {
              const connection = connections[profile.id];
              const events = diagnostics[profile.id] ?? [];
              const latestEvent = events.length > 0 ? events[events.length - 1] : null;
              const canRetry = connection?.state === 'failed' || connection?.state === 'degraded';

              return (
                <div key={profile.id} className="rounded-md border border-border p-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{profile.type}</Badge>
                      <span className="text-xs font-medium">{profile.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {connection?.state && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {connection.state}
                        </Badge>
                      )}
                      {profile.validationIssues && profile.validationIssues.length === 0 && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  </div>

                  {connection?.lastError && (
                    <p className="text-xs text-destructive">{connection.lastError.message}</p>
                  )}

                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <p>Updated: {formatTimestamp(profile.updatedAt)}</p>
                    {latestEvent && (
                      <p>
                        Last event: {latestEvent.from} → {latestEvent.to} ({formatTimestamp(latestEvent.at)})
                      </p>
                    )}
                  </div>

                  {canRetry && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => retryConnection(profile.id, 'device-workspace-retry')}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
