// ==UserScript==
// @name        OfficeNonkey contact script
// @namespace   Violentmonkey Scripts
// @match       https://safeoffice.com/*
// @grant       GM.addStyle
// @grant       GM.setClipboard
// @grant       GM.openInTab
// @version     0.4.0
// @author      -
// @description Updated at 2023-11-19 20:30:00 +0800
// @homepageURL https://yozlet.gitlab.io/send-email-bookmarklet/
// @downloadURL https://yozlet.gitlab.io/send-email-bookmarklet/contact.user.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js
//
// ==/UserScript==

// Auto-click wasn't as wanted as I thought
const AUTO_CLICK_SINGLE_RESULT = false;

let $y = jQuery.noConflict();

function init(e) {
  // add useful styles

  // Highlight table rows on nouseover
  GM.addStyle(`.hoverHighlight {background-color: yellow; cursor: pointer}`);

  // Top Search box and text
  GM.addStyle(`#topALSearch {position: absolute; background-color: white; border: 2px; padding: 20px; top: 10px; z-index: 10002; display: none}`);
  GM.addStyle(`#topALSearch input[type='text'] { border: 2px; font-size: 36pt; padding: 20px; }`);

  // we're here, we're ready, don't fuckin' stop us
  $y(document).ready(function() {
    // are there notes on the page?
    if ($y('#Note_contact')) {
      const NOTES = $y('div[id^="note_"]');
      // sort notes by date
      performNoteSort(NOTES);
      hoverNotes(NOTES);
    }

    // table fixes
    hoverTableRows();

    // Contact page: clickable email addresses that open GMail
    addGMailClickListeners();

    // Set up TopSearch
    createTopSearch();

    // Contact page: Move the new note space to the right place
    moveNewNote();

    // Search results: show search details
    showSearchDetails();

    // Auto-calculate amount collected from events
    setupAmtCollectedCalculator();
  });
}

// Order rows in a table by a specific field
// http://jsfiddle.net/mindplay/H2mrp/ via https://stackoverflow.com/questions/3160277/jquery-table-sort#comment31473691_3160718
// Added flip boolean arg: if the two values are the same, reverse the order. See performNoteSort() for reasons.
jQuery.fn.order = function(asc, fn, flip) {
  fn = fn || function (el) {
      return $(el).text().replace(/^\s+|\s+$/g, '');
  };
  var T = asc !== false ? 1 : -1,
      F = asc !== false ? -1 : 1;
  this.sort(function (a, b) {
      a = fn(a), b = fn(b);
      if (a == b) return flip ? 1 : 0;
      return a < b ? F : T;
  });
  this.each(function (i) {
      this.parentNode.appendChild(this);
  });
};

// On pages with notes tables, order by newest at the top.
// Sorting by date alone isn't enough, since there may be multiple notes per day.
// Unfortunately, time isn't accessible until the note is opened.
// So, when comparing two notes with the same date, I just flip them instead - see
// the "flip" boolean arg for sort. Seems to work even with four notes on same day.
function performNoteSort(NOTES) {
  NOTES.order(false, function (el) {
    return $y(".OneContactNoteDate", el).text();
  }, true);
}

// All Notes rows should have hover effects and be easily clickable.
function hoverNotes(NOTES) {
  $y(".OneLinerNoteLeft", NOTES)
    // table rows should highlight when hovered.
      // NOTE: use of "mouseenter" and "mouseleave" only applies to parent elements, not children.
    .on("mouseenter", function() {$y(this).addClass("hoverHighlight")})
    .on("mouseleave", function() {$y(this).removeClass("hoverHighlight")})
    // rows should go to main link when clicked
    .on("click", function() {
      // a td with a link that goes to another page...
      const anchor = $y("td:first-of-type a", this)[0]
      // or a div with an expando arrow, e.g. in Notes
                      || $y("div.OneView a", this)[0];
      if (anchor) {
        anchor.click();
        return;
      }
    });
}


