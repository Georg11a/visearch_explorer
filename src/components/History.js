import React, { useEffect, useState } from 'react';

/**
 * History component that displays user's exploration activity
 * - Recently viewed papers
 * - Bookmarked papers
 * - Activity timeline
 * 
 * All data is stored in browser's localStorage for persistence across sessions
 */
const History = () => {
  // State for each history category
  const [recentPapers, setRecentPapers] = useState([]);
  const [bookmarkedPapers, setBookmarkedPapers] = useState([]);
  const [actions, setActions] = useState([]);

  // Effect to load history data from localStorage on component mount
  useEffect(() => {
    // Load recently viewed papers
    const recentData = JSON.parse(localStorage.getItem('recentPapers') || '[]');
    setRecentPapers(recentData);

    // Load bookmarked papers
    const bookmarksData = JSON.parse(localStorage.getItem('bookmarkedPapers') || '[]');
    setBookmarkedPapers(bookmarksData);

    // Load action history
    const actionsData = JSON.parse(localStorage.getItem('actionHistory') || '[]');
    setActions(actionsData);
  }, []); // Empty dependency array means this effect runs once on mount

  // Format timestamp to readable date/time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render the history view with three sections
  return (
    <div className="history-container">
      <h1>History</h1>

      {/* Recently Viewed Papers Section */}
      <section className="history-section">
        <h2>Recently Viewed Papers</h2>
        {recentPapers.length === 0 ? (
          <p>No papers viewed yet.</p>
        ) : (
          <ul className="paper-list">
            {recentPapers.map(paper => (
              <li key={paper.id} className="paper-item">
                <a href={`#paper-${paper.id}`} className="paper-link">
                  {paper.title}
                </a>
                {paper.year && (
                  <span className="paper-year">({paper.year})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bookmarked Papers Section */}
      <section className="history-section">
        <h2>Bookmarked Papers</h2>
        {bookmarkedPapers.length === 0 ? (
          <p>No bookmarked papers.</p>
        ) : (
          <ul className="paper-list">
            {bookmarkedPapers.map(paper => (
              <li key={paper.id} className="paper-item">
                <a href={`#paper-${paper.id}`} className="paper-link">
                  {paper.title}
                </a>
                <span className="bookmark-icon">⭐</span>
                {/* Optional: Add remove bookmark feature */}
                {/* <button 
                  className="unbookmark-btn"
                  onClick={() => handleRemoveBookmark(paper.id)}
                  aria-label="Remove bookmark"
                >
                  ⭐
                </button> */}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent Activity Timeline */}
      <section className="history-section">
        <h2>Recent Activity</h2>
        {actions.length === 0 ? (
          <p>No recent activity.</p>
        ) : (
          <ul className="timeline-list">
            {actions.map((event, idx) => (
              <li key={idx} className="timeline-item">
                <span className="timestamp">{formatTime(event.timestamp)}</span>
                <span className="action-content">
                  {/* Show different icon and text based on action type */}
                  {event.type === 'search' && (
                    <>
                      <span className="action-icon">🔍</span>
                      <span className="action-text">
                        Searched for <em>{event.query}</em>
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
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CSS styles for the History component */}
      <style jsx>{`
        .history-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
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

        h2 {
          color: #1a365d;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 20px;
        }

        .paper-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }

        .paper-item {
          padding: 10px 0;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          align-items: center;
        }

        .paper-item:last-child {
          border-bottom: none;
        }

        .paper-link {
          color: #2c5282;
          text-decoration: none;
          font-weight: 500;
        }

        .paper-link:hover {
          text-decoration: underline;
        }

        .paper-year {
          margin-left: 8px;
          color: #718096;
          font-size: 14px;
        }

        .bookmark-icon {
          margin-left: 10px;
          color: #f6ad55;
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
          font-size: 14px;
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
        }
      `}</style>
    </div>
  );
};

export default History;