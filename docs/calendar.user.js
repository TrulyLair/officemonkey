// ==UserScript==
// @name        OfficeMonkey calendar
// @namespace   Violentmonkey Scripts
// @match       https://safeoffice.com/ApptCal.php*
// @grant       GM_addStyle
// @version     0.5.0
// @homepageURL https://trulylair.github.io/officemonkey/
// @downloadURL https://trulylair.github.io/officemonkey/calendar.user.js
// @author      -
// @description Updated at 2023-11-19 20:30:00 +0800
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/js-cookie/1.5.1/js.cookie.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.10.0/fullcalendar.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/fullcalendar-scheduler/1.9.4/scheduler.min.js
//
// ==/UserScript==

// Add 15 min buffer events after appointments?
const MAKE_BUFFERS = false;

function init(e) {
  // make sure we have the SO base jQuery loaded
  if (typeof $ === 'undefined' || typeof $j === 'undefined') {
    setTimeout(init, 200);
    return;
  }

  // add styles
  GM_addStyle(`.width49pc { width: 49% }`);
  GM_addStyle(`.left50pc { left: 50% }`);

  // we're here, we're ready, don't fuckin' stop us
  let $y = jQuery.noConflict();
  $y(document).ready(function() {
    if ($y('#calendar') && $y('#graphicalView')) {
      performCalendarScript($y);
    }
  });
}

function performCalendarScript($y) {
  loadCSS($y);
  let tooltip = getTooltip($y);
  let calendar = makeCalendar($y, tooltip);
}

function loadCSS($y) {
  $y("head").append('<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.10.0/fullcalendar.css"></link>');
  $y("head").append('<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar-scheduler/1.9.4/scheduler.css"></link>');
}

// Using SO's built-in version of qtip2. http://qtip2.com/options
function getTooltip() {
  return $j('<div/>').qtip({ // use SO's $j jQuery
        id: 'calendar',
        prerender: true,
        content: {
          text: ' ',
          title: {
              button:true
          }
        },
        position: {
          my: 'bottom center',
          at: 'top center',
          target: 'event',
          viewport: $j('#calendar'),
          adjust: {
              //mouse: false,
              //scroll: false
          }
        },
        show: {
          delay: 500
        },
        hide: {
          delay: 500,
          event: 'click mouseleave'
        },
        style: 'qtip-light qtip-shadow'
    }).qtip('api');
}

function makeCalendar($y, tooltip) {
  // delete the old one
  $y("#calendar").remove();
  $y("#graphicalView").removeClass().append("<div id='calendar'></div>")

  // map booking hrefs to booking elements, for buffer alignments
  let bookingUrlMap = new Map();

  // and create the new one
  let calendar = $y('#calendar').fullCalendar({
      header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,agendaWeek,agendaDay'
      },
      titleFormat: 'dddd D MMMM YYYY',
      themeSystem: 'jquery-ui',
      defaultDate: $y("#oldView h2").text().strip().substr(9,10),
      defaultView: 'agendaDay',
      slotEventOverlap: false,
      nowIndicator: true,
      minTime: '09:00:00',
      maxTime: '20:00:00',
      editable: false,
      selectable: true,
      selectHelper: true,
      select: function(start, end, jsEvent, view) {
        tooltip.hide();
        if (view.name == 'month') {
            $y('#calendar').fullCalendar('changeView', 'agendaDay');
            $y('#calendar').fullCalendar('gotoDate', start);
        } else {
            let allDay = !start.hasTime();
            document.location = 'AddAppt.php?ttab=AP&btab=3&dt='+start.format()+'&allDay='+allDay;
        }
      },
      viewRender: function(view, element) {
        tooltip.hide();
        $y.cookie('ApptCal_useView', view.name);
        let moment = $y('#calendar').fullCalendar('getDate');
        $y.cookie('ApptCal_defaultDate', moment.format('YYYY-MM-DD'));
      },
      eventMouseout: function(event, jsEvent, view) {
        tooltip.hide();
      },
      eventMouseover: function(event, jsEvent, view) {
        let content = '<h3>'+event.tipTitle+'</h3>' +
            '<p>' + event.tipText + '</p>' +
            '<p><b>Start:</b> '+event.start.format('YYYY-MM-DD h:mm a')+'<br />' +
            (event.end && '<p><b>End:</b> '+event.end.format('YYYY-MM-DD h:mm a')+'</p>' || '');

        tooltip.set({
            'content.text': content
        })
        //.reposition(event)
        .show(jsEvent);
      },
      eventDataTransform: function(e) {
        // don't show canceled events
        // unfortunately, the easiest way to check is by color
        if (e.color === "#990000" || e.color === "#FF0000" || e.color === "#CC0000") {
            e.className = "hidden";
            return e;
        }
        // pull out the house name from the event title
        let types = e.title.split(" ");
        if (!e.resourceId) {
          e.resourceId = types.shift().toLowerCase();
        }
        e.title = types.join(" ");
        e.borderColor = e.color;
        delete e.color;
        e.overlap = false;
        if (!e.className) e.className = ["width49pc"];

        // CURRENTLY DISABLED:
        // Create buffer events that go immediately after each proper event
        if (MAKE_BUFFERS && !e.isBuffer && e.className != "hidden") {
          let endPlus15 = moment(e.end).add(15, 'minutes').toDate();
          let be = {
            isBuffer: true,
            resourceId: e.resourceId,
            title: "Buffer 15",
            color: "#00AA00",
            backgroundColor: "#00AA00",
            className: ["width49pc", "bufferEvent"],
            url: e.url,
            start: e.end,
            end: endPlus15
          };

          // check if parent event is on the right side of its column
          if (el[0].style.left == "50%") {
            be.className = ["width49pc", "left50pc"];
          }

          $y('#calendar').fullCalendar('addEventSource', function(start, end, tz, callback) {
            console.log("adding buffer event source", be, e);
            callback([be]);
          });
        }

        return e;
      },

      // use this to create buffer events and align each under its parent event
      eventAfterRender: function(e, el, view) {
        if (!e.isBuffer && !el[0].classList.contains("hidden")) {
            // capture booking event elements by href
            console.log("Non-buffer event", e, el);
            bookingUrlMap.set(el[0].href, el[0]);
        }
      },
      eventAfterAllRender: function(view) {
        // align all buffer events with their booking events
        $y(".bufferEvent").each(function(i) {
          this.style.left = bookingUrlMap.get(this.href).style.left;
        });
      },
      eventSources: [
        {
          url: 'json/schedule/calendar.php',
          error: function() {
              $y("#ScheduleOverviewTile").html('<p>Unable to get Appointments.</p>');
          }
        }
      ],
      resources: [
        {id: 'lake', title:'Lake House'},
        {id: 'temescal', title:'Temescal House'}
      ],
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source'
    }
  );

  return calendar;
}

init();
