let reviewMode = false;
let annotationMode = false;
let currentScreenshot = null;
let currentComments = [];
let isDrawing = false;
let startX = 0;
let startY = 0;
let sessionScreenshots = [];
let currentUrl = window.location.href;
let currentTabId = null;

let floatingButton;
let overlay;
let canvas;
let commentModal;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  if (document.body) {
    canvas = createCanvas();
    floatingButton = createFloatingButton();
    overlay = createOverlay();
    commentModal = createCommentModal();
    
    document.body.appendChild(floatingButton);
    document.body.appendChild(overlay);
    
    // Get current tab ID and restore state
    await restoreReviewModeState();
    
    // Set up navigation listeners
    setupNavigationListeners();
  } else {
    setTimeout(init, 100);
  }
}

async function restoreReviewModeState() {
  try {
    // Ask background for current tab ID
    const response = await chrome.runtime.sendMessage({ action: 'getTabId' });
    currentTabId = response.tabId;
    
    // Check if review mode was enabled for this tab
    const result = await chrome.storage.local.get([`reviewMode_tab_${currentTabId}`]);
    const savedState = result[`reviewMode_tab_${currentTabId}`];
    
    if (savedState === true) {
      reviewMode = true;
      if (floatingButton) {
        floatingButton.style.display = 'flex';
      }
    }
  } catch (error) {
    // Silently fail - extension will work without state restoration
  }
}

async function saveReviewModeState(enabled) {
  if (currentTabId) {
    const key = `reviewMode_tab_${currentTabId}`;
    if (enabled) {
      await chrome.storage.local.set({ [key]: true });
    } else {
      await chrome.storage.local.remove(key);
    }
  }
}

function setupNavigationListeners() {
  // Listen for history API navigation (pushState, replaceState)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleNavigation();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    handleNavigation();
  };
  
  // Listen for back/forward button navigation
  window.addEventListener('popstate', handleNavigation);
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleNavigation);
  
  // Periodic check to ensure button stays visible
  setInterval(() => {
    if (reviewMode && floatingButton) {
      if (!document.body.contains(floatingButton)) {
        document.body.appendChild(floatingButton);
        floatingButton.style.display = 'flex';
      } else if (floatingButton.style.display !== 'flex') {
        floatingButton.style.display = 'flex';
      }
    }
    if (overlay && !document.body.contains(overlay)) {
      document.body.appendChild(overlay);
    }
  }, 500);
  
  // MutationObserver to detect if button gets removed from DOM
  const observer = new MutationObserver((mutations) => {
    if (reviewMode && floatingButton && !document.body.contains(floatingButton)) {
      document.body.appendChild(floatingButton);
      floatingButton.style.display = 'flex';
    }
    if (overlay && !document.body.contains(overlay)) {
      document.body.appendChild(overlay);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function handleNavigation() {
  const newUrl = window.location.href;
  
  if (newUrl !== currentUrl) {
    currentUrl = newUrl;
    
    // Maintain button visibility if in review mode
    if (reviewMode && floatingButton) {
      if (!document.body.contains(floatingButton)) {
        document.body.appendChild(floatingButton);
      }
      floatingButton.style.display = 'flex';
    }
    
    // Close annotation mode if open during navigation
    if (annotationMode) {
      hideAnnotationMode();
    }
  }
}

function createFloatingButton() {
  const container = document.createElement('div');
  container.id = 'df-floating-button';
  container.style.display = 'none';
  
  const button = document.createElement('button');
  button.id = 'df-add-comment-btn';
  button.innerHTML = 'Add Comment';
  button.addEventListener('click', () => {
    captureScreenshot();
  });
  
  const exitButton = document.createElement('button');
  exitButton.id = 'df-exit-btn';
  exitButton.innerHTML = '×';
  exitButton.title = 'Exit Review Mode';
  exitButton.addEventListener('click', () => {
    toggleReviewMode();
  });
  
  container.appendChild(button);
  container.appendChild(exitButton);
  
  return container;
}

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'df-overlay';
  overlay.style.display = 'none';
  
  const header = document.createElement('div');
  header.id = 'df-overlay-header';
  header.innerHTML = `
    <div>
      <h2>Add Comments</h2>
      <p>Drag to select an area, then add your feedback</p>
    </div>
    <div id="df-overlay-actions">
      <button id="df-cancel-btn">Cancel</button>
      <button id="df-save-btn">Save (<span id="df-comment-count">0</span>)</button>
    </div>
  `;
  
  overlay.appendChild(header);
  overlay.appendChild(canvas);
  
  return overlay;
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'df-canvas';
  
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  
  return canvas;
}

function createCommentModal() {
  const modal = document.createElement('div');
  modal.id = 'df-comment-modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="df-modal-backdrop"></div>
    <div class="df-modal-content">
      <input type="text" id="df-comment-text" placeholder="Add a comment" />
      <button id="df-modal-submit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 7l9.2 9.2M17 7v10H7"/>
        </svg>
      </button>
    </div>
  `;
  
  // Close on backdrop click
  const backdrop = modal.querySelector('.df-modal-backdrop');
  backdrop.addEventListener('click', () => {
    modal.style.display = 'none';
    redrawCanvas();
  });
  
  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
      redrawCanvas();
    }
  });
  
  return modal;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
    return true;
  }
  
  if (request.action === 'toggleReviewMode') {
    toggleReviewMode();
  }
});

async function toggleReviewMode() {
  reviewMode = !reviewMode;
  
  // Save state to storage
  await saveReviewModeState(reviewMode);
  
  if (floatingButton) {
    floatingButton.style.display = reviewMode ? 'flex' : 'none';
  }
}

async function captureScreenshot() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });
    
    if (response.error) {
      alert('Failed to capture screenshot: ' + response.error);
      return;
    }
    
    currentScreenshot = response;
    currentComments = [];
    showAnnotationMode();
  } catch (error) {
    console.error('Capture failed:', error);
    alert('Failed to capture screenshot');
  }
}

function showAnnotationMode() {
  annotationMode = true;
  floatingButton.style.display = 'none';
  overlay.style.display = 'flex';
  
  document.body.appendChild(commentModal);
  
  canvas.width = currentScreenshot.width;
  canvas.height = currentScreenshot.height;
  
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    drawComments(ctx);
  };
  img.src = currentScreenshot.screenshot;
  
  document.getElementById('df-cancel-btn').onclick = cancelAnnotation;
  document.getElementById('df-save-btn').onclick = saveAnnotation;
  updateCommentCount();
}

function hideAnnotationMode() {
  annotationMode = false;
  overlay.style.display = 'none';
  floatingButton.style.display = reviewMode ? 'flex' : 'none';
  
  if (commentModal.parentNode) {
    commentModal.parentNode.removeChild(commentModal);
  }
}

function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  startX = (e.clientX - rect.left) * scaleX;
  startY = (e.clientY - rect.top) * scaleY;
  isDrawing = true;
}

function handleMouseMove(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const currentX = (e.clientX - rect.left) * scaleX;
  const currentY = (e.clientY - rect.top) * scaleY;
  
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    drawComments(ctx);
    
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    ctx.strokeStyle = '#ec4899';
    ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  };
  img.src = currentScreenshot.screenshot;
}

function handleMouseUp(e) {
  if (!isDrawing) return;
  isDrawing = false;
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const endX = (e.clientX - rect.left) * scaleX;
  const endY = (e.clientY - rect.top) * scaleY;
  
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  if (width > 10 && height > 10) {
    const xPercent = (x / canvas.width) * 100;
    const yPercent = (y / canvas.height) * 100;
    const widthPercent = (width / canvas.width) * 100;
    const heightPercent = (height / canvas.height) * 100;
    
    showCommentModal(xPercent, yPercent, widthPercent, heightPercent);
  }
}

function showCommentModal(x, y, width, height) {
  commentModal.style.display = 'flex';
  
  const input = document.getElementById('df-comment-text');
  input.value = '';
  input.focus();
  
  // Remove old submit handler if exists
  const submitBtn = document.getElementById('df-modal-submit');
  const newSubmitBtn = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
  
  // Initially disable button
  newSubmitBtn.disabled = true;
  
  // Enable/disable button based on input value
  input.oninput = () => {
    newSubmitBtn.disabled = input.value.trim().length === 0;
  };
  
  // Add submit handler
  newSubmitBtn.onclick = () => {
    const text = input.value.trim();
    if (text) {
      currentComments.push({ x, y, width, height, text });
      commentModal.style.display = 'none';
      redrawCanvas();
      updateCommentCount();
    }
  };
  
  // Allow Enter key to submit
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !newSubmitBtn.disabled) {
      e.preventDefault();
      newSubmitBtn.click();
    }
  };
}

function drawComments(ctx) {
  currentComments.forEach((comment, index) => {
    const x = (comment.x / 100) * canvas.width;
    const y = (comment.y / 100) * canvas.height;
    const width = (comment.width / 100) * canvas.width;
    const height = (comment.height / 100) * canvas.height;
    
    ctx.strokeStyle = '#ec4899';
    ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${index + 1}`, x + 8, y + 22);
  });
}

