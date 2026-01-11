import {
  sortNotes,
  determineSearchField,
  buildSearchURL,
  filterPhoneResults,
  formatEventDetails,
  calculateAmountCollected,
  getFieldDescription,
} from '../utils/contact';
import { injectCSS } from '../utils/dom';
import type { EventDetails } from '../types';

// Configuration
const AUTO_CLICK_SINGLE_RESULT = false;

// Add useful styles
injectCSS(`
  .hoverHighlight {background-color: yellow; cursor: pointer}
  #topALSearch {position: absolute; background-color: white; border: 2px; padding: 20px; top: 10px; z-index: 10002; display: none}
  #topALSearch input[type='text'] { border: 2px; font-size: 36pt; padding: 20px; }
`);

/**
 * Initialize the contact script
 */
function init(): void {
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          performInitialization();
        } catch (error) {
          console.error('OfficeMonkey: Error in contact initialization:', error);
        }
      });
    } else {
      performInitialization();
    }
  } catch (error) {
    console.error('OfficeMonkey: Fatal error in contact init:', error);
  }
}

/**
 * Perform all contact page enhancements
 */
function performInitialization(): void {
  try {
    // Are there notes on the page?
    const noteContainer = document.querySelector('#Note_contact');
    if (noteContainer) {
      try {
        const notes = document.querySelectorAll('div[id^="note_"]');
        if (notes.length > 0) {
          performNoteSort(notes);
          hoverNotes(notes);
        }
      } catch (error) {
        console.error('OfficeMonkey: Error processing notes:', error);
      }
    }

    // Table fixes
    try {
      hoverTableRows();
    } catch (error) {
      console.error('OfficeMonkey: Error setting up table hover:', error);
    }

    // Contact page: clickable email addresses that open GMail
    try {
      addGMailClickListeners();
    } catch (error) {
      console.error('OfficeMonkey: Error setting up Gmail integration:', error);
    }

    // Set up TopSearch
    try {
      createTopSearch();
    } catch (error) {
      console.error('OfficeMonkey: Error setting up TopSearch:', error);
    }

    // Contact page: Move the new note space to the right place
    try {
      moveNewNote();
    } catch (error) {
      console.error('OfficeMonkey: Error moving new note form:', error);
    }

    // Search results: show search details
    try {
      showSearchDetails();
    } catch (error) {
      console.error('OfficeMonkey: Error showing search details:', error);
    }

    // Auto-calculate amount collected from events
    try {
      setupAmtCollectedCalculator();
    } catch (error) {
      console.error('OfficeMonkey: Error setting up amount calculator:', error);
    }
  } catch (error) {
    console.error('OfficeMonkey: Error in performInitialization:', error);
  }
}

/**
 * Sort notes by date (newest first)
 */
function performNoteSort(notes: NodeListOf<Element>): void {
  sortNotes(notes);
}

/**
 * Add hover effects and click handlers to notes
 */
function hoverNotes(notes: NodeListOf<Element>): void {
  notes.forEach(note => {
    const noteLeft = note.querySelector('.OneLinerNoteLeft');
    if (!noteLeft) return;

    noteLeft.addEventListener('mouseenter', () => {
      noteLeft.classList.add('hoverHighlight');
    });

    noteLeft.addEventListener('mouseleave', () => {
      noteLeft.classList.remove('hoverHighlight');
    });

    noteLeft.addEventListener('click', () => {
      // Find the first link in the note
      const anchor = noteLeft.querySelector('td:first-of-type a') as HTMLAnchorElement ||
                     noteLeft.querySelector('div.OneView a') as HTMLAnchorElement;
      
      if (anchor) {
        anchor.click();
      }
    });
  });
}

/**
 * Add hover effects and click handlers to table rows
 * This DOESN'T include Notes; those are handled by hoverNotes()
 */
function hoverTableRows(): void {
  const rows = document.querySelectorAll('tr.RowOdd, tr.RowEven, .OneLinerLeft');
  
  rows.forEach(row => {
    row.addEventListener('mouseover', () => {
      row.classList.add('hoverHighlight');
    });

    row.addEventListener('mouseout', () => {
      row.classList.remove('hoverHighlight');
    });

    row.addEventListener('click', () => {
      // Find the first link in the row
      const anchor = (row.querySelector('td:first-of-type a') as HTMLAnchorElement) ||
                     (row.querySelector('div.OneView a') as HTMLAnchorElement);
      
      if (anchor) {
        anchor.click();
      }
    });
  });
}

/**
 * Create and set up the TopSearch functionality
 */
function createTopSearch(): void {
  // Create search box
  const searchBox = document.createElement('div');
  searchBox.id = 'topALSearch';
  const input = document.createElement('input');
  input.type = 'text';
  searchBox.appendChild(input);
  document.body.prepend(searchBox);

  // Keyboard event listener
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Slash') {
      // Check if the user is typing in an input
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }

      e.preventDefault();
      searchBox.style.display = 'block';
      input.focus();
      return;
    }

    if (e.code === 'Enter' && document.activeElement === input) {
      fireTopSearch(input.value);
    }
  });
}

/**
 * Execute the top search
 */
