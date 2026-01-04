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
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMountStore, useStellariumStore } from '@/lib/stores';
import {
  type AstroEvent,
  type EventType,
  fetchAllAstroEvents,
  ASTRO_EVENT_SOURCES,
} from '@/lib/services/astro-data-sources';
import { useAstroEvents } from '@/lib/tauri/hooks';
import { isTauri } from '@/lib/storage/platform';


// ============================================================================
// Event Card Component
// ============================================================================

function EventCard({ event, onGoTo }: { event: AstroEvent; onGoTo?: (ra: number, dec: number) => void }) {
  const t = useTranslations();
  
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'lunar_phase': return <Moon className="h-4 w-4" />;
      case 'meteor_shower': return <Sparkles className="h-4 w-4" />;
      case 'planet_conjunction': return <CircleDot className="h-4 w-4" />;
      case 'eclipse': return <Eclipse className="h-4 w-4" />;
      case 'planet_opposition': return <Orbit className="h-4 w-4" />;
      case 'planet_elongation': return <Star className="h-4 w-4" />;
      case 'equinox_solstice': return <Sun className="h-4 w-4" />;
      case 'comet': return <Star className="h-4 w-4" />;
      case 'asteroid': return <CircleDot className="h-4 w-4" />;
      case 'supernova': return <Star className="h-4 w-4" />;
      case 'aurora': return <Sparkles className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };
  
  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'lunar_phase': return 'text-amber-400 bg-amber-400/10';
      case 'meteor_shower': return 'text-purple-400 bg-purple-400/10';
      case 'planet_conjunction': return 'text-blue-400 bg-blue-400/10';
      case 'eclipse': return 'text-red-400 bg-red-400/10';
      case 'planet_opposition': return 'text-orange-400 bg-orange-400/10';
      case 'planet_elongation': return 'text-cyan-400 bg-cyan-400/10';
      case 'equinox_solstice': return 'text-yellow-400 bg-yellow-400/10';
      case 'comet': return 'text-green-400 bg-green-400/10';
      case 'asteroid': return 'text-stone-400 bg-stone-400/10';
      case 'supernova': return 'text-pink-400 bg-pink-400/10';
      case 'aurora': return 'text-emerald-400 bg-emerald-400/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };
  
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
    <Card className="border-border hover:border-primary/50 transition-colors">
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
                <span className="text-primary">Peak: {formatTime(event.peakTime)}</span>
              )}
            </div>
            
            {event.endDate && (
              <div className="text-xs text-muted-foreground mb-1">
                Until {formatDate(event.endDate)}
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
                  onClick={() => onGoTo(event.ra!, event.dec!)}
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
  const [dataSources, setDataSources] = useState(() => 
    ASTRO_EVENT_SOURCES.map(s => ({ ...s, enabled: s.enabled }))
  );
  
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
        const enabledSourceIds = dataSources
          .filter(s => s.enabled)
          .map(s => s.id);
        
        const fetchedEvents = await fetchAllAstroEvents(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          enabledSourceIds
        );
        
        // Merge with Tauri events if available
        let allEvents = fetchedEvents;
        if (isTauri() && tauriEvents.events.length > 0) {
          // Convert Tauri events to web AstroEvent format
          // Map Tauri event types to web event types
          const mapEventType = (t: string): EventType => {
            if (t.includes('moon')) return 'lunar_phase';
            if (t.includes('eclipse')) return 'eclipse';
            if (t.includes('meteor')) return 'meteor_shower';
            if (t.includes('conjunction')) return 'planet_conjunction';
            if (t.includes('opposition')) return 'planet_opposition';
            if (t.includes('elongation')) return 'planet_elongation';
            if (t.includes('equinox') || t.includes('solstice')) return 'equinox_solstice';
            return 'lunar_phase';
          };
          
          const tauriAstroEvents: AstroEvent[] = tauriEvents.events.map(e => ({
            id: e.id,
            type: mapEventType(e.event_type),
            name: e.name,
            date: new Date(e.date),
            description: e.description,
            visibility: (e.visibility || 'good') as 'excellent' | 'good' | 'fair' | 'poor',
            magnitude: e.magnitude ?? undefined,
            source: 'Desktop',
          }));
          // Merge and deduplicate by name
          const existingNames = new Set(allEvents.map(ev => ev.name.toLowerCase()));
          const newEvents = tauriAstroEvents.filter(ev => !existingNames.has(ev.name.toLowerCase()));
          allEvents = [...allEvents, ...newEvents];
        }
        
        setEvents(allEvents);
        setIsOnline(true);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // If web fetch fails but we have Tauri events, use those
        if (isTauri() && tauriEvents.events.length > 0) {
          const mapEventType = (t: string): EventType => {
            if (t.includes('moon')) return 'lunar_phase';
            if (t.includes('eclipse')) return 'eclipse';
            if (t.includes('meteor')) return 'meteor_shower';
            if (t.includes('conjunction')) return 'planet_conjunction';
            if (t.includes('opposition')) return 'planet_opposition';
            if (t.includes('elongation')) return 'planet_elongation';
            if (t.includes('equinox') || t.includes('solstice')) return 'equinox_solstice';
            return 'lunar_phase';
          };
          
          const tauriAstroEvents: AstroEvent[] = tauriEvents.events.map(e => ({
            id: e.id,
            type: mapEventType(e.event_type),
            name: e.name,
            date: new Date(e.date),
            description: e.description,
            visibility: (e.visibility || 'good') as 'excellent' | 'good' | 'fair' | 'poor',
            magnitude: e.magnitude ?? undefined,
            source: 'Desktop',
          }));
          setEvents(tauriAstroEvents);
        }
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [open, selectedDate, dataSources, tauriEvents.events]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e: AstroEvent) => e.type === filterType);
  }, [events, filterType]);
  
  // Toggle data source
  const toggleDataSource = useCallback((id: string) => {
    setDataSources(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  }, []);
  
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
      
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
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
                {dataSources.map(source => (
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
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">{t('events.loading')}</p>
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
    </Dialog>
  );
}


