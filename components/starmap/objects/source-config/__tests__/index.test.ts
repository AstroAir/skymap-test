/**
 * @jest-environment jsdom
 */

import { StatusBadge, SourceItem, EditSourceDialog, AddCustomSourceDialog } from '../index';

describe('source-config/index barrel exports', () => {
  it('exports StatusBadge', () => {
    expect(StatusBadge).toBeDefined();
  });

  it('exports SourceItem', () => {
    expect(SourceItem).toBeDefined();
  });

  it('exports EditSourceDialog', () => {
    expect(EditSourceDialog).toBeDefined();
  });

  it('exports AddCustomSourceDialog', () => {
    expect(AddCustomSourceDialog).toBeDefined();
  });
});