function fireTopSearch(value: string): void {
  if (!value) return;

  const field = determineSearchField(value);
  const url = buildSearchURL(field, value);
  window.location.href = url;
}

/**
 * Move the new note form to the top of the note list
 */
function moveNewNote(): void {
  const newNote = document.querySelector('#NewNote_contact');
  const noteContainer = document.querySelector('#Note_contact');
  
  if (newNote && noteContainer) {
    noteContainer.prepend(newNote);
  }
}

/**
 * Show search details on search results page
 */
function showSearchDetails(): void {
  if (window.location.pathname !== '/SearchContact.php') return;

  const params = new URLSearchParams(window.location.search);
  const fieldUsed = params.get('alfield');
  if (!fieldUsed) return;

  const fieldValue = params.get(fieldUsed);
  if (!fieldValue) return;

  // Filter phone results if it's a phone search
  if (fieldUsed === 'phone0full_phone') {
    filterPhoneResults(fieldValue);
  }

  // Auto-click single result if enabled
  if (AUTO_CLICK_SINGLE_RESULT) {
    const alResults = document.querySelectorAll('div#Report:first-of-type tr');
    if (alResults.length === 2) { // header row + one result
      const firstLink = alResults[1]?.querySelector('td a') as HTMLAnchorElement;
      if (firstLink) {
        firstLink.click();
        return;
      }
    }
  }

  // Display search description
  const fieldDesc = getFieldDescription(fieldUsed);
  const searchDesc = document.createElement('h3');
  searchDesc.innerHTML = `TopSearch for <b>${fieldDesc}</b> containing <b><code>"${fieldValue}"</code></b>`;
  
  const h2 = document.querySelector('td h2');
  if (h2 && h2.parentElement) {
    h2.parentElement.insertBefore(searchDesc, h2.nextSibling);
  }
}

/**
 * Set up the amount collected calculator
 */
function setupAmtCollectedCalculator(): void {
  const collectFraction = 0.225;
  const amtBookedInput = document.querySelector('#fees_amt_booked input') as HTMLInputElement;
  
  if (!amtBookedInput) return;

  const amtCollectedInput = document.querySelector('#fees_amt_collected input') as HTMLInputElement;
  const outputSpan = document.querySelector('#fees_amt_collected span.Loud');
  
  if (!amtCollectedInput || !outputSpan) return;

  // Create button
  const calcButton = document.createElement('button');
  calcButton.type = 'button';
  outputSpan.style.display = 'inline';
  outputSpan.appendChild(calcButton);

  let amtCollected: string | null = null;

  // Button click handler
  calcButton.addEventListener('click', () => {
    if (amtCollected !== null && amtCollectedInput) {
      amtCollectedInput.value = amtCollected;
    }
  });

  // Input change handler
  amtBookedInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const amtStr = target.value;
    
    if (!isNaN(Number(amtStr)) && amtStr !== '') {
      const amt = parseFloat(amtStr);
      amtCollected = calculateAmountCollected(amt);
      calcButton.textContent = `Enter ${amtCollected}`;
    } else {
      calcButton.textContent = '';
      amtCollected = null;
    }
  });
}

/**
 * Add Gmail click listeners to email addresses
 */
function addGMailClickListeners(): void {
  const emailLinks = document.querySelectorAll('div.OneContactEmailAddr a:not(.NoCall a)');
  
  emailLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const addr = link.textContent?.trim() || '';
      if (!addr) return;

      try {
        // Get event details from the page
        const eventDetails = extractEventDetails();
        if (!eventDetails) return;

        const [detailsBlock, subject] = formatEventDetails(eventDetails);

        // Copy to clipboard
        await navigator.clipboard.writeText(detailsBlock.replace(/<br>/g, '\n'));

        // Show alert
        window.alert('I built and copied the details block for you. Now opening the email so you can paste it in...');

        // Open Gmail
        const encodedSubject = encodeURIComponent(subject);
        const encodedTo = encodeURIComponent(addr);
        const url = `http://mail.google.com/a/amys-lair.com/mail?view=cm&su=${encodedSubject}&to=${encodedTo}`;
        
        chrome.tabs.create({ url, active: true });
      } catch (error) {
        console.error('Error in Gmail integration:', error);
        if (error instanceof Error && error.message.includes('Cancel')) {
          // User canceled, do nothing
          return;
        }
        window.alert('Error preparing email. Please check the console for details.');
      }
    });
  });
}

/**
 * Extract event details from the contact page
 */
function extractEventDetails(): EventDetails | null {
  const reportTable = document.querySelector('#Report table');
  if (!reportTable) return null;

  const secondRow = reportTable.querySelector('tr:nth-child(2)');
  if (!secondRow) return null;

  const cells = Array.from(secondRow.querySelectorAll('td')).map(cell => 
    cell.textContent?.trim() || ''
  );

  if (cells.length < 11) return null;

  // Map cells to event details
  // Based on the original script: [, type, date, day, time, dur, , , status, , ext, booked]
  const [, type, date, day, time, dur, , , status, , ext, booked] = cells;

  return {
    type: type || '',
    date: date || '',
    day: day || '',
    time: time || '',
    duration: dur || '',
    status: status || '',
    extension: ext || '',
    booked: booked || '',
  };
}

// Start initialization
init();
