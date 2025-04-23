import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RegularSearch = () => {
  // State variables
  const [papers, setPapers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  
  // Filter options
  const [yearOptions, setYearOptions] = useState([]);
  const [venueOptions, setVenueOptions] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);
  
  // Year distribution data for chart
  const [yearDistribution, setYearDistribution] = useState([]);
  
  // Function to populate filter options
  const populateFilters = useCallback((papers) => {
    // Get unique values and sort them
    const years = [...new Set(papers.map(p => p.year))].sort().reverse();
    const venues = [...new Set(papers.map(p => p.venue))].sort();
    const areas = [...new Set(papers.map(p => p.area).filter(Boolean))].sort();
    
    setYearOptions(years);
    setVenueOptions(venues);
    setAreaOptions(areas);
    
    // Calculate year distribution for visualization
    const yearCounts = _.countBy(papers, 'year');
    const distribution = Object.entries(yearCounts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    
    setYearDistribution(distribution);
  }, []);
  
  // Generate mock data with a fixed seed for stability
  const generateMockData = useCallback((count = 500) => {
    const seededRandom = (seed) => {
      let m = 2**35 - 31;
      let a = 185852;
      let s = seed % m;
      return function() {
        return (s = s * a % m) / m;
      };
    };
    
    const rand = seededRandom(123456); // Fixed seed
    
    return Array.from({ length: count }, (_, index) => {
      return {
        id: `paper-${index}`,
        title: `Academic Paper ${index} on ${
          index % 3 === 0 ? 'Machine Learning and Text Processing' : 
          index % 3 === 1 ? 'Data Visualization Techniques' : 'Human-Computer Interaction'
        }`,
        authors: `Author ${index % 5 + 1}, Author ${(index % 3) + 5}`,
        abstract: `This is an abstract for paper ${index} discussing important research in the field of ${
          index % 3 === 0 ? 'machine learning' : 
          index % 3 === 1 ? 'data visualization' : 'human-computer interaction'
        }. The paper presents novel approaches to ${
          index % 2 === 0 ? 'improving user experience' : 'enhancing system performance'
        } through innovative methods. The authors demonstrate ${
          index % 4 === 0 ? 'empirical results' : 
          index % 4 === 1 ? 'theoretical frameworks' : 
          index % 4 === 2 ? 'comparative analyses' : 
          'practical applications'
        } that show significant improvements over previous approaches.`,
        venue: `Conference ${index % 5 + 1}`,
        year: 2020 + (index % 5),
        type: index % 3 === 0 ? 'Full Paper' : index % 3 === 1 ? 'Short Paper' : 'Poster',
        link: `#paper-${index}`,
        score: Math.random().toFixed(2),
        area: index % 4 === 0 ? 'NLP' : index % 4 === 1 ? 'HCI' : index % 4 === 2 ? 'Visualization' : 'AI'
      };
    });
  }, []);
  
  // Load papers - implementation with better error handling
  useEffect(() => {
    const loadPapers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Loading paper data...");

        // Try to load data
        try {
          console.log("Checking for CSV data...");
          
          // Try to load from possible sources
          let csvText;
          try {
            if (window.fs) {
              // Try to use window.fs
              console.log("Attempting to load CSV using window.fs...");
              csvText = await window.fs.readFile('unique_papers.csv', { encoding: 'utf8' });
              console.log("CSV loaded successfully via window.fs");
            } else {
              // Try to get from public folder
              console.log("window.fs not available, attempting to fetch from public folder...");
              const response = await fetch(`${process.env.PUBLIC_URL}/data/unique_papers.csv`);
              csvText = await response.text();
              console.log("CSV loaded successfully via fetch");
            }
            
            if (csvText) {
              console.log("Parsing CSV data...");
              
              // Parse CSV data with PapaParse
              Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                transformHeader: header => header.toLowerCase().trim(),
                complete: (results) => {
                  if (results.errors && results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    throw new Error(`Failed to parse CSV: ${results.errors[0].message}`);
                  }
                  
                  // Log headers for debugging
                  console.log("CSV Headers found:", results.meta.fields);
                  
                  // Process paper data
                  const processedPapers = results.data
                    .filter(paper => paper && (paper.title || paper.id))
                    .map((paper, index) => {
                      // Generate score for sorting/display
                      const randomScore = (Math.random() * 0.5 + 0.7).toFixed(2);
                      
                      // Determine area field, using fallback fields
                      const areaValue = paper.area || paper.field || paper.category || paper.topic || 'General';
                      
                      return {
                        id: paper.id || `paper-${index}`,
                        title: paper.title || `Paper ${index}`,
                        authors: paper.authors || 'Unknown Authors',
                        abstract: paper.abstract || 'No abstract available',
                        venue: paper.venue || paper.conference || 'Unknown Venue',
                        year: paper.year || new Date().getFullYear(),
                        type: paper.type || 'Research Paper',
                        link: paper.url || paper.link || `#paper-${index}`,
                        score: randomScore,
                        area: areaValue
                      };
                    });
                  
                  // Log area values for debugging
                  const areaValues = processedPapers.map(p => p.area);
                  const uniqueAreas = [...new Set(areaValues)];
                  console.log(`Loaded ${processedPapers.length} papers from CSV`);
                  console.log(`Found ${uniqueAreas.length} unique areas:`, uniqueAreas);
                  
                  setPapers(processedPapers);
                  setSearchResults(processedPapers);
                  
                  // Extract filter options
                  populateFilters(processedPapers);
                  
                  setIsLoading(false);
                },
                error: (error) => {
                  console.error('CSV parsing error:', error);
                  throw new Error(`Failed to parse CSV: ${error.message}`);
                }
              });
              return; // Exit early if CSV loaded successfully
            }
          } catch (error) {
            console.error('Error loading CSV data, falling back to mock data:', error);
            // Continue to mock data generation
          }
        } catch (error) {
          console.error('Error loading real data, falling back to mock data:', error);
          // Continue to mock data generation
        }
        
        // Generate mock data if CSV loading failed
        console.log("Generating mock data...");
        const mockPapers = generateMockData(500);
        setPapers(mockPapers);
        setSearchResults(mockPapers);
        
        // Extract filter options
        populateFilters(mockPapers);
        
        setIsLoading(false);
        
      } catch (error) {
        console.error('Failed to load papers:', error);
        setError(`Failed to load papers: ${error.message}`);
        
        // Final fallback: generate mock data
        const mockPapers = generateMockData(500);
        setPapers(mockPapers);
        setSearchResults(mockPapers);
        
        // Extract filter options
        populateFilters(mockPapers);
        
        setIsLoading(false);
      }
    };
    
    loadPapers();
  }, [generateMockData, populateFilters]);
  
  // Function to filter papers based on criteria
  const filterPapers = useCallback(() => {
    const query = filterSearchQuery.toLowerCase();
    
    // Filter papers based on criteria, making venue a partial match
    const filteredPapers = papers.filter(paper => 
      (!query || 
       paper.title.toLowerCase().includes(query) || 
       paper.abstract.toLowerCase().includes(query)) &&
      (!yearFilter || paper.year.toString() === yearFilter) &&
      (!venueFilter || paper.venue.toLowerCase().includes(venueFilter.toLowerCase())) &&
      (!areaFilter || paper.area === areaFilter) &&
      (!authorFilter || paper.authors.toLowerCase().includes(authorFilter.toLowerCase()))
    );
    
    // Sort by score for consistent display
    const sortedPapers = filteredPapers.sort((a, b) => b.score - a.score);
    
    setSearchResults(sortedPapers);
    
    // Update year distribution for the filtered results
    const yearCounts = _.countBy(sortedPapers, 'year');
    const distribution = Object.entries(yearCounts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    
    setYearDistribution(distribution);
    
    if (filteredPapers.length === 0) {
      console.log("No papers match the filter criteria");
    } else {
      console.log(`Filter applied successfully. Found ${filteredPapers.length} matching papers.`);
    }
  }, [papers, filterSearchQuery, yearFilter, venueFilter, areaFilter, authorFilter]);

  // Function to highlight keywords in text
  const highlightKeywords = (text) => {
    if (!text || !filterSearchQuery.trim()) return text;
    
    // Get keywords from search query
    const keywords = filterSearchQuery.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'was', 'are'].includes(word));
    
    if (keywords.length === 0) return text;
    
    // Create a regex pattern to match all keywords (with word boundaries)
    const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    
    // Replace matches with highlighted version
    return text.replace(
      pattern,
      (match) => `<span class="keyword-highlight">${match}</span>`
    );
  };

  // Render paper result card with highlighted keywords
  const renderPaperCard = (paper) => {
    // Prepare highlighted title and abstract
    const highlightedTitle = highlightKeywords(paper.title);
    const highlightedAbstract = highlightKeywords(paper.abstract);
    
    return (
      <div key={paper.id} className="paper-card">
        <h3 className="paper-title" dangerouslySetInnerHTML={{ __html: highlightedTitle }}></h3>
        <p className="paper-authors">{paper.authors}</p>
        <div className="paper-meta">
          <span className="year-tag">{paper.year}</span>
          <span className="venue-tag">{paper.venue}</span>
          {paper.area && <span className="area-tag">{paper.area}</span>}
        </div>
        <div className="paper-abstract" dangerouslySetInnerHTML={{ __html: highlightedAbstract }}></div>
        <div className="score-badge">Score: {paper.score}</div>
      </div>
    );
  };

  // Render year distribution chart
  const renderYearChart = () => {
    if (yearDistribution.length === 0) return null;
    
    // Calculate chart colors - use a gradient
    const getBarColor = (year) => {
      const minYear = Math.min(...yearDistribution.map(item => item.year));
      const maxYear = Math.max(...yearDistribution.map(item => item.year));
      const range = maxYear - minYear || 1;
      const normalizedValue = (year - minYear) / range;
      
      // Color gradient from blue to purple
      return `rgb(${Math.round(100 + normalizedValue * 80)}, ${Math.round(150 - normalizedValue * 50)}, ${Math.round(200 + normalizedValue * 55)})`;
    };
    
    return (
      <div className="year-chart-container">
        <h3>Papers by Publication Year</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yearDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis label={{ value: 'Number of Papers', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value, name) => [`${value} papers`, 'Count']} />
            <Bar dataKey="count" name="Papers">
              {yearDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.year)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="regular-search-container">
      
      {/* Search and filters */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search papers by title, abstract, or keywords..."
            value={filterSearchQuery}
            onChange={(e) => setFilterSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && filterPapers()}
          />
          <button onClick={filterPapers}>Filter</button>
        </div>
        
        {/* Filters */}
        <div className="filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Year:</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Venue:</label>
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="venue-select"
              >
                <option value="">All</option>
                {venueOptions.map(venue => (
                  <option key={venue} value={venue}>{venue}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label>Area:</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                <option value="">All</option>
                {areaOptions.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Author:</label>
              <input
                type="text"
                placeholder="Filter by author..."
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Year distribution visualization */}
      {!isLoading && !error && renderYearChart()}
      
      {/* Loading state */}
      {isLoading && (
        <div className="loading-state">
          <p>Loading papers...</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* Search results */}
      {!isLoading && !error && (
        <div className="search-results-section">
          <h2>Search Results ({searchResults.length})</h2>
          
          {searchResults.length === 0 ? (
            <p className="no-results">No papers match your search criteria. Try adjusting your filters.</p>
          ) : (
            <div className="results-grid">
              {searchResults.slice(0, 12).map(paper => renderPaperCard(paper))}
            </div>
          )}
          
          {searchResults.length > 12 && (
            <div className="pagination">
              <p>Showing 12 of {searchResults.length} results</p>
              <button>Show More</button>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .regular-search-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        h1 {
          color: #1a365d;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .search-section {
          margin-bottom: 30px;
        }
        
        .search-bar {
          display: flex;
          margin-bottom: 15px;
        }
        
        .search-bar input {
          flex-grow: 1;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 4px 0 0 4px;
          font-size: 16px;
        }
        
        .search-bar button {
          padding: 12px 20px;
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          font-size: 16px;
        }
        
        .search-bar button:hover {
          background-color: #2d4a7c;
        }
        
        .filters {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
        }
        
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .filter-row:last-child {
          margin-bottom: 0;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
        }
        
        .filter-group label {
          margin-right: 10px;
          font-weight: 500;
          width: 60px;
        }
        
        .filter-group select, .filter-group input {
          flex: 1;
          padding: 8px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          height: 38px;
          width: 100%;
          box-sizing: border-box;
        }
        
        .filter-group select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 12px;
          padding-right: 30px;
        }
        
        .year-chart-container {
          margin: 25px 0;
          padding: 15px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }
        
        .year-chart-container h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #2d4a7c;
          text-align: center;
        }
        
        .search-results-section {
          margin-top: 20px;
        }
        
        .search-results-section h2 {
          color: #2d4a7c;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        
        .results-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .paper-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          position: relative;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .paper-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .paper-title {
          font-size: 1.25rem;
          margin-top: 0;
          margin-bottom: 12px;
          color: #1a365d;
          padding-right: 60px; /* Make room for score badge */
        }
        
        .paper-authors {
          font-size: 0.95rem;
          color: #4a5568;
          margin-bottom: 12px;
        }
        
        .paper-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .year-tag, .venue-tag {
          background-color: #edf2f7;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #4a5568;
        }
        
        .area-tag {
          background-color: #e6f6ff;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #2b6cb0;
        }
        
        .paper-abstract {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 10px;
          font-size: 0.95rem;
        }
        
        .score-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background-color: #4299e1;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
        }
        
        .keyword-highlight {
          background-color: rgba(255, 220, 100, 0.4);
          border-radius: 2px;
          padding: 0 2px;
          font-weight: 500;
        }
        
        .pagination {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }
        
        .pagination button {
          padding: 8px 15px;
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .loading-state, .error-message, .no-results {
          text-align: center;
          padding: 30px;
          background-color: #f8f9fa;
          border-radius: 4px;
          margin-top: 20px;
        }
        
        .error-message {
          background-color: #fff5f5;
          color: #c53030;
        }
        
        @media (max-width: 768px) {
          .filter-row {
            flex-direction: column;
          }
          
          .filter-group {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default RegularSearch;