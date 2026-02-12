'use client';

/**
 * Log Viewer Component
 * 
 * A comprehensive log viewing panel with filtering, searching,
 * and export capabilities.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bug,
  Info,
  AlertTriangle,
  XCircle,
  Search,
  Trash2,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  FileText,
  FileJson,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLogStore } from '@/lib/stores/log-store';
import {
  LogLevel,
  LogEntry,
  formatTimestamp,
  serializeData,
  formatLogEntryToText,
} from '@/lib/logger';

interface LogEntryRowProps {
  entry: LogEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const LogLevelIcon: React.FC<{ level: LogLevel; className?: string }> = ({ level, className }) => {
  switch (level) {
    case LogLevel.DEBUG:
      return <Bug className={cn('h-4 w-4 text-muted-foreground', className)} />;
    case LogLevel.INFO:
      return <Info className={cn('h-4 w-4 text-blue-500', className)} />;
    case LogLevel.WARN:
      return <AlertTriangle className={cn('h-4 w-4 text-yellow-500', className)} />;
    case LogLevel.ERROR:
      return <XCircle className={cn('h-4 w-4 text-red-500', className)} />;
    default:
      return null;
  }
};

const LogEntryRow: React.FC<LogEntryRowProps> = ({ entry, isExpanded, onToggleExpand }) => {
  const t = useTranslations('logViewer');
  const [copied, setCopied] = useState(false);
  const hasDetails = entry.data !== undefined || entry.stack;
  
  const handleCopy = useCallback(() => {
    const text = formatLogEntryToText(entry);
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [entry]);
  
  return (
    <div
      className={cn(
        'group border-b border-border/50 hover:bg-muted/30 transition-colors',
        entry.level === LogLevel.ERROR && 'bg-red-500/5',
        entry.level === LogLevel.WARN && 'bg-yellow-500/5'
      )}
      role={hasDetails ? 'button' : undefined}
      aria-expanded={hasDetails ? isExpanded : undefined}
    >
      <div
        className="flex items-start gap-2 px-3 py-2 cursor-pointer"
        onClick={hasDetails ? onToggleExpand : undefined}
      >
        <LogLevelIcon level={entry.level} className="mt-0.5 flex-shrink-0" />
        
        <span className="text-xs text-muted-foreground font-mono flex-shrink-0 mt-0.5">
          {formatTimestamp(entry.timestamp)}
        </span>
        
        <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
          {entry.module}
        </Badge>
        
        <span className="text-sm flex-1 break-words">{entry.message}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{t('copy')}</TooltipContent>
          </Tooltip>
          
          {hasDetails && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {hasDetails && isExpanded && (
        <div className="px-3 pb-2 ml-6 space-y-2">
          {entry.data !== undefined && (
            <div className="bg-muted/50 rounded p-2">
              <div className="text-xs text-muted-foreground mb-1">{t('data')}</div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto">
                {serializeData(entry.data)}
              </pre>
            </div>
          )}
          
          {entry.stack && (
            <div className="bg-red-500/10 rounded p-2">
              <div className="text-xs text-red-500 mb-1">{t('stackTrace')}</div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto text-red-400">
                {entry.stack}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MemoizedLogEntryRow = React.memo(LogEntryRow);

export interface LogViewerProps {
  className?: string;
  maxHeight?: string | number;
  showToolbar?: boolean;
  showStats?: boolean;
}

export function LogViewer({
  className,
  maxHeight = '400px',
  showToolbar = true,
  showStats = true,
}: LogViewerProps) {
  const t = useTranslations('logViewer');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    logs,
    totalCount,
    filter,
    modules,
    stats,
    autoScroll,
    setFilter,
    clearFilter,
    clearLogs,
    downloadLogs,
    refresh,
    setAutoScroll,
  } = useLogStore();
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);
  
  // Initial refresh
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  const handleLevelChange = useCallback((value: string) => {
    if (value === 'all') {
      setFilter({ level: undefined });
    } else {
      setFilter({ level: parseInt(value) as LogLevel });
    }
  }, [setFilter]);
  
  const handleModuleChange = useCallback((value: string) => {
    if (value === 'all') {
      setFilter({ module: undefined });
    } else {
      setFilter({ module: value });
    }
  }, [setFilter]);
  
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || undefined;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilter({ search: value });
    }, 200);
  }, [setFilter]);
  
  return (
    <div className={cn('flex flex-col bg-background border rounded-lg', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center gap-2 p-2 border-b">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={filter.search || ''}
              onChange={handleSearchChange}
              className="pl-8 h-8"
            />
          </div>
          
          {/* Level Filter */}
          <Select
            value={filter.level !== undefined ? String(filter.level) : 'all'}
            onValueChange={handleLevelChange}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder={t('allLevels')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allLevels')}</SelectItem>
              <SelectItem value={String(LogLevel.DEBUG)}>{t('debug')}</SelectItem>
              <SelectItem value={String(LogLevel.INFO)}>{t('info')}</SelectItem>
              <SelectItem value={String(LogLevel.WARN)}>{t('warn')}</SelectItem>
              <SelectItem value={String(LogLevel.ERROR)}>{t('error')}</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Module Filter */}
          <Select
            value={filter.module || 'all'}
            onValueChange={handleModuleChange}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder={t('allModules')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allModules')}</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module} value={module}>
                  {module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('settings')}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={refresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('refresh')}</TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('export')}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadLogs('text')}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('exportText')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadLogs('json')}>
                  <FileJson className="h-4 w-4 mr-2" />
                  {t('exportJson')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={clearLogs}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('clear')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
      
      {/* Settings Panel */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <div className="p-3 border-b bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-scroll"
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                />
                <Label htmlFor="auto-scroll" className="text-sm">
                  {t('autoScroll')}
                </Label>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilter}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                {t('clearFilters')}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Stats Bar */}
      {showStats && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-b bg-muted/20 text-xs">
          <span className="text-muted-foreground">
            {t('showing', { count: logs.length, total: totalCount })}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="flex items-center gap-1">
              <Bug className="h-3 w-3 text-muted-foreground" />
              {stats.byLevel.debug}
            </span>
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3 text-blue-500" />
              {stats.byLevel.info}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              {stats.byLevel.warn}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              {stats.byLevel.error}
            </span>
          </div>
        </div>
      )}
      
      {/* Log Entries */}
      <ScrollArea
        ref={scrollRef}
        style={{ height: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">{t('noLogs')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((entry) => (
              <MemoizedLogEntryRow
                key={entry.id}
                entry={entry}
                isExpanded={expandedIds.has(entry.id)}
                onToggleExpand={() => toggleExpanded(entry.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default LogViewer;
