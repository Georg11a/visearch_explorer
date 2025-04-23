import React, { useState } from 'react';
import EnhancedAcademicPaperVisualization from './EnhancedAcademicPaperVisualization';
import RegularSearch from './RegularSearch';
import History from './History';

const PaperSearchContainer = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('similarity');

  return (
    <div className="paper-search-container">
      {/* Tab Navigation - implemented as cards */}
      <div className="tabs">
        <div 
          className={`tab-button ${activeTab === 'similarity' ? 'active' : ''}`} 
          onClick={() => setActiveTab('similarity')}
        >
          <div className="icon">📊</div>
          <h2>Similarity Visualization</h2>
          <p>Find similar papers with semantic similarity</p>
        </div>
        
        <div 
          className={`tab-button ${activeTab === 'regular' ? 'active' : ''}`} 
          onClick={() => setActiveTab('regular')}
        >
          <div className="icon">🔍</div>
          <h2>Advanced Search</h2>
          <p>Search by keywords and metadata</p>
        </div>
        
        
        <div 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => setActiveTab('history')}
        >
          <div className="icon">📄</div>
          <h2>History</h2>
          <p>Explore papers in a visual format</p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content-container">
        {activeTab === 'similarity' && <EnhancedAcademicPaperVisualization />}
        {activeTab === 'regular' && <RegularSearch />}
        {activeTab === 'history' && <History />}
      </div>

      <style jsx>{`
        .paper-search-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .tab-button {
          flex: 1;
          min-width: 200px;
          height: 120px;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        .tab-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .tab-button.active {
          border-color: #1a365d;
          background-color: rgba(26, 54, 93, 0.05);
        }
        
        .tab-button h2 {
          color: #1a365d;
          margin: 0;
          margin-bottom: 5px;
          font-size: 18px;
        }
        
        .tab-button p {
          color: #4a5568;
          font-size: 14px;
          margin: 0;
        }
        
        .tab-button .icon {
          font-size: 24px;
          margin-bottom: 10px;
          color: #1a365d;
        }
        
        .tab-content-container {
          min-height: 400px;
        }
        
        @media (max-width: 768px) {
          .tabs {
            flex-direction: column;
          }
          
          .tab-button {
            width: 100%;
            height: auto;
            min-height: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaperSearchContainer;