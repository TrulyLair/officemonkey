// Calendar types
export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  resourceId?: string;
  color?: string;
  borderColor?: string;
  className?: string | string[];
  url?: string;
  tipTitle?: string;
  tipText?: string;
  isBuffer?: boolean;
  overlap?: boolean;
}

export interface CalendarResource {
  id: string;
  title: string;
}

// Contact types
export interface Note {
  id: string;
  date: string;
  subject: string;
  body: string;
  element: HTMLElement;
}

export interface SearchParams {
  field: string;
  value: string;
}

export interface EventDetails {
  type: string;
  date: string;
  day: string;
  time: string;
  duration: string;
  status: string;
  extension: string;
  booked: string;
}

// Storage types
export interface StoragePreferences {
  ApptCal_useView?: string;
  ApptCal_defaultDate?: string;
}
