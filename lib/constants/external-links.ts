/**
 * Canonical external links used across landing, docs and in-app about/feedback flows.
 */

export interface NewIssueUrlParams {
  template?: string;
  title?: string;
  body?: string;
  labels?: string[] | string;
}

const REPOSITORY_URL = 'https://github.com/AstroAir/skymap-test';

function normalizeLabels(labels?: string[] | string): string | undefined {
  if (!labels) return undefined;
  if (Array.isArray(labels)) {
    return labels
      .map((label) => label.trim())
      .filter(Boolean)
      .join(',');
  }
  const normalized = labels.trim();
  return normalized || undefined;
}

function buildNewIssueUrl(params?: NewIssueUrlParams): string {
  const url = new URL(`${REPOSITORY_URL}/issues/new`);
  if (!params) {
    return url.toString();
  }
  if (params.template) {
    url.searchParams.set('template', params.template);
  }
  if (params.title) {
    url.searchParams.set('title', params.title);
  }
  if (params.body) {
    url.searchParams.set('body', params.body);
  }
  const labels = normalizeLabels(params.labels);
  if (labels) {
    url.searchParams.set('labels', labels);
  }
  return url.toString();
}

export const EXTERNAL_LINKS = {
  repository: REPOSITORY_URL,
  issues: `${REPOSITORY_URL}/issues`,
  discussions: `${REPOSITORY_URL}/discussions`,
  wiki: `${REPOSITORY_URL}/wiki`,
  releases: `${REPOSITORY_URL}/releases`,
  newIssueUrl: buildNewIssueUrl,
} as const;

