/**
 * Utility functions for history management
 * These functions can be imported and used by various components
 * to update history data in localStorage
 */

// Maximum number of items to keep in each history category
const MAX_RECENT_PAPERS = 10;
const MAX_ACTION_HISTORY = 50;

/**
 * Add a paper to recently viewed list
 * @param {Object} paper - Paper object containing at least id and title
 */
export const addToRecentlyViewed = (paper) => {
  try {
    // Get current list from localStorage
    const recentPapers = JSON.parse(localStorage.getItem('recentPapers') || '[]');
    
    // Check if paper already exists in the list
    const existingIndex = recentPapers.findIndex(item => item.id === paper.id);
    
    // If it exists, remove it (will be added to front)
    if (existingIndex !== -1) {
      recentPapers.splice(existingIndex, 1);
    }
    
    // Add paper to the beginning of the list
    recentPapers.unshift(paper);
    
    // Limit the list to maximum number of items
    const limitedList = recentPapers.slice(0, MAX_RECENT_PAPERS);
    
    // Save back to localStorage
    localStorage.setItem('recentPapers', JSON.stringify(limitedList));
    
    // Log this action to action history
    logAction({
      type: 'view',
      paperId: paper.id,
      title: paper.title,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error adding paper to recently viewed:', error);
  }
};

/**
 * Toggle bookmark status for a paper
 * @param {Object} paper - Paper object containing at least id and title
 * @returns {boolean} - New bookmark status (true = bookmarked)
 */
export const toggleBookmark = (paper) => {
  try {
    // Get current bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedPapers') || '[]');
    
    // Check if paper is already bookmarked
    const existingIndex = bookmarks.findIndex(item => item.id === paper.id);
    let isNowBookmarked = true;
    
    if (existingIndex !== -1) {
      // Remove bookmark
      bookmarks.splice(existingIndex, 1);
      isNowBookmarked = false;
      
      // Log unbookmark action
      logAction({
        type: 'unbookmark',
        paperId: paper.id,
        title: paper.title,
        timestamp: Date.now()
      });
    } else {
      // Add bookmark
      bookmarks.unshift(paper);
      
      // Log bookmark action
      logAction({
        type: 'bookmark',
        paperId: paper.id,
        title: paper.title,
        timestamp: Date.now()
      });
    }
    
    // Save updated bookmarks
    localStorage.setItem('bookmarkedPapers', JSON.stringify(bookmarks));
    
    return isNowBookmarked;
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return false;
  }
};

/**
 * Check if a paper is bookmarked
 * @param {string} paperId - ID of the paper to check
 * @returns {boolean} - True if paper is bookmarked
 */
export const isBookmarked = (paperId) => {
  try {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedPapers') || '[]');
    return bookmarks.some(item => item.id === paperId);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

/**
 * Log a search action
 * @param {string} query - Search query text
 */
export const logSearchAction = (query) => {
  logAction({
    type: 'search',
    query,
    timestamp: Date.now()
  });
};

/**
 * Log a filter action
 * @param {string} filter - Description of the filter applied
 */
export const logFilterAction = (filter) => {
  logAction({
    type: 'filter',
    filter,
    timestamp: Date.now()
  });
};

/**
 * Log any action to action history
 * @param {Object} action - Action object to log
 */
export const logAction = (action) => {
  try {
    // Get current action history
    const actionHistory = JSON.parse(localStorage.getItem('actionHistory') || '[]');
    
    // Add new action to the beginning
    actionHistory.unshift(action);
    
    // Limit the list to maximum number of items
    const limitedList = actionHistory.slice(0, MAX_ACTION_HISTORY);
    
    // Save back to localStorage
    localStorage.setItem('actionHistory', JSON.stringify(limitedList));
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

/**
 * Clear all history data
 * @param {Array} categories - Array of categories to clear ('recent', 'bookmarks', 'actions')
 */
export const clearHistory = (categories = ['recent', 'bookmarks', 'actions']) => {
  try {
    if (categories.includes('recent')) {
      localStorage.setItem('recentPapers', '[]');
    }
    
    if (categories.includes('bookmarks')) {
      localStorage.setItem('bookmarkedPapers', '[]');
    }
    
    if (categories.includes('actions')) {
      localStorage.setItem('actionHistory', '[]');
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};