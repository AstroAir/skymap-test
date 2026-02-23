/**
 * Tests for external-links.ts
 * Repository URL builder and link constants
 */

import { EXTERNAL_LINKS } from '../external-links';

describe('EXTERNAL_LINKS', () => {
  it('should have repository URL', () => {
    expect(EXTERNAL_LINKS.repository).toContain('github.com');
  });

  it('should have issues URL', () => {
    expect(EXTERNAL_LINKS.issues).toContain('/issues');
  });

  it('should have discussions URL', () => {
    expect(EXTERNAL_LINKS.discussions).toContain('/discussions');
  });

  it('should build a new issue URL without params', () => {
    const url = EXTERNAL_LINKS.newIssueUrl();
    expect(url).toContain('/issues/new');
  });

  it('should build a new issue URL with template', () => {
    const url = EXTERNAL_LINKS.newIssueUrl({ template: 'bug_report.yml' });
    expect(url).toContain('template=bug_report.yml');
  });

  it('should build a new issue URL with labels', () => {
    const url = EXTERNAL_LINKS.newIssueUrl({ labels: ['bug', 'priority'] });
    expect(url).toContain('labels=bug');
  });
});
