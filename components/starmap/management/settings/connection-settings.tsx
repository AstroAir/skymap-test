'use client';

import { useTranslations } from 'next-intl';
import { Link } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsSection } from './settings-shared';

interface ConnectionSettingsProps {
  localConnection: { ip: string; port: string };
  localProtocol: 'http' | 'https';
  onConnectionChange: (connection: { ip: string; port: string }) => void;
  onProtocolChange: (protocol: 'http' | 'https') => void;
}

export function ConnectionSettings({
  localConnection,
  localProtocol,
  onConnectionChange,
  onProtocolChange,
}: ConnectionSettingsProps) {
  const t = useTranslations();

  return (
    <SettingsSection
      title={t('settings.connection')}
      icon={<Link className="h-4 w-4" />}
      defaultOpen={false}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('settings.protocol')}</Label>
          <Select
            value={localProtocol}
            onValueChange={(v) => onProtocolChange(v as 'http' | 'https')}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="https">HTTPS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('settings.ipAddress')}</Label>
            <Input
              value={localConnection.ip}
              onChange={(e) => onConnectionChange({ ...localConnection, ip: e.target.value })}
              placeholder="localhost"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('settings.port')}</Label>
            <Input
              value={localConnection.port}
              onChange={(e) => onConnectionChange({ ...localConnection, port: e.target.value })}
              placeholder="1888"
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground px-1">
          {t('settings.connectionDescription')}
        </p>
      </div>
    </SettingsSection>
  );
}