// All table rows should have hover effects and be easily clickable.
// This DOESN'T include Notes; those are handled by hoverNotes()
function hoverTableRows() {
  $y("tr.RowOdd,tr.RowEven,.OneLinerLeft")
    // table rows should highlight when hovered.
    // NOTE: use of "mouseover" and "mouseout" also applies to all child elements.
    .on("mouseover", function() {$y(this).addClass("hoverHighlight")})
    .on("mouseout", function() {$y(this).removeClass("hoverHighlight")})
    // rows should go to main link when clicked
    .on("click", function() {
      // a td with a link that goes to another page...
      const anchor = $y("td:first-of-type a", this)[0]
      // or a div with an expando arrow, e.g. in Notes
                      || $y("div.OneView a", this)[0];
      if (anchor) {
        anchor.click();
        return;
      }
    });
}

// Handles display and event hooks for topSearch
function createTopSearch() {
  $y("body").prepend(`<div id="topALSearch"><input type="text"></div>`);
  document.addEventListener('keydown', function(e) {
    if (e.code == "Slash") {
      // check if the user is typing in an input
      const active = $y("input[type='text']:focus,textarea:focus");
      if (active.length > 0) {
        // console.log("Doing nothing while typing", active);
        return;
      }
      e.preventDefault();
      $y("#topALSearch").show();
      $y("#topALSearch input").focus();
      return;
    }

    if (e.code == "Enter" && document.activeElement == $y("#topALSearch input")[0]) {
      fireTopSearch();
    }
  });
}

// Submit the search.
// Adds an extra query param (alfield) which holds the search field used.
function fireTopSearch() {
  let value = $y("#topALSearch input")[0].value;
  const field = value.match("[a-zA-Z@]") ? "email0email_addr" :
                value.match("^\\.[0-9]+") ? "contact0sub_id" : "phone0full_phone";
  if (field == "phone0full_phone" || field == "contact0sub_id")
    value = value.replaceAll(/[^0-9]/g, '');
  let o = new Object();

  // Contact ID search uses an advanced search so it can do an exact string match
  if (field == "contact0sub_id") {
    o = {
      Field1: "contact0sub_id",
      Data1: value,
    };
    const paramStr = jQuery.param(o);
    window.location = "https://safeoffice.com/SearchContact.php?" + paramStr +
      "&Exact1=on&bool=AND&Submitted=1&SearchType=ADVANCED&ct=ALL_CONTACT&bo=&alfield=" + field;
  } else { // phone and email search
    o[field] = value;
    const paramStr = jQuery.param(o);
    window.location = "https://safeoffice.com/SearchContact.php?" + paramStr +
      "&ChangeEntity=ALL_CONTACT&Submitted=1&SearchType=QUICK&ct=ALL_CONTACT&bo=&ho=&ro=&fs=&ma=&mfc=" +
      "&alfield=" + field;
  }
}

// Contact page: Move the new note space to the right place
function moveNewNote() {
  if ($y("#NewNote_contact")[0]) {
    let newNote = $y("#NewNote_contact").detach();
    $y("#Note_contact").prepend(newNote);
  }
}


// Search results: Add text which describes the search query that
// was performed to get these results.
// If it's a phone number search, also calls stripPhoneResults()
function showSearchDetails() {
  if (document.location.pathname != "/SearchContact.php") return;

  const params = (new URL(document.location)).searchParams;
  const fieldUsed = params.get("alfield");
  if (!fieldUsed) return;

  const fieldDescs = {
    "email0email_addr": "email address",
    "contact0sub_id": "contact ID",
    "phone0full_phone": "phone number"
  };

  const fieldValue = params.get(fieldUsed);

  if (fieldUsed == "phone0full_phone") stripPhoneResults(fieldValue);

  // If there's only one search result in the AL section,
  // let's just click on that result
  if (AUTO_CLICK_SINGLE_RESULT) {
    const alResults = $y("div#Report:eq(0) tr");
    if (alResults.length == 2) { // header row + one result
      $y("td a", alResults).first().click();
      return;
    }
  }

  const searchDesc = `<h3>TopSearch for <b>${fieldDescs[fieldUsed]}</b> containing <b><code>"${fieldValue}"</code></b></h3>`;
  $y(searchDesc).insertAfter("td h2");

}