function redrawCanvas() {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    drawComments(ctx);
  };
  img.src = currentScreenshot.screenshot;
}

function updateCommentCount() {
  document.getElementById('df-comment-count').textContent = currentComments.length;
  document.getElementById('df-save-btn').disabled = currentComments.length === 0;
}

function cancelAnnotation() {
  if (currentComments.length > 0) {
    const discard = confirm('Discard this screenshot and all comments?');
    if (!discard) return;
  }
  
  currentScreenshot = null;
  currentComments = [];
  hideAnnotationMode();
}

async function saveAnnotation() {
  if (currentComments.length === 0) {
    alert('Please add at least one comment');
    return;
  }
  
  const screenshotToSave = {
    imageData: currentScreenshot.screenshot,
    width: currentScreenshot.width,
    height: currentScreenshot.height,
    url: currentScreenshot.url,
    title: currentScreenshot.title,
    comments: currentComments
  };
  
  currentScreenshot = null;
  currentComments = [];
  hideAnnotationMode();
  
  // Auto-save to backend immediately
  try {
    const userInfo = await chrome.runtime.sendMessage({ action: 'getUserInfo' });
    
    const response = await chrome.runtime.sendMessage({
      action: 'saveSession',
      data: {
        screenshots: [screenshotToSave],
        userName: userInfo.name
      }
    });
    
    if (response.error) {
      alert('Failed to save: ' + response.error);
      return;
    }
    
    alert('Feedback saved successfully!');
    
    // Ask if they want to add more
    const addMore = confirm('Add another screenshot?');
    if (!addMore) {
      reviewMode = false;
      floatingButton.style.display = 'none';
    }
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save feedback: ' + error.message);
  }
}

async function saveSession() {
  if (sessionScreenshots.length === 0) return;
  
  try {
    const userInfo = await chrome.runtime.sendMessage({ action: 'getUserInfo' });
    
    const response = await chrome.runtime.sendMessage({
      action: 'saveSession',
      data: {
        screenshots: sessionScreenshots,
        userName: userInfo.name
      }
    });
    
    if (response.error) {
      alert('Failed to save: ' + response.error);
      return;
    }
    
    alert('Feedback saved successfully!');
    sessionScreenshots = [];
    reviewMode = false;
    floatingButton.style.display = 'none';
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save feedback');
  }
}
