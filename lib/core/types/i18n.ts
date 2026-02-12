/**
 * I18n utility types used across planning and astronomy modules
 */

export interface I18nMessage {
  key: string;
  params?: Record<string, string | number>;
}
