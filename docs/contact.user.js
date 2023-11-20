// ... rest of the code ...

// Create summary bar function
function createSummaryBar() {
  let providers = {};
  // Find all notes and extract provider names and ratings
  $y('div.OneContactNoteSubject').each(function() {
    let noteText = $y(this).text();
    let providerMatch = noteText.match(/(\w+)\s\+(\d+)|(\w+)\s\-(\d+)/);
    if (providerMatch) {
      let providerName = providerMatch[1] || providerMatch[3];
      let rating = parseInt(providerMatch[2] || "-" + providerMatch[4], 10);
      if (!providers[providerName]) {
        providers[providerName] = { totalRating: 0, count: 0 };
      }
      providers[providerName].totalRating += rating;
      providers[providerName].count++;
    }
  });

  // Order providers alphabetically
  let sortedProviders = Object.keys(providers).sort();

  // Create the summary bar element
  let summaryBar = $y('<div id="summaryBar" style="padding: 10px; background-color: #f0f0f0;"></div>');
  sortedProviders.forEach(providerName => {
    let avgRating = (providers[providerName].totalRating / providers[providerName].count).toFixed(1);
    let ratingEmoji = avgRating >= 0 ? '👍 (' + providers[providerName].count + ')' : '👎 (' + providers[providerName].count + ')';
    summaryBar.append('<div>' + providerName + ': ' + ratingEmoji + '</div>');
  });

  // Append the summary bar to the sidebar
  $y('#sidebar').prepend(summaryBar);
}

// ... rest of the code ...
