/**
 * About Dialog - Type Definitions
 *
 * Shared types for application metadata, licenses, dependencies, and data credits
 * used in the About dialog and related components.
 */

export interface AppInfo {
  name: string;
  version: string;
  repository: string;
  author: string;
}

export interface LicenseInfo {
  name: string;
  license: string;
  url: string;
  descriptionKey: string;
}

export type DependencySource = 'npm' | 'cargo';

export type DependencyRuntime = 'shared' | 'desktop';

export interface DependencyInfo {
  name: string;
  version: string;
  type: string;
  source: DependencySource;
  runtime: DependencyRuntime;
  manifestSection: string;
}

export interface DependencyGroup {
  runtime: DependencyRuntime;
  items: DependencyInfo[];
}

export interface DataCreditInfo {
  nameKey: string;
  source: string;
  url: string;
}
