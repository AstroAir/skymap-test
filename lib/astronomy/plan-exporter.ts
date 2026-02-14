/**
 * Session plan export utilities
 * Supports: Plain text, Markdown, JSON, NINA Simple Sequence XML
 */

import type { SessionPlan, ScheduledTarget } from '@/types/starmap/planning';
import { formatTimeShort, formatDuration } from './astro-utils';
import { degreesToHMS, degreesToDMS } from './starmap-utils';

// ============================================================================
// Export Formats
// ============================================================================

export type PlanExportFormat = 'text' | 'markdown' | 'json' | 'nina-xml';

export interface PlanExportOptions {
  format: PlanExportFormat;
  planDate: Date;
  locationName?: string;
  latitude: number;
  longitude: number;
}

// ============================================================================
// Plain Text Export
// ============================================================================

function exportAsText(plan: SessionPlan, options: PlanExportOptions): string {
  const dateStr = options.planDate.toLocaleDateString();
  const lines: string[] = [
    `Session Plan - ${dateStr}`,
    '='.repeat(40),
    `Targets: ${plan.targets.length}`,
    `Total Time: ${formatDuration(plan.totalImagingTime)}`,
    `Coverage: ${plan.nightCoverage.toFixed(0)}%`,
    `Efficiency: ${plan.efficiency.toFixed(0)}%`,
    `Location: ${options.latitude.toFixed(4)}°, ${options.longitude.toFixed(4)}°`,
    '',
  ];

  for (const scheduled of plan.targets) {
    lines.push(
      `${scheduled.order}. ${scheduled.target.name}`,
      `   ${formatTimeShort(scheduled.startTime)} - ${formatTimeShort(scheduled.endTime)} (${formatDuration(scheduled.duration)})`,
      `   RA: ${degreesToHMS(scheduled.target.ra)} / Dec: ${degreesToDMS(scheduled.target.dec)}`,
      `   Max Alt: ${scheduled.maxAltitude.toFixed(0)}° | Moon: ${scheduled.moonDistance.toFixed(0)}° | Score: ${scheduled.feasibility.score}`,
      ''
    );
  }

  if (plan.gaps && plan.gaps.length > 0) {
    lines.push('Gaps:');
    for (const gap of plan.gaps) {
      lines.push(`  ${formatTimeShort(gap.start)} - ${formatTimeShort(gap.end)} (${formatDuration(gap.duration)})`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Markdown Export
// ============================================================================

function exportAsMarkdown(plan: SessionPlan, options: PlanExportOptions): string {
  const dateStr = options.planDate.toLocaleDateString();
  const lines: string[] = [
    `# Session Plan — ${dateStr}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Targets | ${plan.targets.length} |`,
    `| Total Imaging Time | ${formatDuration(plan.totalImagingTime)} |`,
    `| Night Coverage | ${plan.nightCoverage.toFixed(0)}% |`,
    `| Efficiency | ${plan.efficiency.toFixed(0)}% |`,
    `| Location | ${options.latitude.toFixed(4)}°, ${options.longitude.toFixed(4)}° |`,
    '',
    '## Schedule',
    '',
    '| # | Target | Time | Duration | Alt | Moon | Score |',
    '|---|--------|------|----------|-----|------|-------|',
  ];

  for (const s of plan.targets) {
    lines.push(
      `| ${s.order} | ${s.target.name} | ${formatTimeShort(s.startTime)}–${formatTimeShort(s.endTime)} | ${formatDuration(s.duration)} | ${s.maxAltitude.toFixed(0)}° | ${s.moonDistance.toFixed(0)}° | ${s.feasibility.score} |`
    );
  }

  if (plan.gaps && plan.gaps.length > 0) {
    lines.push('', '## Gaps', '');
    for (const gap of plan.gaps) {
      lines.push(`- ${formatTimeShort(gap.start)} – ${formatTimeShort(gap.end)} (${formatDuration(gap.duration)})`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// JSON Export
// ============================================================================

function exportAsJSON(plan: SessionPlan, options: PlanExportOptions): string {
  const exportData = {
    exportVersion: 1,
    exportDate: new Date().toISOString(),
    planDate: options.planDate.toISOString(),
    location: {
      name: options.locationName,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    summary: {
      targetCount: plan.targets.length,
      totalImagingTime: plan.totalImagingTime,
      nightCoverage: plan.nightCoverage,
      efficiency: plan.efficiency,
    },
    targets: plan.targets.map((s: ScheduledTarget) => ({
      name: s.target.name,
      ra: s.target.ra,
      dec: s.target.dec,
      raHMS: degreesToHMS(s.target.ra),
      decDMS: degreesToDMS(s.target.dec),
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      duration: s.duration,
      maxAltitude: s.maxAltitude,
      moonDistance: s.moonDistance,
      feasibilityScore: s.feasibility.score,
      feasibilityRec: s.feasibility.recommendation,
      order: s.order,
    })),
    gaps: (plan.gaps ?? []).map(g => ({
      start: g.start.toISOString(),
      end: g.end.toISOString(),
      duration: g.duration,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// NINA Simple Sequence XML Export
// ============================================================================

function exportAsNinaXml(plan: SessionPlan, options: PlanExportOptions): string {
  const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const lines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<!-- Exported from SkyMap Session Planner - ${options.planDate.toLocaleDateString()} -->`,
    '<CaptureSequenceList xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">',
    '  <Version>2.0.0.0</Version>',
    `  <SequencerItems>`,
  ];

  for (const s of plan.targets) {
    const raDeg = s.target.ra;
    const decDeg = s.target.dec;
    // NINA expects RA in hours
    const raHours = raDeg / 15;

    lines.push(
      `    <CaptureSequence>`,
      `      <Enabled>true</Enabled>`,
      `      <TargetName>${escXml(s.target.name)}</TargetName>`,
      `      <Coordinates>`,
      `        <RA>${raHours.toFixed(6)}</RA>`,
      `        <Dec>${decDeg.toFixed(6)}</Dec>`,
      `      </Coordinates>`,
      `      <ExposureTime>300</ExposureTime>`,
      `      <TotalExposureCount>-1</TotalExposureCount>`,
      `      <FilterType>L</FilterType>`,
      `      <Gain>-1</Gain>`,
      `      <Offset>-1</Offset>`,
      `      <Binning>`,
      `        <X>1</X>`,
      `        <Y>1</Y>`,
      `      </Binning>`,
      `    </CaptureSequence>`,
    );
  }

  lines.push(
    '  </SequencerItems>',
    '</CaptureSequenceList>'
  );

  return lines.join('\n');
}

// ============================================================================
// Public API
// ============================================================================

export function exportSessionPlan(plan: SessionPlan, options: PlanExportOptions): string {
  switch (options.format) {
    case 'text':
      return exportAsText(plan, options);
    case 'markdown':
      return exportAsMarkdown(plan, options);
    case 'json':
      return exportAsJSON(plan, options);
    case 'nina-xml':
      return exportAsNinaXml(plan, options);
    default:
      return exportAsText(plan, options);
  }
}

export function getExportFileExtension(format: PlanExportFormat): string {
  switch (format) {
    case 'text': return '.txt';
    case 'markdown': return '.md';
    case 'json': return '.json';
    case 'nina-xml': return '.xml';
    default: return '.txt';
  }
}

export function getExportMimeType(format: PlanExportFormat): string {
  switch (format) {
    case 'text': return 'text/plain';
    case 'markdown': return 'text/markdown';
    case 'json': return 'application/json';
    case 'nina-xml': return 'application/xml';
    default: return 'text/plain';
  }
}
