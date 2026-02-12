'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Calendar,
  Moon,
  Sun,
  Star,
  Orbit,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  MapPin,
  Sparkles,
  CircleDot,
  Eclipse,
  RefreshCw,
  ExternalLink,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMountStore, useStellariumStore } from '@/lib/stores';
import {
  type AstroEvent,
  type EventType,
  fetchAllAstroEvents,
} from '@/lib/services/astro-data-sources';
import { useEventSourcesStore } from '@/lib/stores';
import { useAstroEvents } from '@/lib/tauri/hooks';
import { isTauri } from '@/lib/storage/platform';
import { convertTauriEvents } from '@/lib/astronomy/event-utils';
import { createLogger } from '@/lib/logger';
import { EventDetailDialog } from './event-detail-dialog';

const logger = createLogger('astro-events-calendar');

// ============================================================================
// Event Type Icon & Color Maps
// ============================================================================

const EVENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  lunar_phase: Moon,
  meteor_shower: Sparkles,
  planet_conjunction: CircleDot,
  eclipse: Eclipse,
  planet_opposition: Orbit,
  planet_elongation: Star,
  equinox_solstice: Sun,
  comet: Star,
  asteroid: CircleDot,
  supernova: Star,
  aurora: Sparkles,
};

const EVENT_COLOR_MAP: Record<string, string> = {
  lunar_phase: 'text-amber-400 bg-amber-400/10',
  meteor_shower: 'text-purple-400 bg-purple-400/10',
  planet_conjunction: 'text-blue-400 bg-blue-400/10',
  eclipse: 'text-red-400 bg-red-400/10',
  planet_opposition: 'text-orange-400 bg-orange-400/10',
  planet_elongation: 'text-cyan-400 bg-cyan-400/10',
  equinox_solstice: 'text-yellow-400 bg-yellow-400/10',
  comet: 'text-green-400 bg-green-400/10',
  asteroid: 'text-stone-400 bg-stone-400/10',
  supernova: 'text-pink-400 bg-pink-400/10',
  aurora: 'text-emerald-400 bg-emerald-400/10',
};

function getEventIcon(type: EventType) {
  const Icon = EVENT_ICON_MAP[type] ?? Star;
  return <Icon className="h-4 w-4" />;
}

function getEventColor(type: EventType) {
  return EVENT_COLOR_MAP[type] ?? 'text-muted-foreground bg-muted';
}

// ============================================================================
// Event Card Component
// ============================================================================

