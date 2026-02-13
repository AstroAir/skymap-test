'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Wifi, WifiOff, Radio, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { useMountStore } from '@/lib/stores';
import { mountApi, type DiscoveredDevice } from '@/lib/tauri/mount-api';
import { isTauri } from '@/lib/tauri/app-control-api';
import { createLogger } from '@/lib/logger';
import type { MountProtocol } from '@/lib/core/types';

const logger = createLogger('mount-connection');

interface MountConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MountConnectionDialog({ open, onOpenChange }: MountConnectionDialogProps) {
  const t = useTranslations('mount');
  const connectionConfig = useMountStore((s) => s.connectionConfig);
  const setConnectionConfig = useMountStore((s) => s.setConnectionConfig);
  const setCapabilities = useMountStore((s) => s.setCapabilities);
  const applyMountState = useMountStore((s) => s.applyMountState);
  const resetMountInfo = useMountStore((s) => s.resetMountInfo);
  const connected = useMountStore((s) => s.mountInfo.Connected);

  const [protocol, setProtocol] = useState<MountProtocol>(connectionConfig.protocol);
  const [host, setHost] = useState(connectionConfig.host);
  const [port, setPort] = useState(String(connectionConfig.port));
  const [deviceId, setDeviceId] = useState(String(connectionConfig.deviceId));
  const [connecting, setConnecting] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [error, setError] = useState('');

  const handleConnect = useCallback(async () => {
    if (!isTauri()) {
      setError(t('notDesktop'));
      return;
    }

    setConnecting(true);
    setError('');

    const config = {
      protocol,
      host,
      port: parseInt(port, 10) || 11111,
      deviceId: parseInt(deviceId, 10) || 0,
    };

    try {
      setConnectionConfig(config);
      const caps = await mountApi.connect(config);
      setCapabilities(caps);

      // Fetch initial state
      const state = await mountApi.getState();
      applyMountState(state);

      logger.info('Mount connected', { protocol, host: config.host, port: config.port });
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      logger.error('Mount connection failed', { error: msg });
    } finally {
      setConnecting(false);
    }
  }, [protocol, host, port, deviceId, setConnectionConfig, setCapabilities, applyMountState, onOpenChange, t]);

  const handleDisconnect = useCallback(async () => {
    try {
      await mountApi.disconnect();
      resetMountInfo();
      logger.info('Mount disconnected');
    } catch (e) {
      logger.error('Disconnect error', { error: e });
    }
  }, [resetMountInfo]);

  const handleDiscover = useCallback(async () => {
    if (!isTauri()) return;
    setDiscovering(true);
    setDevices([]);
    try {
      const found = await mountApi.discover();
      setDevices(found);
      if (found.length > 0) {
        setHost(found[0].host);
        setPort(String(found[0].port));
        setDeviceId(String(found[0].deviceId));
      }
    } catch (e) {
      logger.error('Discovery failed', { error: e });
    } finally {
      setDiscovering(false);
    }
  }, []);

  const handleDeviceSelect = useCallback((device: DiscoveredDevice) => {
    setHost(device.host);
    setPort(String(device.port));
    setDeviceId(String(device.deviceId));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {connected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
            {t('connectionSettings')}
          </DialogTitle>
        </DialogHeader>

        {connected ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">{t('connected')}</Badge>
              <span className="text-sm text-muted-foreground">
                {connectionConfig.protocol === 'simulator' ? t('simulator') : `${connectionConfig.host}:${connectionConfig.port}`}
              </span>
            </div>
            <Button variant="destructive" onClick={handleDisconnect} className="w-full">
              <WifiOff className="h-4 w-4 mr-2" />
              {t('disconnect')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Protocol Selection */}
            <div className="grid gap-2">
              <Label>{t('protocol')}</Label>
              <Select value={protocol} onValueChange={(v) => setProtocol(v as MountProtocol)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simulator">
                    <span className="flex items-center gap-2">
                      <Radio className="h-3 w-3" />
                      {t('simulator')}
                    </span>
                  </SelectItem>
                  <SelectItem value="alpaca">
                    <span className="flex items-center gap-2">
                      <Wifi className="h-3 w-3" />
                      ASCOM Alpaca
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alpaca Settings */}
            {protocol === 'alpaca' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="mount-host">{t('host')}</Label>
                    <Input
                      id="mount-host"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="localhost"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mount-port">{t('port')}</Label>
                    <Input
                      id="mount-port"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="11111"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mount-device-id">{t('deviceId')}</Label>
                  <Input
                    id="mount-device-id"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="0"
                    className="font-mono text-sm w-20"
                  />
                </div>

                {/* Discovery */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscover}
                    disabled={discovering}
                    className="w-full"
                  >
                    {discovering ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Search className="h-3 w-3 mr-2" />}
                    {t('discoverDevices')}
                  </Button>

                  {devices.length > 0 && (
                    <div className="space-y-1">
                      {devices.map((d, i) => (
                        <button
                          key={i}
                          className="w-full text-left text-xs p-2 rounded border border-border hover:bg-accent transition-colors"
                          onClick={() => handleDeviceSelect(d)}
                        >
                          <span className="font-medium">{d.deviceName}</span>
                          <span className="text-muted-foreground ml-2">{d.host}:{d.port}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {!connected && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Wifi className="h-4 w-4 mr-2" />
              {t('connect')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
