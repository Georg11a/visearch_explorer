// PaperDataLoader.js
// Responsible for loading, parsing, and processing paper data
import Papa from 'papaparse';

/**
 * Generate mock paper data
 * @param {number} count - Number of papers to generate
 * @returns {Array} - Array of mock paper data
 */
export const generateMockData = (count = 500) => {
  console.log("Generating mock data");
  
  const seededRandom = (seed) => {
    let m = 2**35 - 31;
    let a = 185852;
    let s = seed % m;
    return function() {
      return (s = s * a % m) / m;
    };
  };
  
  const rand = seededRandom(123456); // Fixed seed for consistency
  
  return Array.from({ length: count }, (_, index) => {
    // Generate stable embeddings using the seeded random function
    const embedding = Array.from({ length: 50 }, () => rand() * 2 - 1);
    
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
      } through innovative methods.`,
      venue: `Conference ${index % 5 + 1}`,
      year: 2020 + (index % 5),
      type: index % 3 === 0 ? 'Full Paper' : index % 3 === 1 ? 'Short Paper' : 'Poster',
      link: `#paper-${index}`,
      embedding: embedding,
      score: 0,
      cluster: null
    };
  });
};

/**
 * Load CSV file and process paper data
 * @param {Function} setLoadingStatus - Function to update loading status
 * @param {Function} setIsLoading - Function to update loading state
 * @param {Function} setError - Function to update error state
 * @param {Function} setPapers - Function to update papers data
 * @param {Function} setSearchResults - Function to update search results
 * @returns {Promise} - Promise that resolves when loading is complete
 */
export const loadPaperData = async (setLoadingStatus, setIsLoading, setError, setPapers, setSearchResults) => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Try to load CSV from file system if using window.fs API
    try {
      if (window.fs) {
        // Try to read a CSV file from various possible locations
        const possiblePaths = [
          'unique_papers.csv',
          '/unique_papers.csv',
          'data/unique_papers.csv',
          '/data/unique_papers.csv',
          'public/data/unique_papers.csv',
          '/public/data/unique_papers.csv',
          './unique_papers.csv'
        ];
        
        let loadedCsv = false;
        
        for (const path of possiblePaths) {
          try {
            console.log(`Attempting to load CSV from: ${path}`);
            const response = await window.fs.readFile(path, { encoding: 'utf8' });
            
            if (response) {
              console.log(`Successfully loaded CSV from: ${path}`);
              // Parse CSV data
              Papa.parse(response, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                  if (results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    if (results.errors.length < results.data.length) {
                      console.warn('Some parsing errors occurred, but continuing with valid data');
                    } else {
                      throw new Error(`Failed to parse CSV: ${results.errors[0].message}`);
                    }
                  }
                  
                  // Process the paper data
                  const processedPapers = results.data
                    .filter(paper => paper && (paper.title || paper.id))
                    .map((paper, index) => {
                      // Generate embeddings (would normally be from the CSV)
                      const seededRandom = (seed) => {
                        let m = 2**35 - 31;
                        let a = 185852;
                        let s = seed % m;
                        return function() {
                          return (s = s * a % m) / m;
                        };
                      };
                      
                      const rand = seededRandom(index * 1000);
                      const embedding = Array.from({ length: 50 }, () => rand() * 2 - 1);
                      
                      return {
                        id: paper.id || `paper-${index}`,
                        title: paper.title || `Paper ${index}`,
                        authors: paper.authors || 'Unknown Authors',
                        abstract: paper.abstract || 'No abstract available',
                        venue: paper.venue || paper.conference || 'Unknown Venue',
                        year: paper.year || new Date().getFullYear(),
                        type: paper.type || 'Research Paper',
                        link: paper.url || paper.link || `#paper-${index}`,
                        doi: paper.doi || null,
                        area: paper.area || null,
                        publisher: paper.publisher || null,
                        embedding: embedding,
                        score: 0,
                        cluster: null
                      };
                    });
                  
                  console.log(`Loaded ${processedPapers.length} papers from CSV`);
                  setPapers(processedPapers);
                  setSearchResults(processedPapers);
                  setIsLoading(false);
                },
                error: (error) => {
                  console.error('CSV parsing error:', error);
                  throw new Error(`Failed to parse CSV: ${error.message}`);
                }
              });
              
              loadedCsv = true;
              break; // Exit loop after successful load
            }
          } catch (err) {
            console.error(`Error loading from ${path}:`, err);
          }
        }
        
        if (!loadedCsv) {
          // If no CSV was successfully loaded, throw an error
          throw new Error('No CSV file found or could not be parsed');
        }
      } else {
        throw new Error('window.fs API not available');
      }
    } catch (error) {
      console.log('Error loading CSV, falling back to mock data:', error);
      // Generate mock data as fallback
      const mockPapers = generateMockData(500);
      setPapers(mockPapers);
      setSearchResults(mockPapers);
      setIsLoading(false);
    }
  } catch (error) {
    console.error('Failed to load papers:', error);
    setError(`Failed to load papers: ${error.message}`);
    
    // Generate mock data as ultimate fallback
    const mockPapers = generateMockData(500);
    setPapers(mockPapers);
    setSearchResults(mockPapers);
    setIsLoading(false);
  }
};

