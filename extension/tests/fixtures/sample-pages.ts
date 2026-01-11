// Sample HTML fixtures for testing

export const calendarPageHTML = `
<div id="graphicalView">
  <div id="oldView">
    <h2>Appointments for 2024-01-15</h2>
  </div>
  <div id="calendar"></div>
</div>
`;

export const contactPageHTML = `
<div id="Note_contact">
  <div id="note_1" class="OneContactNoteSubject">
    <div class="OneContactNoteDate">2024-01-15</div>
    <div class="OneLinerNoteLeft">Note content 1</div>
  </div>
  <div id="note_2" class="OneContactNoteSubject">
    <div class="OneContactNoteDate">2024-01-14</div>
    <div class="OneLinerNoteLeft">Note content 2</div>
  </div>
</div>
<div id="Report">
  <table>
    <tr>
      <td>Type</td>
      <td>Date</td>
      <td>Day</td>
      <td>Time</td>
      <td>Duration</td>
      <td>Status</td>
      <td>Extension</td>
      <td>Booked</td>
    </tr>
    <tr>
      <td>Lake House Service</td>
      <td>2024-01-20</td>
      <td>Saturday</td>
      <td>2:00 PM</td>
      <td>2 hr</td>
      <td>Same Day</td>
      <td>Provider Lairette</td>
      <td>$200</td>
    </tr>
  </table>
</div>
<div class="OneContactEmailAddr">
  <a href="mailto:test@example.com">test@example.com</a>
</div>
`;

export const searchResultsHTML = `
<div id="Report">
  <table>
    <tr><th>Name</th><th>Phone</th></tr>
    <tr class="RowOdd">
      <td>John Doe</td>
      <td><span id="Areacode1">555-1234</span></td>
    </tr>
    <tr class="RowEven">
      <td>Jane Smith</td>
      <td><span id="Areacode2">555-5678</span></td>
    </tr>
  </table>
</div>
`;
