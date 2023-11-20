// docs/contact.user.js
// ... (other code)

// Find all notes and extract provider names and ratings
$y('div.OneContactNoteSubject').each(function() {
  let noteText = $y(this).text();
  let providerRegex = /(\w+)\s\+(\d+)|(\w+)\s\-(\d+)|(\w+)\sNO/gi;
  let providerMatch;
  while ((providerMatch = providerRegex.exec(noteText)) !== null) {
    let providerName = (providerMatch[1] || providerMatch[3] || providerMatch[5]).toLowerCase().replace(/\b\w/g, firstChar => firstChar.toUpperCase());
    // ... (other code)
  }
});
// ... (other code)
