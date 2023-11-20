// ... entire file content ...

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
        providers[providerName] = { totalRating: 0, count: 0, hasNegative: false, latestRating: 0 };
      }
      providers[providerName].totalRating += rating;
      providers[providerName].count++;
      if (rating < 0) {
        providers[providerName].hasNegative = true;
        providers[providerName].latestRating = rating;
      } else {
        providers[providerName].latestRating = Math.max(providers[providerName].latestRating, rating);
      }
    }
  });

  // Order providers alphabetically
  let sortedProviders = Object.keys(providers).sort();

  // Create the summary bar element
  let summaryBar = $y('<div id="summaryBar" style="padding: 10px; background-color: #f0f0f0;"></div>');
  sortedProviders.forEach(providerName => {
    let avgRating = Math.round(providers[providerName].totalRating / providers[providerName].count);
    let ratingDisplay = providers[providerName].hasNegative ? providers[providerName].latestRating : avgRating;
    let ratingColor = providers[providerName].hasNegative ? 'color: red;' : '';
    summaryBar.append('<div style="' + ratingColor + '">' + providerName + ': ' + ratingDisplay + '</div>');
  });

  // Append the summary bar to the sidebar
  $y('#sidebar').prepend(summaryBar);
}

// ... entire file content ...
