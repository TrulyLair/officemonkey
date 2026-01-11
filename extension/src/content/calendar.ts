import { transformEventData, extractDefaultDate, getCalendarResources, formatEventTooltip } from '../utils/calendar';
import { waitForCondition, injectCSS, loadCSS } from '../utils/dom';
import type { CalendarEvent } from '../types';

// Add styles
injectCSS(`
  .width49pc { width: 49% }
  .left50pc { left: 50% }
`);

// Load FullCalendar CSS
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.10.0/fullcalendar.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/fullcalendar-scheduler/1.9.4/scheduler.css');

interface FullCalendar {
  fullCalendar(options: any): any;
  fullCalendar(method: string, ...args: any[]): any;
}

interface JQuery {
  (selector: string | Element): JQuery;
  fullCalendar(options: any): JQuery;
  fullCalendar(method: string, ...args: any[]): JQuery;
  cookie(name: string, value?: string): string | undefined;
  cookie(name: string, options: any): void;
  qtip(options: any): JQuery;
  qtip(method: string): any;
}

declare global {
  interface Window {
    $: JQuery;
    jQuery: JQuery;
    $j: JQuery;
    $y: JQuery;
    FullCalendar: any;
  }
}

let tooltip: any = null;

/**
 * Initialize the calendar script
 */
async function init(): Promise<void> {
  try {
    // Wait for jQuery to be available (both $ and $j from the site)
    // Use a check that won't be broken by minification
    // Increased timeout to 15 seconds to account for slow page loads
    const jqueryReady = await waitForCondition(() => {
      try {
        // Check if $ and $j exist and are functions/objects (not undefined)
        const win = window as any;
        const hasDollar = win.$ != null;
        const hasDollarJ = win.$j != null;
        
        // Debug logging (can be removed in production)
        if (!hasDollar || !hasDollarJ) {
          // Only log once per second to avoid spam
          const now = Date.now();
          if (!(window as any).__omLastJQueryCheck || now - (window as any).__omLastJQueryCheck > 1000) {
            (window as any).__omLastJQueryCheck = now;
            console.log('OfficeMonkey: Waiting for jQuery...', { has$: hasDollar, has$j: hasDollarJ });
          }
        }
        
        return hasDollar && hasDollarJ;
      } catch {
        return false;
      }
    }, 15000);

    if (!jqueryReady) {
      const win = window as any;
      console.error('OfficeMonkey: jQuery not available after timeout', {
        has$: win.$ != null,
        has$j: win.$j != null,
        hasjQuery: win.jQuery != null,
      });
      return;
    }

    // Wait for document ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          if (document.querySelector('#calendar') && document.querySelector('#graphicalView')) {
            performCalendarScript();
          }
        } catch (error) {
          console.error('OfficeMonkey: Error in calendar initialization:', error);
        }
      });
    } else {
      try {
        if (document.querySelector('#calendar') && document.querySelector('#graphicalView')) {
          performCalendarScript();
        }
      } catch (error) {
        console.error('OfficeMonkey: Error in calendar initialization:', error);
      }
    }
  } catch (error) {
    console.error('OfficeMonkey: Fatal error in calendar init:', error);
  }
}

/**
 * Perform the main calendar script setup
 */
function performCalendarScript(): void {
  try {
    // Use site's jQuery with noConflict
    if (!window.jQuery && !window.$) {
      console.error('OfficeMonkey: jQuery not available');
      return;
    }

    const $y = (window.jQuery || window.$).noConflict(true);
    window.$y = $y;

    // Create tooltip using site's $j (which has qtip2)
    tooltip = getTooltip($y);

    // Make the calendar
    makeCalendar($y, tooltip);
  } catch (error) {
    console.error('OfficeMonkey: Error in performCalendarScript:', error);
  }
}

/**
 * Get tooltip instance using qtip2
 */
function getTooltip($y: JQuery): any {
  // Use site's $j for qtip (it has qtip2 plugin)
  // Use a check that won't be broken by minification
  if (window.$j && window.$j.fn.qtip != null) {
    return window.$j('<div/>').qtip({
      id: 'calendar',
      prerender: true,
      content: {
        text: ' ',
        title: {
          button: true,
        },
      },
      position: {
        my: 'bottom center',
        at: 'top center',
        target: 'event',
        viewport: window.$j('#calendar'),
        adjust: {},
      },
      show: {
        delay: 500,
      },
      hide: {
        delay: 500,
        event: 'click mouseleave',
      },
      style: 'qtip-light qtip-shadow',
    }).qtip('api');
  }
  
  // Fallback: return a mock tooltip object
  return {
    hide: () => {},
    show: () => {},
    set: () => ({ show: () => {} }),
  };
}

