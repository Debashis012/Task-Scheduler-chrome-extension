// Authenticate user and store token
function authenticateUser() {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError) {
      console.error('Authentication error:', chrome.runtime.lastError);
      chrome.runtime.sendMessage({ action: 'authError', message: chrome.runtime.lastError.message });
    } else {
      chrome.storage.local.set({ authToken: token }, function() {
        console.log('Token stored');
        fetchUserData(token); // Fetch user data after storing token
      });
    }
  });
}

// Fetch user data from Google API
function fetchUserData(token) {
  fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    chrome.storage.local.set({ userData: data });
  })
  .catch(error => {
    console.error('Error fetching user data:', error);
    chrome.runtime.sendMessage({ action: 'dataFetchError', message: error.message });
  });
}

// Create a calendar event
function createCalendarEvent(eventDetails) {
  chrome.storage.local.get('authToken', function(items) {
    const token = items.authToken;
    if (token) {
      fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventDetails)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Event created:', data);
      })
      .catch(error => {
        console.error('Error creating event:', error);
        chrome.runtime.sendMessage({ action: 'eventCreationError', message: error.message });
      });
    } else {
      console.error('No authentication token available.');
    }
  });
}

// Listen for sign-in requests and calendar event creation from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case 'signIn':
      authenticateUser();
      break;
    case 'createCalendarEvent':
      createCalendarEvent(request.eventDetails);
      break;
    default:
      console.warn('Unknown action:', request.action);
  }
});