function EventCard({ event, onGoTo, onClick }: { event: AstroEvent; onGoTo?: (ra: number, dec: number) => void; onClick?: () => void }) {
  const t = useTranslations();
  
  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'excellent': return <Badge className="bg-green-500/20 text-green-400 text-[10px]">{t('events.excellent')}</Badge>;
      case 'good': return <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">{t('events.good')}</Badge>;
      case 'fair': return <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">{t('events.fair')}</Badge>;
      case 'poor': return <Badge className="bg-red-500/20 text-red-400 text-[10px]">{t('events.poor')}</Badge>;
      default: return null;
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <Card 
      className={cn("border-border hover:border-primary/50 transition-colors", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Event Icon */}
          <div className={cn('p-2 rounded-lg', getEventColor(event.type))}>
            {getEventIcon(event.type)}
          </div>
          
          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{event.name}</span>
              {getVisibilityBadge(event.visibility)}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(event.date)}</span>
              {event.peakTime && (
                <span className="text-primary">{t('events.peak', { time: formatTime(event.peakTime) })}</span>
              )}
            </div>
            
            {event.endDate && (
              <div className="text-xs text-muted-foreground mb-1">
                {t('events.until', { date: formatDate(event.endDate) })}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground line-clamp-2">
              {event.description}
            </p>
            
            {/* Source badge */}
            {event.source && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-[9px] h-4">
                  {event.source}
                </Badge>
                {event.url && (
                  <a 
                    href={event.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
          
          {/* Go To Button */}
          {event.ra !== undefined && event.dec !== undefined && onGoTo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => { e.stopPropagation(); onGoTo(event.ra!, event.dec!); }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('events.goToRadiant')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AstroEventsCalendar() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [events, setEvents] = useState<AstroEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AstroEvent | null>(null);
  
  const eventSources = useEventSourcesStore((state) => state.sources);
  const toggleEventSource = useEventSourcesStore((state) => state.toggleSource);
  
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  // Tauri events hook for desktop-specific events (meteor showers, etc.)
  const startDateStr = useMemo(() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    return d.toISOString().split('T')[0];
  }, [selectedDate]);
  const endDateStr = useMemo(() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  }, [selectedDate]);
  const tauriEvents = useAstroEvents(startDateStr, endDateStr);
  
  // Fetch events when month changes or dialog opens
  useEffect(() => {
    if (!open) return;
    
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await fetchAllAstroEvents(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          eventSources
        );
        
        // Merge with Tauri events if available
        let allEvents = fetchedEvents;
        if (isTauri() && tauriEvents.events.length > 0) {
          const tauriAstroEvents = convertTauriEvents(tauriEvents.events);
          // Merge and deduplicate by name
          const existingNames = new Set(allEvents.map(ev => ev.name.toLowerCase()));
          const newEvents = tauriAstroEvents.filter(ev => !existingNames.has(ev.name.toLowerCase()));
          allEvents = [...allEvents, ...newEvents];
        }
        
        setEvents(allEvents);
        setIsOnline(true);
      } catch (error) {
        logger.error('Failed to fetch events', error);
        // If web fetch fails but we have Tauri events, use those
        if (isTauri() && tauriEvents.events.length > 0) {
          setEvents(convertTauriEvents(tauriEvents.events));
        }
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [open, selectedDate, eventSources, tauriEvents.events]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e: AstroEvent) => e.type === filterType);
  }, [events, filterType]);
  
  // Toggle data source (uses store)
  const toggleDataSource = useCallback((id: string) => {
    toggleEventSource(id);
  }, [toggleEventSource]);
  
  // Refresh data
  const handleRefresh = useCallback(() => {
    setEvents([]);
    // Trigger re-fetch by updating a dependency
    setSelectedDate(new Date(selectedDate));
  }, [selectedDate]);
  
  // Navigate months
  const goToPrevMonth = useCallback(() => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);
  
  const goToNextMonth = useCallback(() => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);
  
  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);
  
  // Handle go to event location
  const handleGoTo = useCallback((ra: number, dec: number) => {
    if (setViewDirection) {
      setViewDirection(ra, dec);
      setOpen(false);
    }
  }, [setViewDirection]);
  
  const monthName = selectedDate.toLocaleDateString(undefined, { 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Calendar className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('events.calendar')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="sm:max-w-[500px] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('events.astronomicalEvents')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Month Navigation & Controls */}
        <div className="flex items-center justify-between shrink-0">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-medium">{monthName}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goToToday}>
              {t('events.today')}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('events.refresh')}</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Online Status & Filter */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('events.filter')}:</span>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as EventType | 'all')}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('events.allEvents')}</SelectItem>
                <SelectItem value="lunar_phase">{t('events.lunarPhases')}</SelectItem>
                <SelectItem value="meteor_shower">{t('events.meteorShowers')}</SelectItem>
                <SelectItem value="planet_conjunction">{t('events.conjunctions')}</SelectItem>
                <SelectItem value="eclipse">{t('events.eclipses')}</SelectItem>
                <SelectItem value="comet">{t('events.comets')}</SelectItem>
                <SelectItem value="equinox_solstice">{t('events.seasons')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="text-green-500 border-green-500/50">
                <Wifi className="h-3 w-3 mr-1" />
                {t('events.online')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                <WifiOff className="h-3 w-3 mr-1" />
                {t('events.offline')}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Data Sources Settings */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleContent>
            <Card className="border-dashed">
              <CardContent className="p-3 space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {t('events.dataSources')}
                </div>
                {eventSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between">
                    <Label htmlFor={`source-${source.id}`} className="text-sm">
                      {source.name}
                    </Label>
                    <Switch
                      id={`source-${source.id}`}
                      checked={source.enabled}
                      onCheckedChange={() => toggleDataSource(source.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        
        <Separator />
        
        {/* Events List */}
        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="space-y-2 pr-3 pb-2">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('events.noEvents')}</p>
              </div>
            ) : (
              filteredEvents.map((event: AstroEvent) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onGoTo={event.ra !== undefined ? handleGoTo : undefined}
                  onClick={() => setSelectedEvent(event)}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Location Info & Stats */}
        <div className="shrink-0 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>
              {profileInfo.AstrometrySettings.Latitude?.toFixed(2)}°, 
              {profileInfo.AstrometrySettings.Longitude?.toFixed(2)}°
            </span>
          </div>
          <span>{filteredEvents.length} {t('events.eventsFound')}</span>
        </div>
      </DialogContent>

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={selectedEvent !== null}
        onOpenChange={(isOpen) => { if (!isOpen) setSelectedEvent(null); }}
        onGoTo={handleGoTo}
      />
    </Dialog>
  );
}