/**
 * Create and initialize the FullCalendar
 */
function makeCalendar($y: JQuery, tooltip: any): void {
  // Delete the old calendar if it exists
  const calendarEl = document.querySelector('#calendar');
  const graphicalView = document.querySelector('#graphicalView');
  
  if (calendarEl) {
    calendarEl.remove();
  }
  
  if (graphicalView) {
    graphicalView.className = '';
    const newCalendar = document.createElement('div');
    newCalendar.id = 'calendar';
    graphicalView.appendChild(newCalendar);
  }

  // Map booking hrefs to booking elements for buffer alignments
  const bookingUrlMap = new Map<string, HTMLElement>();

  // Get default date
  const defaultDate = extractDefaultDate() || new Date().toISOString().split('T')[0];

  // Get saved preferences
  chrome.storage.local.get(['ApptCal_useView', 'ApptCal_defaultDate'], (result) => {
    try {
      const savedView = result.ApptCal_useView || 'agendaDay';
      const savedDate = result.ApptCal_defaultDate || defaultDate;

      // Initialize FullCalendar
      // Use a check that won't be broken by minification
      if ($y.fn.fullCalendar == null) {
        console.error('OfficeMonkey: FullCalendar not loaded');
        return;
      }

    $y('#calendar').fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay',
      },
      titleFormat: 'dddd D MMMM YYYY',
      themeSystem: 'jquery-ui',
      defaultDate: savedDate,
      defaultView: savedView,
      slotEventOverlap: false,
      nowIndicator: true,
      minTime: '09:00:00',
      maxTime: '20:00:00',
      editable: false,
      selectable: true,
      selectHelper: true,
      select: function(start: any, end: any, jsEvent: any, view: any) {
        tooltip.hide();
        if (view.name === 'month') {
          $y('#calendar').fullCalendar('changeView', 'agendaDay');
          $y('#calendar').fullCalendar('gotoDate', start);
        } else {
          const allDay = !start.hasTime();
          const dateStr = start.format();
          window.location.href = `AddAppt.php?ttab=AP&btab=3&dt=${dateStr}&allDay=${allDay}`;
        }
      },
      viewRender: function(view: any, element: any) {
        tooltip.hide();
        // Save view preference
        chrome.storage.local.set({ ApptCal_useView: view.name });
        const moment = $y('#calendar').fullCalendar('getDate');
        const dateStr = moment.format('YYYY-MM-DD');
        chrome.storage.local.set({ ApptCal_defaultDate: dateStr });
      },
      eventMouseout: function(event: any, jsEvent: any, view: any) {
        tooltip.hide();
      },
      eventMouseover: function(event: any, jsEvent: any, view: any) {
        const content = formatEventTooltip(event);
        
        tooltip.set({
          'content.text': content,
        }).show(jsEvent);
      },
      eventDataTransform: function(e: any) {
        const transformed = transformEventData(e as CalendarEvent);
        return transformed || e;
      },
      eventAfterRender: function(e: any, el: any, view: any) {
        if (!e.isBuffer && !el[0].classList.contains('hidden')) {
          // Capture booking event elements by href
          if (el[0].href) {
            bookingUrlMap.set(el[0].href, el[0]);
          }
        }
      },
      eventAfterAllRender: function(view: any) {
        // Align buffer events with their booking events (if buffers are enabled)
        const bufferEvents = document.querySelectorAll('.bufferEvent');
        bufferEvents.forEach((bufferEl) => {
          const href = (bufferEl as HTMLElement).getAttribute('href');
          if (href && bookingUrlMap.has(href)) {
            const parentEl = bookingUrlMap.get(href);
            if (parentEl) {
              (bufferEl as HTMLElement).style.left = parentEl.style.left;
            }
          }
        });
      },
      eventSources: [
        {
          url: 'json/schedule/calendar.php',
          error: function() {
            const scheduleOverview = document.querySelector('#ScheduleOverviewTile');
            if (scheduleOverview) {
              scheduleOverview.innerHTML = '<p>Unable to get Appointments.</p>';
            }
          },
        },
      ],
      resources: getCalendarResources(),
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    });
    } catch (error) {
      console.error('OfficeMonkey: Error initializing FullCalendar:', error);
    }
  });
}

// Start initialization
init().catch(console.error);