// Search results: When searching for phone numbers, remove results without
// the query digits at the END of the number.
// Called by showSearchDetails()
function stripPhoneResults(digits) {
  const badRecords = $y("tr.RowOdd,tr.RowEven").filter(function(i, el){
    // List of all phone numbers in the record which end with the specified digis
    const badNumbers = $y("span[id^='Areacode']", el).filter(function(i2, el2) {
      return el2.innerText.replaceAll(/[\/-]/gi, "").endsWith(digits);
    })
    return (badNumbers.length == 0);
    // if the record had no phone numbers with the digits at the end, detach it
  });
  badRecords.detach();
}

// "Amt collected" calculator:
// When a page has an "Amt Booked" input, auto-calculate Amt Collected as the
// input changes and display in a button which fills the Amt Collected field.
function setupAmtCollectedCalculator() {
  // Current collected percentage
  const collectFraction = 0.225;
  const amtBookedInput = $y("#fees_amt_booked input");
  if (amtBookedInput) {
    const amtCollectedInput = $y("#fees_amt_collected input");
    const outputSpan = $y("#fees_amt_collected span.Loud").first(); // it's a span to the right
    const calcButton = $y("<button type='button'></button>");
    let amtCollected = null;
    outputSpan.css("display", "inline");
    outputSpan.append(calcButton)
      .click((event)=>{
        amtCollectedInput.val(amtCollected);
    });
    amtBookedInput.on("input", (event)=>{
      let amtStr = event.target.value;
      if (!isNaN(amtStr)) {
        let amt = parseInt(amtStr);
        amtCollected = (amt * collectFraction).toFixed(2);
        calcButton.text(`Enter ${amtCollected}`);
      }
    })

  }
}

// Add GMail Click Listeners:
// Clicking a contactable email address should open a GMail compose window
// and fill the clipboard with the correct event details for pasting.
// Replaces the old "Send Email" bookmarklet.
// Only works on Contact pages.
function addGMailClickListeners() {
  $y("div.OneContactEmailAddr a").not(".NoCall a")
    .on("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      let addr = this.innerHTML;
      let eventDetails = $y("#Report tr:nth-child(2) td").get(); // .get() makes a normal array
      let [detailsBlock, subject] = formatEventDetails(eventDetails);
      GM.setClipboard(detailsBlock, "text/html");
      alert("I built and copied the details block for you. Now opening the email so you can paste it in...");
      let url = `http://mail.google.com/a/amys-lair.com/mail?view=cm&su=${subject}&to=${addr}`;
      // window.open(url, "_blank", "width=500,height=500"); // doesn't work in VM/GM, so...
      let tabControl = GM.openInTab(url, {active: true, insert: true});
    });
}

// formatEventDetails: used by addGMailClickListeners to format the grabbed
// event details in an embedded template and returns a two-element array of:
// 1: a block of HTML, which will be written to the clipboard
// 2: the subject line of the email
function formatEventDetails(evd) {
  let [, type, date, day, time, dur, , , status, , ext, booked] = evd.map(x => x.innerText.strip());
  if (status != "Same Day" && status != "Unconfirmed") {
      if (!confirm(`Looks like this event isn't in a 'Same Day' or 'Unconfirmed' status - I see ${status}. Want to continue anyway?`)) {
          throw new Error("User clicked Cancel on wrong status");
      }
  }
  if (new Date(date + " " + time) < Date.now()) {
      if (!confirm(`Looks like this event is in the past (I see ${date + " " + time}). Want to continue anyway?`)) {
          throw new Error("User clicked Cancel on past date");
      }
  }
  let loc = type.split(/\s+/)[0]; // "Lake" or "Temescal"
  let locationName = {
      "Lake": "Lake House, Emeryville",
      "Temescal": "Temescal House, Oakland"
  }[loc];
  let subject = `${loc} House arrival protocol`;
  let provider = ext.replace(" Lairette", "");
  let rate = booked.replace("$","");
  let htmlBlock = `Appointment with: ${provider}<br>
Date: ${day} ${date}<br>
Time: ${time}<br>
Length: ${dur} hr<br>
Type of Service: ${type}<br>
Location: ${locationName}<br>
Rate: ${rate}<br>
`;
  return [htmlBlock, subject];
}


init();
