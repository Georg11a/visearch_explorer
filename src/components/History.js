import React, { useEffect, useState } from 'react';

/**
 * History component that displays user's exploration activity
 * - Recently viewed papers
 * - Bookmarked papers with remove functionality
 * - Recent activity timeline (显示在搜索历史之前)
 * - Search history
 * 
 * All data is stored in browser's localStorage for persistence across sessions
 */
const History = () => {
  // State for each history category
  const [recentPapers, setRecentPapers] = useState([]);
  const [bookmarkedPapers, setBookmarkedPapers] = useState([]);
  const [actions, setActions] = useState([]);

  // Function to load data from localStorage
  const loadHistoryData = () => {
    // Load recently viewed papers
    const recentData = JSON.parse(localStorage.getItem('recentPapers') || '[]');
    setRecentPapers(recentData);

    // Load bookmarked papers
    const bookmarksData = JSON.parse(localStorage.getItem('bookmarkedPapers') || '[]');
    setBookmarkedPapers(bookmarksData);

    // Load action history
    const actionsData = JSON.parse(localStorage.getItem('actionHistory') || '[]');
    setActions(actionsData);
  };

  // Effect to load history data from localStorage on component mount
  useEffect(() => {
    loadHistoryData();
  }, []);

  // Function to remove a bookmark
  const handleRemoveBookmark = (paperId) => {
    try {
      const updatedBookmarks = bookmarkedPapers.filter(paper => paper.id !== paperId);
      localStorage.setItem('bookmarkedPapers', JSON.stringify(updatedBookmarks));
      setBookmarkedPapers(updatedBookmarks);

      // Add to action history
      const removedPaper = bookmarkedPapers.find(p => p.id === paperId);
      if (removedPaper) {
        const history = JSON.parse(localStorage.getItem('actionHistory') || '[]');
        history.unshift({
          type: 'unbookmark',
          timestamp: new Date().toISOString(),
          title: removedPaper.title,
          paperId: paperId
        });
        localStorage.setItem('actionHistory', JSON.stringify(history.slice(0, 50)));
        setActions(history.slice(0, 50));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  // Function to clear recent papers
  const handleClearRecentPapers = () => {
    localStorage.setItem('recentPapers', JSON.stringify([]));
    setRecentPapers([]);
  };

  // Function to clear all bookmarks
  const handleClearAllBookmarks = () => {
    if (window.confirm('Are you sure you want to remove all bookmarks?')) {
      localStorage.setItem('bookmarkedPapers', JSON.stringify([]));
      setBookmarkedPapers([]);
    }
  };

  // Function to clear activity history
  const handleClearActivity = () => {
    if (window.confirm('Are you sure you want to clear activity history?')) {
      localStorage.setItem('actionHistory', JSON.stringify([]));
      setActions([]);
    }
  };

  // Format timestamp to readable date/time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Function to get relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return formatTime(timestamp);
  };

  // Render the history view with four sections
  return (
    <div className="history-container">

      {/* Recently Viewed Papers Section */}
      <section className="history-section">
        <div className="section-header">
          <h2>Recently Viewed Papers</h2>
          {recentPapers.length > 0 && (
            <button className="clear-button" onClick={handleClearRecentPapers}>
              Clear All
            </button>
          )}
        </div>
        {recentPapers.length === 0 ? (
          <p className="empty-message">No papers viewed yet. Start exploring to see your viewing history!</p>
        ) : (
          <ul className="paper-list">
            {recentPapers.map(paper => (
              <li key={paper.id} className="paper-item">
                <div className="paper-info">
                  <a href={`#paper-${paper.id}`} className="paper-link">
                    {paper.title}
                  </a>
                  {paper.year && (
                    <span className="paper-year">({paper.year})</span>
                  )}
                  {paper.viewedAt && (
                    <span className="viewed-time">{getRelativeTime(paper.viewedAt)}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bookmarked Papers Section */}
      <section className="history-section">
        <div className="section-header">
          <h2>Bookmarked Papers</h2>
          {bookmarkedPapers.length > 0 && (
            <button className="clear-button danger" onClick={handleClearAllBookmarks}>
              Clear All
            </button>
          )}
        </div>
        {bookmarkedPapers.length === 0 ? (
          <p className="empty-message">No bookmarked papers. Use the ★ button on papers to bookmark them!</p>
        ) : (
          <div className="bookmarked-papers-grid">
            {bookmarkedPapers.map(paper => (
              <div key={paper.id} className="bookmark-card">
                <div className="bookmark-header">
                  <h3 className="bookmark-title">
                    <a href={`#paper-${paper.id}`} className="paper-link">
                      {paper.title}
                    </a>
                  </h3>
                  <button 
                    className="remove-bookmark-btn"
                    onClick={() => handleRemoveBookmark(paper.id)}
                    title="Remove bookmark"
                  >
                    ✕
                  </button>
                </div>
                <p className="bookmark-authors">{paper.authors}</p>
                <div className="bookmark-meta">
                  <span className="bookmark-year">{paper.year}</span>
                  {paper.venue && <span className="bookmark-venue">{paper.venue}</span>}
                  {paper.area && <span className="bookmark-area">{paper.area}</span>}
                </div>
                {paper.abstract && (
                  <p className="bookmark-abstract">
                    {paper.abstract.length > 150 
                      ? paper.abstract.substring(0, 150) + '...'
                      : paper.abstract
                    }
                  </p>
                )}
                {paper.bookmarkedAt && (
                  <span className="bookmarked-time">
                    Bookmarked {getRelativeTime(paper.bookmarkedAt)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity Timeline - 现在显示在搜索历史之前 */}
      <section className="history-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          {actions.length > 0 && (
            <button className="clear-button" onClick={handleClearActivity}>
              Clear All Activity
            </button>
          )}
        </div>
        {actions.length === 0 ? (
          <p className="empty-message">No recent activity. Your interactions will appear here.</p>
        ) : (
          <ul className="timeline-list">
            {actions.slice(0, 20).map((event, idx) => (
              <li key={idx} className="timeline-item">
                <span className="timestamp">{getRelativeTime(event.timestamp)}</span>
                <span className="action-content">
                  {/* Show different icon and text based on action type */}
                  {event.type === 'search' && (
                    <>
                      <span className="action-icon">🔍</span>
                      <span className="action-text">
                        Searched for <em>"{event.query}"</em>
                      </span>
                    </>
                  )}
                  {event.type === 'filter' && (
                    <>
                      <span className="action-icon">🎚️</span>
                      <span className="action-text">
                        Applied filter <em>{event.filter}</em>
                      </span>
                    </>
                  )}
                  {event.type === 'view' && (
                    <>
                      <span className="action-icon">📄</span>
                      <span className="action-text">
                        Viewed paper <em>{event.title}</em>
                      </span>
                    </>
                  )}
                  {event.type === 'bookmark' && (
                    <>
                      <span className="action-icon">⭐</span>
                      <span className="action-text">
                        Bookmarked paper <em>{event.title}</em>
                      </span>
                    </>
                  )}
                  {event.type === 'unbookmark' && (
                    <>
                      <span className="action-icon">💔</span>
                      <span className="action-text">
                        Removed bookmark from <em>{event.title}</em>
                      </span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Search History - 现在显示在最后 */}
      <section className="history-section">
        <div className="section-header">
          <h2>Search History</h2>
          {actions.filter(action => action.type === 'search').length > 0 && (
            <button className="clear-button" onClick={handleClearActivity}>
              Clear History
            </button>
          )}
        </div>
        {actions.filter(action => action.type === 'search').length === 0 ? (
          <p className="empty-message">No search history. Your search queries will appear here.</p>
        ) : (
          <ul className="search-history-list">
            {actions
              .filter(action => action.type === 'search')
              .slice(0, 20)
              .map((event, idx) => (
                <li key={idx} className="search-history-item">
                  <div className="search-content">
                    <span className="search-icon">🔍</span>
                    <div className="search-details">
                      <span className="search-query">"{event.query}"</span>
                      <span className="search-time">{getRelativeTime(event.timestamp)}</span>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* CSS styles for the History component */}
      <style jsx>{`
        .history-container {
          max-width: 1400px;
          margin: 0;
          padding: 0;
        }

        h1 {
          color: #1a365d;
          margin-bottom: 20px;
        }

        .history-section {
          margin-bottom: 30px;
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        h2 {
          color: #1a365d;
          margin: 0;
          font-size: 20px;
        }

        .clear-button {
          padding: 6px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          background-color: white;
          color: #4a5568;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background-color: #edf2f7;
          border-color: #a0aec0;
        }

        .clear-button.danger {
          border-color: #fc8181;
          color: #c53030;
        }

        .clear-button.danger:hover {
          background-color: #fed7d7;
          border-color: #e53e3e;
        }

        .empty-message {
          color: #718096;
          font-style: italic;
          text-align: center;
          padding: 20px;
          background-color: #f7fafc;
          border-radius: 4px;
          margin: 0;
        }

        .paper-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }

        .paper-item {
          padding: 12px 0;
          border-bottom: 1px solid #edf2f7;
        }

        .paper-item:last-child {
          border-bottom: none;
        }

        .paper-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .paper-link {
          color: #2c5282;
          text-decoration: none;
          font-weight: 500;
          flex: 1;
        }

        .paper-link:hover {
          text-decoration: underline;
        }

        .paper-year {
          color: #718096;
          font-size: 14px;
        }

        .viewed-time {
          color: #a0aec0;
          font-size: 12px;
          margin-left: auto;
        }

        .bookmarked-papers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .bookmark-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          background-color: #f8fafc;
          transition: all 0.2s ease;
        }

        .bookmark-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .bookmark-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .bookmark-title {
          margin: 0;
          font-size: 16px;
          flex: 1;
          padding-right: 10px;
        }

        .remove-bookmark-btn {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 16px;
          padding: 2px;
          border-radius: 2px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .remove-bookmark-btn:hover {
          color: #e53e3e;
          background-color: rgba(229, 62, 62, 0.1);
        }

        .bookmark-authors {
          color: #4a5568;
          font-size: 14px;
          margin: 5px 0 10px 0;
        }

        .bookmark-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .bookmark-year, .bookmark-venue, .bookmark-area {
          background-color: #edf2f7;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          color: #4a5568;
        }

        .bookmark-area {
          background-color: #ebf4ff;
          color: #3182ce;
        }

        .bookmark-abstract {
          color: #718096;
          font-size: 14px;
          line-height: 1.4;
          margin: 10px 0;
        }

        .bookmarked-time {
          color: #a0aec0;
          font-size: 12px;
          font-style: italic;
        }

        .timeline-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
          position: relative;
        }

        .timeline-list:before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 120px;
          width: 2px;
          background-color: #e2e8f0;
        }

        .timeline-item {
          position: relative;
          padding: 10px 0 10px 150px;
          margin-bottom: 10px;
        }

        .timestamp {
          position: absolute;
          left: 0;
          width: 110px;
          color: #718096;
          font-size: 12px;
          text-align: right;
        }

        .action-content {
          display: flex;
          align-items: center;
        }

        .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background-color: #ebf4ff;
          border-radius: 50%;
          margin-right: 10px;
          z-index: 1;
        }

        .action-text {
          font-size: 15px;
          color: #4a5568;
        }

        .action-text em {
          font-style: normal;
          font-weight: 600;
          color: #2d3748;
        }

        /* 搜索历史样式 */
        .search-history-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }

        .search-history-item {
          padding: 12px 0;
          border-bottom: 1px solid #edf2f7;
        }

        .search-history-item:last-child {
          border-bottom: none;
        }

        .search-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-icon {
          font-size: 18px;
          background-color: #ebf4ff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .search-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .search-query {
          font-size: 16px;
          font-weight: 500;
          color: #2d3748;
          font-style: italic;
        }

        .search-time {
          font-size: 12px;
          color: #a0aec0;
        }

        /* Responsive styling */
        @media (max-width: 768px) {
          .timeline-list:before {
            left: 20px;
          }

          .timeline-item {
            padding-left: 45px;
          }

          .timestamp {
            position: static;
            width: 100%;
            text-align: left;
            margin-bottom: 5px;
            font-weight: 500;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .bookmarked-papers-grid {
            grid-template-columns: 1fr;
          }

          .paper-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .viewed-time {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default History;