/**
 * Calculate similarity score
 * @param {string} query - Search query
 * @param {Object} paper - Paper object
 * @returns {number} - Similarity score
 */
export const calculateSimilarity = (query, paper) => {
  if (!query) return 0.0;
  
  const queryTerms = query.toLowerCase().split(/\s+/);
  const paperText = `${paper.title} ${paper.abstract} ${paper.authors} ${paper.type}`.toLowerCase();
  
  // Calculate term frequency
  let matchCount = 0;
  const termCounts = {};
  
  // Count all terms at once for efficiency
  queryTerms.forEach(term => {
    if (term.length > 2) {
      if (!termCounts[term]) {
        const regex = new RegExp(term, 'gi');
        const matches = paperText.match(regex);
        termCounts[term] = matches ? matches.length : 0;
        matchCount += termCounts[term];
        
        // Boost score for title matches
        if (paper.title.toLowerCase().includes(term)) {
          matchCount += 3;
        }
      }
    }
  });
  
  // Stable scoring based on paper ID and query
  const paperIdHash = parseInt(paper.id.split('-').pop() || '0', 10);
  const queryHash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const stableFactor = (Math.sin(paperIdHash * 0.1 + queryHash * 0.01) * 0.2);
  
  // Normalize score between -0.6 and 0.6
  return Math.min(0.6, (matchCount / (queryTerms.length * 3 || 1)) * 1.2) + stableFactor;
};

/**
 * Search papers
 * @param {string} query - Search query
 * @param {Array} papers - Array of papers
 * @param {Function} setSearchResults - Function to update search results
 * @param {Function} setSelectedPaper - Function to update selected paper
 * @param {Function} setComputeState - Function to update compute state
 */
export const searchPapers = (query, papers, setSearchResults, setSelectedPaper, setComputeState) => {
  if (!query.trim()) {
    // Show all papers with stable scores when no query
    const results = papers.map(paper => {
      const idHash = parseInt(paper.id.split('-').pop() || '0', 10);
      const stableScore = (Math.sin(idHash * 0.1) * 1.2) - 0.6;
      return { ...paper, score: stableScore, cluster: null };
    });
    
    setSearchResults(results);
    
    // Reset computation state when search changes
    setComputeState(prev => ({
      ...prev,
      umapComputed: false,
      clusteringComputed: false
    }));
    return;
  }
  
  // Calculate similarity scores and sort results
  const results = papers.map(paper => {
    const score = calculateSimilarity(query, paper);
    return { ...paper, score, cluster: null };
  })
  .sort((a, b) => b.score - a.score);
  
  setSearchResults(results);
  
  // Select the top result
  if (results.length > 0) {
    setSelectedPaper(results[0]);
  } else {
    setSelectedPaper(null);
  }
  
  // Reset computation state when search changes
  setComputeState(prev => ({
    ...prev,
    umapComputed: false,
    clusteringComputed: false
  }));
};