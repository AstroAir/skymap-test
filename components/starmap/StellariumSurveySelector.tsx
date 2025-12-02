'use client';

import { useTranslations } from 'next-intl';
import { SKY_SURVEYS } from '@/lib/starmap/types';
import { Map, Telescope } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StellariumSurveySelectorProps {
  surveyEnabled: boolean;
  surveyId: string;
  onSurveyChange: (surveyId: string) => void;
  onSurveyToggle: (enabled: boolean) => void;
}

export function StellariumSurveySelector({
  surveyEnabled,
  surveyId,
  onSurveyChange,
  onSurveyToggle,
}: StellariumSurveySelectorProps) {
  const t = useTranslations();
  // Group surveys by category
  const opticalSurveys = SKY_SURVEYS.filter((s) => s.category === 'optical');
  const infraredSurveys = SKY_SURVEYS.filter((s) => s.category === 'infrared');
  const otherSurveys = SKY_SURVEYS.filter((s) => s.category === 'other');

  const selectedSurvey = SKY_SURVEYS.find((s) => s.id === surveyId);

  return (
    <div className="space-y-4">
      {/* Survey Enable Toggle */}
      <div className="flex items-center justify-between bg-muted/50 border border-border p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-primary" />
          <Label htmlFor="survey-enabled" className="text-foreground cursor-pointer text-sm">
            {t('settings.skySurveyOverlay')}
          </Label>
        </div>
        <Switch
          id="survey-enabled"
          checked={surveyEnabled}
          onCheckedChange={onSurveyToggle}
        />
      </div>

      {/* Survey Selector */}
      {surveyEnabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Telescope className="h-4 w-4" />
            <span>{t('settings.selectSurvey')}</span>
          </div>
          <Select value={surveyId} onValueChange={onSurveyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a survey" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {/* Optical Surveys */}
              <SelectGroup>
                <SelectLabel className="text-primary font-semibold">
                  {t('settings.opticalSurveys')}
                </SelectLabel>
                {opticalSurveys.map((survey) => (
                  <SelectItem
                    key={survey.id}
                    value={survey.id}
                    className=""
                  >
                    <div className="flex flex-col items-start">
                      <span>{survey.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>

              {/* Infrared Surveys */}
              <SelectGroup>
                <SelectLabel className="text-secondary font-semibold">
                  {t('settings.infraredSurveys')}
                </SelectLabel>
                {infraredSurveys.map((survey) => (
                  <SelectItem
                    key={survey.id}
                    value={survey.id}
                    className=""
                  >
                    <div className="flex flex-col items-start">
                      <span>{survey.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>

              {/* Other Surveys */}
              <SelectGroup>
                <SelectLabel className="text-accent-foreground font-semibold">
                  {t('settings.otherWavelengths')}
                </SelectLabel>
                {otherSurveys.map((survey) => (
                  <SelectItem
                    key={survey.id}
                    value={survey.id}
                    className=""
                  >
                    <div className="flex flex-col items-start">
                      <span>{survey.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Survey Description */}
          {selectedSurvey && (
            <p className="text-xs text-muted-foreground px-1">{selectedSurvey.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
