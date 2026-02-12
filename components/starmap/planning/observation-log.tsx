'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Star,
  Eye,
  Search,
  Trash2,
  ChevronRight,
  BarChart3,
  Cloud,
  Thermometer,
  Wind,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { tauriApi } from '@/lib/tauri';
import { isTauri } from '@/lib/storage/platform';
import type { 
  ObservationSession, 
  Observation, 
  ObservationStats,
} from '@/lib/tauri/types';
import type { ObservationLogProps } from '@/types/starmap/planning';
import { createLogger } from '@/lib/logger';

const logger = createLogger('observation-log');

export function ObservationLog({ currentSelection }: ObservationLogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ObservationSession[]>([]);
  const [stats, setStats] = useState<ObservationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Observation[]>([]);
  const [selectedSession, setSelectedSession] = useState<ObservationSession | null>(null);
  
  // Dialog states
  const [showNewSession, setShowNewSession] = useState(false);
  const [showAddObservation, setShowAddObservation] = useState(false);
  
  // New session form
  const [newSessionDate, setNewSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newSessionLocation, setNewSessionLocation] = useState('');
  const [newSessionNotes, setNewSessionNotes] = useState('');
  const [newSessionSeeing, setNewSessionSeeing] = useState<number>(3);
  const [newSessionTransparency, setNewSessionTransparency] = useState<number>(3);
  const [newSessionBortle, setNewSessionBortle] = useState<number>(5);
  
  // New observation form
  const [obsObjectName, setObsObjectName] = useState('');
  const [obsObjectType, setObsObjectType] = useState('');
  const [obsRating, setObsRating] = useState<number>(3);
  const [obsDifficulty, setObsDifficulty] = useState<number>(3);
  const [obsNotes, setObsNotes] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    if (!isTauri()) return;
    
    setLoading(true);
    try {
      const [logData, statsData] = await Promise.all([
        tauriApi.observationLog.load(),
        tauriApi.observationLog.getStats(),
      ]);
      setSessions(logData.sessions || []);
      setStats(statsData);
    } catch (error) {
      logger.error('Failed to load observation log', error);
      toast.error(t('observationLog.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open && isTauri()) {
      loadData();
    }
  }, [open, loadData]);

  // Create new session
  const handleCreateSession = useCallback(async () => {
    if (!isTauri()) return;
    
    try {
      const session = await tauriApi.observationLog.createSession(
        newSessionDate,
        undefined,
        newSessionLocation || undefined
      );
      
      if (newSessionNotes) {
        await tauriApi.observationLog.updateSession({
          ...session,
          notes: newSessionNotes,
        });
      }
      
      toast.success(t('observationLog.sessionCreated'));
      setShowNewSession(false);
      setNewSessionDate(new Date().toISOString().split('T')[0]);
      setNewSessionLocation('');
      setNewSessionNotes('');
      loadData();
    } catch (error) {
      logger.error('Failed to create session', error);
      toast.error(t('observationLog.createFailed'));
    }
  }, [newSessionDate, newSessionLocation, newSessionNotes, t, loadData]);

  // Add observation to session
  const handleAddObservation = useCallback(async () => {
    if (!isTauri() || !selectedSession) return;
    
    try {
      await tauriApi.observationLog.addObservation(selectedSession.id, {
        object_name: obsObjectName || currentSelection?.name || '',
        object_type: obsObjectType || currentSelection?.type,
        ra: currentSelection?.ra,
        dec: currentSelection?.dec,
        constellation: currentSelection?.constellation,
        rating: obsRating,
        difficulty: obsDifficulty,
        notes: obsNotes || undefined,
        image_paths: [],
      });
      
      toast.success(t('observationLog.observationAdded'));
      setShowAddObservation(false);
      setObsObjectName('');
      setObsObjectType('');
      setObsRating(3);
      setObsDifficulty(3);
      setObsNotes('');
      loadData();
    } catch (error) {
      logger.error('Failed to add observation', error);
      toast.error(t('observationLog.addFailed'));
    }
  }, [selectedSession, obsObjectName, obsObjectType, obsRating, obsDifficulty, obsNotes, currentSelection, t, loadData]);

  // End session
  const handleEndSession = useCallback(async (sessionId: string) => {
    if (!isTauri()) return;
    
    try {
      await tauriApi.observationLog.endSession(sessionId);
      toast.success(t('observationLog.sessionEnded'));
      loadData();
    } catch (error) {
      logger.error('Failed to end session', error);
      toast.error(t('observationLog.endFailed'));
    }
  }, [t, loadData]);

  // Delete session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!isTauri()) return;
    
    try {
      await tauriApi.observationLog.deleteSession(sessionId);
      toast.success(t('observationLog.sessionDeleted'));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      loadData();
    } catch (error) {
      logger.error('Failed to delete session', error);
      toast.error(t('observationLog.deleteFailed'));
    }
  }, [selectedSession, t, loadData]);

  // Search observations
  const handleSearch = useCallback(async () => {
    if (!isTauri() || !searchQuery.trim()) return;
    
    try {
      const results = await tauriApi.observationLog.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      logger.error('Search failed', error);
    }
  }, [searchQuery]);

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Format time
  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return '--:--';
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Rating stars
  const renderRating = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  const activeSession = sessions.find(s => !s.end_time);

  return (
    <TooltipProvider>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <Tooltip>
          <TooltipTrigger asChild>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent relative touch-target toolbar-btn"
              >
                <BookOpen className="h-5 w-5" />
                {activeSession && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </Button>
            </DrawerTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('observationLog.title')}</p>
          </TooltipContent>
        </Tooltip>

        <DrawerContent className="w-[85vw] max-w-[400px] sm:max-w-[450px] md:max-w-[500px] h-full bg-card border-border drawer-content">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('observationLog.title')}
            </DrawerTitle>
          </DrawerHeader>

          {!isTauri() ? (
            <div className="p-4 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('observationLog.desktopOnly')}</p>
            </div>
          ) : (
            <Tabs defaultValue="sessions" className="flex-1">
              <TabsList className="mx-4 grid w-[calc(100%-2rem)] grid-cols-3">
                <TabsTrigger value="sessions">
                  {t('observationLog.sessions') || 'Sessions'}
                </TabsTrigger>
                <TabsTrigger value="search">
                  {t('observationLog.search') || 'Search'}
                </TabsTrigger>
                <TabsTrigger value="stats">
                  {t('observationLog.stats') || 'Stats'}
                </TabsTrigger>
              </TabsList>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="flex-1 mt-4 px-4">
                <div className="space-y-4">
                  {/* New Session Button */}
                  <Button
                    className="w-full"
                    onClick={() => setShowNewSession(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('observationLog.newSession') || 'New Session'}
                  </Button>

                  {/* Active Session Indicator */}
                  {activeSession && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-green-400">
                            {t('observationLog.activeSession') || 'Active Session'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleEndSession(activeSession.id)}
                        >
                          {t('observationLog.endSession') || 'End'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activeSession.date)} • {activeSession.observations.length} observations
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Sessions List */}
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('common.loading') || 'Loading...'}
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t('observationLog.noSessions') || 'No observation sessions yet'}</p>
                        <p className="text-xs mt-1">{t('observationLog.createFirst') || 'Create your first session to start logging'}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                              selectedSession?.id === session.id
                                ? 'bg-primary/20 border-primary'
                                : 'bg-muted/50 border-border hover:border-muted-foreground'
                            }`}
                            onClick={() => setSelectedSession(
                              selectedSession?.id === session.id ? null : session
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{formatDate(session.date)}</span>
                                  {!session.end_time && (
                                    <Badge className="bg-green-500 text-white text-[10px] h-4">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                {session.location_name && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {session.location_name}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                  <span>•</span>
                                  <Eye className="h-3 w-3" />
                                  {session.observations.length} obs
                                </div>
                              </div>
                              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                                selectedSession?.id === session.id ? 'rotate-90' : ''
                              }`} />
                            </div>

                            {/* Expanded Session Details */}
                            {selectedSession?.id === session.id && (
                              <div className="mt-3 pt-3 border-t border-border space-y-2">
                                {session.notes && (
                                  <p className="text-xs text-muted-foreground">{session.notes}</p>
                                )}
                                
                                {/* Observations */}
                                {session.observations.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium">{t('observationLog.observations') || 'Observations'}:</p>
                                    {session.observations.slice(0, 5).map((obs) => (
                                      <div key={obs.id} className="flex items-center justify-between text-xs p-1 rounded bg-background/50">
                                        <span className="truncate">{obs.object_name}</span>
                                        {renderRating(obs.rating)}
                                      </div>
                                    ))}
                                    {session.observations.length > 5 && (
                                      <p className="text-[10px] text-muted-foreground">
                                        +{session.observations.length - 5} more
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                  {!session.end_time && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-7 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddObservation(true);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      {t('observationLog.addObs') || 'Add Obs'}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-red-400 hover:text-red-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSession(session.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Search Tab */}
              <TabsContent value="search" className="flex-1 mt-4 px-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('observationLog.searchPlaceholder') || 'Search objects...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button size="icon" onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="h-[calc(100vh-300px)]">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t('observationLog.searchHint') || 'Search your observation history'}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((obs) => (
                          <div key={obs.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{obs.object_name}</p>
                                {obs.object_type && (
                                  <Badge variant="secondary" className="text-[10px] mt-1">
                                    {obs.object_type}
                                  </Badge>
                                )}
                              </div>
                              {renderRating(obs.rating)}
                            </div>
                            {obs.notes && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{obs.notes}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDate(obs.observed_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="flex-1 mt-4 px-4">
                {stats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-2xl font-bold text-primary">{stats.total_sessions}</p>
                        <p className="text-xs text-muted-foreground">{t('observationLog.totalSessions') || 'Sessions'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-2xl font-bold text-primary">{stats.total_observations}</p>
                        <p className="text-xs text-muted-foreground">{t('observationLog.totalObs') || 'Observations'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-2xl font-bold text-primary">{stats.unique_objects}</p>
                        <p className="text-xs text-muted-foreground">{t('observationLog.uniqueObjects') || 'Unique Objects'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-2xl font-bold text-primary">{stats.total_hours.toFixed(1)}h</p>
                        <p className="text-xs text-muted-foreground">{t('observationLog.totalHours') || 'Total Hours'}</p>
                      </div>
                    </div>

                    {stats.objects_by_type.length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm font-medium mb-2">{t('observationLog.byType') || 'By Type'}</p>
                        <div className="space-y-1">
                          {stats.objects_by_type.slice(0, 5).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{type}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('observationLog.noStats') || 'No statistics available yet'}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DrawerContent>
      </Drawer>

      {/* New Session Dialog */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('observationLog.newSession') || 'New Observation Session'}</DialogTitle>
            <DialogDescription>
              {t('observationLog.newSessionDesc') || 'Start a new observation session for tonight.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('observationLog.date') || 'Date'}</Label>
              <Input
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('observationLog.location') || 'Location'}</Label>
              <Input
                placeholder={t('observationLog.locationPlaceholder') || 'Observation site name...'}
                value={newSessionLocation}
                onChange={(e) => setNewSessionLocation(e.target.value)}
              />
            </div>
            {/* Weather Conditions */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <Label className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                {t('observationLog.conditions') || 'Observing Conditions'}
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Wind className="h-3 w-3" />
                    {t('observationLog.seeing') || 'Seeing'}
                  </Label>
                  <Select value={String(newSessionSeeing)} onValueChange={(v) => setNewSessionSeeing(Number(v))}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {t('observationLog.transparency') || 'Transparency'}
                  </Label>
                  <Select value={String(newSessionTransparency)} onValueChange={(v) => setNewSessionTransparency(Number(v))}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Thermometer className="h-3 w-3" />
                    {t('observationLog.bortle') || 'Bortle Class'}
                  </Label>
                  <Select value={String(newSessionBortle)} onValueChange={(v) => setNewSessionBortle(Number(v))}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Excellent</SelectItem>
                      <SelectItem value="2">2 - Dark</SelectItem>
                      <SelectItem value="3">3 - Rural</SelectItem>
                      <SelectItem value="4">4 - Rural/Suburban</SelectItem>
                      <SelectItem value="5">5 - Suburban</SelectItem>
                      <SelectItem value="6">6 - Bright Suburban</SelectItem>
                      <SelectItem value="7">7 - Suburban/Urban</SelectItem>
                      <SelectItem value="8">8 - City</SelectItem>
                      <SelectItem value="9">9 - Inner City</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('observationLog.notes') || 'Notes'}</Label>
              <Textarea
                placeholder={t('observationLog.notesPlaceholder') || 'Additional notes, equipment used...'}
                value={newSessionNotes}
                onChange={(e) => setNewSessionNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSession(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleCreateSession}>
              {t('observationLog.startSession') || 'Start Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Observation Dialog */}
      <Dialog open={showAddObservation} onOpenChange={setShowAddObservation}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('observationLog.addObservation') || 'Add Observation'}</DialogTitle>
            <DialogDescription>
              {t('observationLog.addObsDesc') || 'Record an observation for this session.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('observationLog.objectName') || 'Object Name'}</Label>
              <Input
                placeholder={currentSelection?.name || 'M31, NGC 7000...'}
                value={obsObjectName}
                onChange={(e) => setObsObjectName(e.target.value)}
              />
              {currentSelection && !obsObjectName && (
                <p className="text-xs text-muted-foreground">
                  Using selected: {currentSelection.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('observationLog.objectType') || 'Type'}</Label>
              <Select value={obsObjectType} onValueChange={setObsObjectType}>
                <SelectTrigger>
                  <SelectValue placeholder={currentSelection?.type || 'Select type...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="galaxy">Galaxy</SelectItem>
                  <SelectItem value="nebula">Nebula</SelectItem>
                  <SelectItem value="cluster">Cluster</SelectItem>
                  <SelectItem value="planetary">Planetary Nebula</SelectItem>
                  <SelectItem value="star">Star</SelectItem>
                  <SelectItem value="double">Double Star</SelectItem>
                  <SelectItem value="planet">Planet</SelectItem>
                  <SelectItem value="moon">Moon</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('observationLog.rating') || 'Rating'}</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setObsRating(i)}
                    >
                      <Star className={`h-5 w-5 ${i <= obsRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('observationLog.difficulty') || 'Difficulty'}</Label>
                <Select value={String(obsDifficulty)} onValueChange={(v) => setObsDifficulty(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Easy</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5 - Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('observationLog.notes') || 'Notes'}</Label>
              <Textarea
                placeholder={t('observationLog.obsNotesPlaceholder') || 'What did you observe? Details, impressions...'}
                value={obsNotes}
                onChange={(e) => setObsNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddObservation(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleAddObservation}>
              {t('observationLog.addObservation') || 'Add Observation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
