let reviewMode = false;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const toggleBtn = document.getElementById('toggle-mode');

  toggleBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if content script is already injected
    chrome.tabs.sendMessage(tab.id, { action: 'ping' }, async (response) => {
      if (chrome.runtime.lastError) {
        // Content script not injected, inject it now
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
          });
          
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content/content.css']
          });
          
          // Wait a bit for initialization
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'toggleReviewMode' });
          }, 100);
        } catch (error) {
          alert('Could not enable on this page. This page may be restricted by Chrome.');
          return;
        }
      } else {
        // Content script already there, just toggle
        chrome.tabs.sendMessage(tab.id, { action: 'toggleReviewMode' });
      }
    });
    
    setTimeout(() => {
      window.close();
    }, 500);
  });

  loadRecentReview();
}

async function loadRecentReview() {
  const recentReview = document.getElementById('recent-review');
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSessions' });
    
    if (response.error) {
      recentReview.innerHTML = '<div class="empty-text">Failed to load</div>';
      return;
    }

    const sessions = response.sessions || [];
    
    if (sessions.length === 0) {
      recentReview.innerHTML = '<div class="empty-text">You don\'t have any reviews yet</div>';
      return;
    }

    // Only show the most recent session
    const session = sessions[0];
    recentReview.innerHTML = `
      <div class="review-card" data-url="${session.page_url}">
        <div class="review-title">${session.page_title || truncateUrl(session.page_url)}</div>
        <div class="review-meta">
          <div class="review-meta-item">
            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>${session.screenshot_count}</span>
          </div>
          <div class="review-meta-item">
            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${formatTimeAgo(session.latest_timestamp)}</span>
          </div>
        </div>
      </div>
    `;
    
    // Make card clickable to open in web app
    document.querySelector('.review-card').addEventListener('click', () => {
      const url = `https://fetchhub.px-tester.workers.dev/gallery?url=${encodeURIComponent(session.page_url)}`;
      chrome.tabs.create({ url });
    });
  } catch (error) {
    console.error('Load recent review failed:', error);
    recentReview.innerHTML = '<div class="empty-text">Failed to load</div>';
  }
}


function truncateUrl(url) {
  if (url.length > 40) {
    return url.substring(0, 37) + '...';
  }
  return url;
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
