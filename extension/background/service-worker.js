const API_BASE = 'https://fetchhub.px-tester.workers.dev/api';

// Helper function to get headers
function getAuthHeaders(contentType = 'application/json') {
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  return headers;
}

let reviewSessions = {};

// Clean up tab state when tabs are closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.local.remove(`reviewMode_tab_${tabId}`);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    handleCaptureScreenshot(sender.tab.id, sender.tab.url, sender.tab.title)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'saveSession') {
    handleSaveSession(request.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'getUserInfo') {
    getUserInfo()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'getSessions') {
    getSessions()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'getTabId') {
    sendResponse({ tabId: sender.tab?.id || null });
    return true;
  }

  if (request.action === 'deleteSession') {
    deleteSession(request.pageUrl)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'getScreenshots') {
    getScreenshots(request.pageUrl)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'deleteScreenshot') {
    deleteScreenshot(request.screenshotId)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleCaptureScreenshot(tabId, url, title) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    const dimensions = await getImageDimensions(dataUrl);
    
    return {
      screenshot: dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      url: url,
      title: title
    };
  } catch (error) {
    throw error;
  }
}

async function getImageDimensions(dataUrl) {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    const dimensions = {
      width: bitmap.width,
      height: bitmap.height
    };
    
    bitmap.close();
    return dimensions;
  } catch (error) {
    return { width: 1920, height: 1080 };
  }
}

async function getUserInfo() {
  try {
    // First check cache
    const result = await chrome.storage.local.get(['userName']);
    if (result.userName) {
      return { name: result.userName };
    }

    // Fetch authenticated user from API
    try {
      const response = await fetch(`${API_BASE}/user`, {
        headers: getAuthHeaders(null)
      });
      
      if (response.ok) {
        const data = await response.json();
        const name = data.name || data.email?.split('@')[0] || 'User';
        // Cache for future use
        await chrome.storage.local.set({ userName: name });
        return { name };
      }
    } catch (e) {
      console.error('Failed to fetch user info:', e);
    }

    return { name: 'Anonymous' };
  } catch (error) {
    return { name: 'Anonymous' };
  }
}

async function handleSaveSession(sessionData) {
  const { screenshots, userName } = sessionData;

  try {
    for (const screenshot of screenshots) {
      
      const screenshotResponse = await fetch(`${API_BASE}/screenshots`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          page_url: screenshot.url,
          page_title: screenshot.title,
          image_data: screenshot.imageData,
          width: screenshot.width,
          height: screenshot.height,
          created_by: userName
        })
      });

      if (!screenshotResponse.ok) {
        const errorText = await screenshotResponse.text();
        throw new Error(`Failed to save screenshot: ${errorText}`);
      }

      const savedScreenshot = await screenshotResponse.json();

      for (const comment of screenshot.comments) {
        
        const commentResponse = await fetch(`${API_BASE}/comments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            screenshot_id: savedScreenshot.id,
            x: comment.x,
            y: comment.y,
            width: comment.width,
            height: comment.height,
            commenter_name: userName,
            comment_text: comment.text
          })
        });
      }
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
}

async function getSessions() {
  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      headers: getAuthHeaders(null)
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    const data = await response.json();
    return { sessions: data.sessions || [] };
  } catch (error) {
    throw error;
  }
}

async function getScreenshots(pageUrl) {
  try {
    const response = await fetch(`${API_BASE}/screenshots?url=${encodeURIComponent(pageUrl)}`, {
      headers: getAuthHeaders(null)
    });
    if (!response.ok) {
      throw new Error('Failed to fetch screenshots');
    }
    const data = await response.json();
    return { screenshots: data.screenshots || [] };
  } catch (error) {
    throw error;
  }
}

async function deleteScreenshot(screenshotId) {
  try {
    const response = await fetch(`${API_BASE}/screenshots?id=${encodeURIComponent(screenshotId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(null)
    });
    if (!response.ok) {
      throw new Error('Failed to delete screenshot');
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
}

async function deleteSession(pageUrl) {
  try {
    const response = await fetch(`${API_BASE}/screenshots?url=${encodeURIComponent(pageUrl)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(null)
    });
    if (!response.ok) {
      throw new Error('Failed to delete session');
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
}

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggleReviewMode' });
});
