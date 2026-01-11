import type { Note, EventDetails, SearchParams } from '../types';

/**
 * Sorts notes by date with newest first
 * Notes with the same date maintain relative order (flip behavior)
 */
export function sortNotes(notes: NodeListOf<Element> | Element[]): void {
  const notesArray = Array.from(notes);
  
  notesArray.sort((a, b) => {
    const dateA = a.querySelector('.OneContactNoteDate')?.textContent?.trim() || '';
    const dateB = b.querySelector('.OneContactNoteDate')?.textContent?.trim() || '';
    
    if (dateA === dateB) {
      // Flip behavior: when dates are the same, reverse order
      return 1;
    }
    
    // Compare dates (newest first)
    return dateB.localeCompare(dateA);
  });
  
  // Re-append in sorted order
  const parent = notesArray[0]?.parentNode;
  if (parent) {
    notesArray.forEach(note => {
      parent.appendChild(note);
    });
  }
}

/**
 * Determines the search field type from the input value
 */
export function determineSearchField(value: string): string {
  if (value.match(/[a-zA-Z@]/)) {
    return 'email0email_addr';
  }
  if (value.match(/^\.\d+/)) {
    return 'contact0sub_id';
  }
  return 'phone0full_phone';
}

/**
 * Formats the search value based on field type
 */
export function formatSearchValue(value: string, field: string): string {
  if (field === 'phone0full_phone' || field === 'contact0sub_id') {
    return value.replace(/[^0-9]/g, '');
  }
  return value;
}

/**
 * Builds the search URL based on field and value
 */
export function buildSearchURL(field: string, value: string): string {
  const formattedValue = formatSearchValue(value, field);
  
  if (field === 'contact0sub_id') {
    // Contact ID search uses advanced search
    const params = new URLSearchParams({
      Field1: 'contact0sub_id',
      Data1: formattedValue,
      Exact1: 'on',
      bool: 'AND',
      Submitted: '1',
      SearchType: 'ADVANCED',
      ct: 'ALL_CONTACT',
      bo: '',
      alfield: field,
    });
    return `https://safeoffice.com/SearchContact.php?${params.toString()}`;
  } else {
    // Phone and email search use quick search
    const params = new URLSearchParams({
      [field]: formattedValue,
      ChangeEntity: 'ALL_CONTACT',
      Submitted: '1',
      SearchType: 'QUICK',
      ct: 'ALL_CONTACT',
      bo: '',
      ho: '',
      ro: '',
      fs: '',
      ma: '',
      mfc: '',
      alfield: field,
    });
    return `https://safeoffice.com/SearchContact.php?${params.toString()}`;
  }
}

/**
 * Filters phone number search results to only show numbers ending with query digits
 */
export function filterPhoneResults(digits: string): void {
  const rows = document.querySelectorAll('tr.RowOdd, tr.RowEven');
  
  rows.forEach(row => {
    const phoneSpans = row.querySelectorAll("span[id^='Areacode']");
    const hasMatchingPhone = Array.from(phoneSpans).some(span => {
      const phoneText = span.textContent?.replace(/[\/-]/gi, '') || '';
      return phoneText.endsWith(digits);
    });
    
    if (!hasMatchingPhone) {
      row.remove();
    }
  });
}

/**
 * Formats event details for email clipboard
 */
export function formatEventDetails(eventDetails: EventDetails): [string, string] {
  const { type, date, day, time, duration, status, extension, booked } = eventDetails;
  
  // Validate status
  if (status !== 'Same Day' && status !== 'Unconfirmed') {
    const confirmed = window.confirm(
      `Looks like this event isn't in a 'Same Day' or 'Unconfirmed' status - I see ${status}. Want to continue anyway?`
    );
    if (!confirmed) {
      throw new Error('User clicked Cancel on wrong status');
    }
  }
  
  // Validate date is not in the past
  const eventDateTime = new Date(`${date} ${time}`);
  if (eventDateTime < new Date()) {
    const confirmed = window.confirm(
      `Looks like this event is in the past (I see ${date} ${time}). Want to continue anyway?`
    );
    if (!confirmed) {
      throw new Error(`User clicked Cancel on past date`);
    }
  }
  
  // Extract location from type
  const loc = type.split(/\s+/)[0]; // "Lake" or "Temescal"
  const locationName: Record<string, string> = {
    'Lake': 'Lake House, Emeryville',
    'Temescal': 'Temescal House, Oakland',
  };
  
  const subject = `${loc} House arrival protocol`;
  const provider = extension.replace(' Lairette', '');
  const rate = booked.replace('$', '');
  
  const htmlBlock = `Appointment with: ${provider}<br>
Date: ${day} ${date}<br>
Time: ${time}<br>
Length: ${duration} hr<br>
Type of Service: ${type}<br>
Location: ${locationName[loc] || type}<br>
Rate: ${rate}<br>
`;
  
  return [htmlBlock, subject];
}

/**
 * Calculates amount collected (22.5% of amount booked)
 */
export function calculateAmountCollected(amountBooked: number): string {
  const collectFraction = 0.225;
  return (amountBooked * collectFraction).toFixed(2);
}

/**
 * Gets field description for search display
 */
export function getFieldDescription(field: string): string {
  const fieldDescs: Record<string, string> = {
    'email0email_addr': 'email address',
    'contact0sub_id': 'contact ID',
    'phone0full_phone': 'phone number',
  };
  return fieldDescs[field] || field;
}
