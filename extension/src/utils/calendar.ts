import type { CalendarEvent } from '../types';

/**
 * Filters out canceled events based on their color
 * Canceled events have colors: #990000, #FF0000, or #CC0000
 */
export function isCanceledEvent(event: CalendarEvent): boolean {
  const canceledColors = ['#990000', '#FF0000', '#CC0000'];
  return event.color ? canceledColors.includes(event.color) : false;
}

/**
 * Transforms event data for FullCalendar display
 * - Filters canceled events
 * - Extracts house name from title and sets as resourceId
 * - Sets borderColor from color and removes color
 * - Sets default className and overlap properties
 */
export function transformEventData(event: CalendarEvent): CalendarEvent | null {
  // Don't show canceled events
  if (isCanceledEvent(event)) {
    return {
      ...event,
      className: 'hidden',
    };
  }

  const transformed: CalendarEvent = { ...event };

  // Extract house name from title and set as resourceId
  if (!transformed.resourceId && transformed.title) {
    const types = transformed.title.split(' ');
    if (types.length > 0) {
      transformed.resourceId = types[0].toLowerCase();
      transformed.title = types.slice(1).join(' ');
    }
  }

  // Set borderColor from color and remove color
  if (transformed.color) {
    transformed.borderColor = transformed.color;
    delete transformed.color;
  }

  // Set default properties
  transformed.overlap = false;
  if (!transformed.className) {
    transformed.className = ['width49pc'];
  } else if (typeof transformed.className === 'string') {
    transformed.className = [transformed.className, 'width49pc'];
  } else {
    transformed.className = [...transformed.className, 'width49pc'];
  }

  return transformed;
}

/**
 * Extracts the default date from the oldView h2 element
 * Format: "Appointments for YYYY-MM-DD"
 */
export function extractDefaultDate(): string | null {
  const h2 = document.querySelector('#oldView h2');
  if (!h2) return null;

  const text = h2.textContent || '';
  const match = text.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Gets calendar resources (houses)
 */
export function getCalendarResources() {
  return [
    { id: 'lake', title: 'Lake House' },
    { id: 'temescal', title: 'Temescal House' },
  ];
}

/**
 * Formats event details for tooltip display
 */
export function formatEventTooltip(event: CalendarEvent): string {
  const parts: string[] = [];

  if (event.tipTitle) {
    parts.push(`<h3>${event.tipTitle}</h3>`);
  }

  if (event.tipText) {
    parts.push(`<p>${event.tipText}</p>`);
  }

  if (event.start) {
    const startDate = typeof event.start === 'string' 
      ? new Date(event.start) 
      : event.start;
    const startStr = startDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    parts.push(`<p><b>Start:</b> ${startStr}</p>`);
  }

  if (event.end) {
    const endDate = typeof event.end === 'string' 
      ? new Date(event.end) 
      : event.end;
    const endStr = endDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    parts.push(`<p><b>End:</b> ${endStr}</p>`);
  }

  return parts.join('');
}
