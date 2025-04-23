import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import * as UMAP from 'umap-js';
import { kmeans } from 'ml-kmeans';
import _ from 'lodash';
import Papa from 'papaparse';


const EnhancedAcademicPaperVisualization = () => {
  // State variables
  const [papers, setPapers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add computation state tracking for better UX
  const [computeState, setComputeState] = useState({
    umapComputed: false,
    clusteringComputed: false,
    isComputing: false,
    computingTask: null,
    progress: 0
  });
  
  // Visualization state - MODIFIED: increased height to make chart larger
  const [dimensions, setDimensions] = useState({ width: 900, height: 700 });
  const [umapResult, setUmapResult] = useState(null);
  
  // Additional state for enhanced features
  const [papersHighlighted, setPapersHighlighted] = useState([]);
  const [semanticSearchQuery, setSemanticSearchQuery] = useState('');
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(true);
  const [minScore, setMinScore] = useState(30);
  
  // Visualization controls
  const [computeClusters, setComputeClusters] = useState(true);
  const [numClusters, setNumClusters] = useState(5);
  const [colorBy, setColorBy] = useState('score');
  const [colorScheme, setColorScheme] = useState('categorical');
  
  // Refs
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  // Maintain visualization state in a ref to avoid extra re-renders
  const visualizationRef = useRef({
    isInitialized: false,
    nodesData: [],
    simulation: null,
    zoomBehavior: null,
    fixedPositions: {}
  });

  // Initialize fixed positions storage
  useEffect(() => {
    // Initialize fixed positions storage
    visualizationRef.current.fixedPositions = {};
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
        cluster: null,
        area: index % 4 === 0 ? 'NLP' : index % 4 === 1 ? 'HCI' : index % 4 === 2 ? 'Visualization' : 'AI'
      };
    });
  }, []);
  
  // Function to populate filter options
  const populateFilters = useCallback((papers) => {
    // Get unique values and sort them
    const years = [...new Set(papers.map(p => p.year))].sort().reverse();
    const venues = [...new Set(papers.map(p => p.venue))].sort();
    const areas = [...new Set(papers.map(p => p.area).filter(Boolean))].sort();
    
    // We don't set filter options state here anymore since we removed filter functionality
  }, []);
  
  // Update status function for better UX
  const updateStatus = useCallback((message, progress, isError = false) => {
    setComputeState(prev => ({
      ...prev,
      isComputing: progress < 100,
      progress: progress,
      computingTask: message
    }));
    
    if (isError) {
      setError(message);
    } else if (progress >= 100) {
      setTimeout(() => {
        setComputeState(prev => ({
          ...prev,
          computingTask: "Ready"
        }));
      }, 1000);
    }
  }, []);
  
  // Load papers - improved implementation with better error handling
useEffect(() => {
  const loadPapers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      updateStatus("Loading paper data...", 10);

      // 尝试加载数据
      try {
        updateStatus("Checking for CSV data...", 20);
        
        // 尝试从两个可能的来源加载数据
        let csvText;
        try {
          if (window.fs) {
            // 尝试使用window.fs读取
            console.log("Attempting to load CSV using window.fs...");
            csvText = await window.fs.readFile('unique_papers.csv', { encoding: 'utf8' });
            console.log("CSV loaded successfully via window.fs");
          } else {
            // 尝试从public文件夹获取
            console.log("window.fs not available, attempting to fetch from public folder...");
            const response = await fetch(`${process.env.PUBLIC_URL}/data/unique_papers.csv`);
            csvText = await response.text();
            console.log("CSV loaded successfully via fetch");
          }
          
          if (csvText) {
            updateStatus("Parsing CSV data...", 30);
            
            // 使用PapaParse解析CSV数据
            Papa.parse(csvText, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              transformHeader: header => header.toLowerCase().trim(), // 将表头转换为小写
              complete: (results) => {
                if (results.errors && results.errors.length > 0) {
                  console.error('CSV parsing errors:', results.errors);
                  throw new Error(`Failed to parse CSV: ${results.errors[0].message}`);
                }
                
                // 记录表头以便调试
                console.log("CSV Headers found:", results.meta.fields);
                
                // 处理论文数据
                const processedPapers = results.data
                  .filter(paper => paper && (paper.title || paper.id)) // 过滤无效条目
                  .map((paper, index) => {
                    // 生成稳定的随机嵌入向量
                    const seededRandom = (seed) => {
                      let m = 2**35 - 31;
                      let a = 185852;
                      let s = seed % m;
                      return function() {
                        return (s = s * a % m) / m;
                      };
                    };
                    
                    const rand = seededRandom(index * 1000); // 基于索引的种子
                    const embedding = Array.from({ length: 50 }, () => rand() * 2 - 1);
                    
                    // 确定领域字段，使用备选字段
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
                      embedding: embedding,
                      score: 0,
                      cluster: null,
                      area: areaValue
                    };
                  });
                
                // 记录区域值以便调试
                const areaValues = processedPapers.map(p => p.area);
                const uniqueAreas = [...new Set(areaValues)];
                console.log(`Loaded ${processedPapers.length} papers from CSV`);
                console.log(`Found ${uniqueAreas.length} unique areas:`, uniqueAreas);
                
                setPapers(processedPapers);
                setSearchResults(processedPapers);
                
                // 提取过滤器选项
                populateFilters(processedPapers);
                
                setIsLoading(false);
                updateStatus("Paper data loaded", 100);
              },
              error: (error) => {
                console.error('CSV parsing error:', error);
                throw new Error(`Failed to parse CSV: ${error.message}`);
              }
            });
            return; // 如果成功加载CSV就提前退出
          }
        } catch (error) {
          console.error('Error loading CSV data, falling back to mock data:', error);
          updateStatus("Error loading CSV. Using mock data...", 40);
          // 继续使用模拟数据生成
        }
      } catch (error) {
        console.error('Error loading real data, falling back to mock data:', error);
        // 继续使用模拟数据生成
      }
      
      // 如果CSV加载失败则生成模拟数据
      updateStatus("Generating mock data...", 50);
      const mockPapers = generateMockData(500);
      setPapers(mockPapers);
      setSearchResults(mockPapers);
      
      // 提取过滤器选项
      populateFilters(mockPapers);
      
      setIsLoading(false);
      updateStatus("Mock data generated", 100);
      
    } catch (error) {
      console.error('Failed to load papers:', error);
      setError(`Failed to load papers: ${error.message}`);
      
      // 最终备选：生成模拟数据
      const mockPapers = generateMockData(500);
      setPapers(mockPapers);
      setSearchResults(mockPapers);
      
      // 提取过滤器选项
      populateFilters(mockPapers);
      
      setIsLoading(false);
      updateStatus("Mock data generated as fallback", 100);
    }
  };
  
  loadPapers();
  
  // 高效处理窗口调整大小
  const updateDimensions = _.throttle(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ 
        width: Math.max(width, 300), 
        // MODIFIED: made fixed height larger to have a bigger chart canvas
        height: Math.max(height, 700) 
      });
    }
  }, 200); // 节流以避免过多重渲染
  
  window.addEventListener('resize', updateDimensions);
  
  // 初始尺寸设置，略微延迟以确保容器已渲染
  setTimeout(updateDimensions, 100);
  
  return () => {
    window.removeEventListener('resize', updateDimensions);
    // 清理任何D3模拟 - 修复以避免eslint警告
    const currentRef = visualizationRef.current;
    if (currentRef.simulation) {
      currentRef.simulation.stop();
    }
  };
}, [generateMockData, populateFilters, updateStatus]);


  
  // Memoized similarity calculation function for better performance
  const calculateSimilarity = useCallback((query, paper) => {
    if (!query) return 0.0;
    
    const queryTerms = query.toLowerCase().split(/\s+/);
    const paperText = `${paper.title} ${paper.abstract} ${paper.authors} ${paper.type}`.toLowerCase();
    
    // Calculate term frequency with optimized method
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
  }, []);

  // Optimized search handler with debounce to prevent excessive calculations
  const debouncedSearch = useMemo(() => 
    _.debounce((query, papers, calculateSimilarity) => {
      if (!query.trim()) {
        // Show all papers with stable scores
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
      
      // Calculate similarity scores and sort results with optimized approach
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
    }, 300),
    []
  );

  // Handle search form submission
  const handleSearch = useCallback((e) => {
    if (e) e.preventDefault();
    debouncedSearch(searchQuery, papers, calculateSimilarity);
  }, [searchQuery, papers, calculateSimilarity, debouncedSearch]);

  // Function to perform semantic search 
  const performSemanticSearch = useCallback(() => {
    const query = semanticSearchQuery.trim();
    if (!query) {
      // Clear previous results if query is empty
      setSearchResults(papers);
      updateStatus("Please enter a search query", 0, true);
      return;
    }
    
    updateStatus("Performing semantic search...", 30);
    
    try {
      // Using the standard similarity calculation
      const updatedPapers = papers.map(paper => {
        const score = calculateSimilarity(query, paper);
        return { ...paper, score };
      });
      
      // Sort papers by similarity score and filter by min score
      const results = [...updatedPapers]
        .sort((a, b) => b.score - a.score)
        .filter(paper => paper.score > (minScore / 100) - 0.5);
        
      setSearchResults(results);
      
      // Reset computation state when search changes
      setComputeState(prev => ({
        ...prev,
        umapComputed: false,
        clusteringComputed: false
      }));
      
      updateStatus("Search completed successfully", 100);
    } catch (error) {
      console.error("Error performing semantic search:", error);
      updateStatus("Search failed: " + error.message, 0, true);
    }
  }, [semanticSearchQuery, papers, minScore, calculateSimilarity, updateStatus]);

  // Progressive UMAP computation for initial layout only
  const runUMAP = useCallback(() => {
    if (!searchResults.length || computeState.umapComputed || computeState.isComputing) return;
    
    try {
      setComputeState(prev => ({ 
        ...prev, 
        isComputing: true, 
        computingTask: 'Computing dimension reduction (UMAP)', 
        progress: 0 
      }));
      
      // Check if all search results have valid embeddings
      const allHaveEmbeddings = searchResults.every(paper => 
        paper.embedding && Array.isArray(paper.embedding) && paper.embedding.length > 0
      );
      
      if (!allHaveEmbeddings) {
        console.warn('Some papers missing embeddings, cannot compute UMAP');
        setError('Some papers are missing embeddings data');
        setComputeState(prev => ({ 
          ...prev, 
          isComputing: false,
          computingTask: null
        }));
        return;
      }
      
      // Implement progressive computation using setTimeout to avoid blocking the UI
      const computeUMAP = async () => {
        console.log("Computing UMAP projection for initial layout only");
        
        // Extract embeddings for dimensionality reduction
        const embeddings = searchResults.map(paper => paper.embedding);
        
        // Show progressive loading steps
        for (let i = 0; i < 4; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setComputeState(prev => ({ ...prev, progress: (i + 1) * 20 }));
        }
        
        // Perform dimensionality reduction with UMAP in a separate promise to avoid UI freeze
        const result = await new Promise(resolve => {
          setTimeout(() => {
            // Configure UMAP with enhanced parameters for better visualization
            const umap = new UMAP.UMAP({
              nComponents: 2,
              nNeighbors: Math.min(15, searchResults.length - 1),
              minDist: 0.5,
              spread: 1.2,
              repulsionStrength: 1.0,
              negativeSampleRate: 5
            });
            
            const computed = umap.fit(embeddings);
            resolve(computed);
          }, 10);
        });
        
        setUmapResult(result);
        setComputeState(prev => ({ 
          ...prev, 
          umapComputed: true, 
          isComputing: false, 
          computingTask: null, 
          progress: 100 
        }));
      };
      
      computeUMAP();
      
    } catch (error) {
      console.error('UMAP error:', error);
      setError(`UMAP error: ${error.message}`);
      setComputeState(prev => ({ 
        ...prev, 
        isComputing: false, 
        computingTask: null 
      }));
    }
  }, [searchResults, computeState.umapComputed, computeState.isComputing]);
  
  // Optimized K-means clustering implementation with progress tracking
  const runKMeansClustering = useCallback(() => {
    if (!searchResults.length || !computeClusters || !umapResult || 
        computeState.clusteringComputed || computeState.isComputing) return;
    
    try {
      setComputeState(prev => ({ 
        ...prev, 
        isComputing: true, 
        computingTask: 'Computing clusters', 
        progress: 0 
      }));
      
      // Run clustering in a non-blocking way
      const computeClustering = async () => {
        console.log("Computing K-means clusters");
        
        // Extract embeddings for clustering
        const embeddings = searchResults.map(paper => paper.embedding);
        
        // Show progressive loading steps
        for (let i = 0; i < 4; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setComputeState(prev => ({ ...prev, progress: (i + 1) * 20 }));
        }
        
        // Run K-means clustering with proper parameters in a separate promise
        const clusterResult = await new Promise(resolve => {
          setTimeout(() => {
            const result = kmeans(embeddings, numClusters, {
              seed: 42, // Fixed seed for consistent results
              initialization: 'kmeans++',
              maxIterations: 100
            });
            resolve(result);
          }, 10);
        });
        
        // Update search results with cluster assignments
        const updatedResults = searchResults.map((paper, index) => ({
          ...paper,
          cluster: index < clusterResult.clusters.length ? clusterResult.clusters[index] : null
        }));
        
        setSearchResults(updatedResults);
        setComputeState(prev => ({ 
          ...prev, 
          clusteringComputed: true, 
          isComputing: false, 
          computingTask: null, 
          progress: 100
        }));
      };
      
      computeClustering();
      
    } catch (error) {
      console.error('Clustering error:', error);
      setError(`Clustering error: ${error.message}`);
      setComputeState(prev => ({ 
        ...prev, 
        isComputing: false, 
        computingTask: null 
      }));
    }
  }, [searchResults, computeClusters, numClusters, umapResult, 
       computeState.clusteringComputed, computeState.isComputing]);

  // Run UMAP when search results change and it hasn't been computed yet
  useEffect(() => {
    if (searchResults.length > 0 && !computeState.umapComputed && !computeState.isComputing) {
      runUMAP();
    }
  }, [searchResults, computeState.umapComputed, computeState.isComputing, runUMAP]);
  
  // Run clustering when UMAP is done and clustering is enabled
  useEffect(() => {
    if (computeClusters && searchResults.length > 0 && umapResult && 
        computeState.umapComputed && !computeState.clusteringComputed && !computeState.isComputing) {
      runKMeansClustering();
    }
  }, [computeClusters, searchResults.length, umapResult, 
       computeState.umapComputed, computeState.clusteringComputed, 
       computeState.isComputing, runKMeansClustering]);

  // Trigger initial search when papers are loaded
  useEffect(() => {
    if (papers.length > 0 && !isLoading) {
      handleSearch();
    }
  }, [papers, isLoading, handleSearch]);

  // Handle live semantic search (debounced)
  const debouncedSemanticSearch = useMemo(() => 
    _.debounce((query) => {
      if (liveSearchEnabled && query.trim()) {
        performSemanticSearch();
      }
    }, 500),
    [liveSearchEnabled, performSemanticSearch]
  );

  // Update search when semantic search query changes
  useEffect(() => {
    debouncedSemanticSearch(semanticSearchQuery);
  }, [semanticSearchQuery, debouncedSemanticSearch]);
  
  // Optimized D3 visualization with fixed positions and no zoom
  const visualizeResults = useCallback(() => {
    if (!svgRef.current || searchResults.length === 0 || !dimensions.width || !umapResult) {
      return;
    }
    
    try {
      const svg = d3.select(svgRef.current)
        .attr('width', '100%')
        .attr('height', dimensions.height);
      
      // Clear previous visualization only if not initialized
      if (!visualizationRef.current.isInitialized) {
        svg.selectAll('*').remove();
        
        // Create main visualization groups
        svg.append('g').attr('class', 'points-container');
        svg.append('g').attr('class', 'legend-container')
          .attr('transform', `translate(${dimensions.width - 70}, ${(dimensions.height - 200) / 2})`);
        
        // Set initialized flag
        visualizationRef.current.isInitialized = true;
      }
      
      // MODIFIED: Added wider spread for better point distribution
      // Set up scales for X and Y axes with the UMAP result
      const xExtent = d3.extent(umapResult, d => d[0]);
      const yExtent = d3.extent(umapResult, d => d[1]);
      
      // MODIFIED: Decreased padding to use more of the available space
      const padding = 40;
      
      const xScale = d3.scaleLinear()
        .domain([
          xExtent[0] - (xExtent[1] - xExtent[0]) * 0.15, // MODIFIED: increased spread
          xExtent[1] + (xExtent[1] - xExtent[0]) * 0.15  // MODIFIED: increased spread
        ])
        .range([padding, dimensions.width - padding]);
      
      const yScale = d3.scaleLinear()
        .domain([
          yExtent[0] - (yExtent[1] - yExtent[0]) * 0.15, // MODIFIED: increased spread
          yExtent[1] + (yExtent[1] - yExtent[0]) * 0.15  // MODIFIED: increased spread
        ])
        .range([dimensions.height - padding, padding]);
      
      // Define color scales based on the selected options
      let colorScale;
      
      if (colorBy === 'cluster' && computeClusters) {
        // For cluster coloring, use a categorical color scale
        const clusterValues = [...new Set(searchResults.map(d => d.cluster).filter(c => c !== null))];
        colorScale = d3.scaleOrdinal()
          .domain(clusterValues)
          .range(d3.schemeCategory10);
      } else if (colorBy === 'year') {
        // For year coloring, use a sequential scale
        const years = [...new Set(searchResults.map(d => d.year))].sort();
        colorScale = d3.scaleOrdinal()
          .domain(years)
          .range(colorScheme === 'categorical' ? d3.schemeCategory10 :
                 colorScheme === 'diverging' ? d3.schemePRGn[9] :
                 d3.schemeBlues[9]);
      } else if (colorBy === 'venue') {
        // For venue coloring, use a categorical scale
        const venues = [...new Set(searchResults.map(d => d.venue))];
        colorScale = d3.scaleOrdinal()
          .domain(venues)
          .range(d3.schemeCategory10);
      } else {
        // Improved color scale for scores
        const colorRange = colorScheme === 'diverging' 
          ? ['#7a5c55', '#b3a296', '#FFFFFF', '#a3c8c9', '#5d9ca0']
          : colorScheme === 'sequential'
            ? ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c']
            : ['#7a5c55', '#b3a296', '#FFFFFF', '#a3c8c9', '#5d9ca0']; // Default
        
        colorScale = d3.scaleLinear()
          .domain([-0.6, -0.3, 0.0, 0.3, 0.6])
          .range(colorRange)
          .clamp(true);
      }

      // MODIFIED: Slightly smaller point size for better visual clarity with more points
      const POINT_SIZE = Math.max(3, Math.min(4, 10 * (500 / searchResults.length)));
      
      // Update score color gradient legend
      const legendG = svg.select('.legend-container');
      legendG.selectAll('*').remove(); // Clear existing legend
      
      // Title
      legendG.append('text')
        .attr('x', 0)
        .attr('y', -20)
        .text(colorBy)
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle')
        .style('font-size', '12px');
      
      if (colorBy === 'cluster' && computeClusters) {
        // Cluster legend
        const clusterValues = [...new Set(searchResults.map(d => d.cluster).filter(c => c !== null))].sort((a, b) => a - b);
        
        clusterValues.forEach((cluster, i) => {
          legendG.append('circle')
            .attr('cx', 0)
            .attr('cy', i * 20)
            .attr('r', 6)
            .attr('fill', colorScale(cluster));
            
          legendG.append('text')
            .attr('x', 15)
            .attr('y', i * 20 + 4)
            .text(cluster)
            .style('font-size', '10px')
            .style('alignment-baseline', 'middle');
        });
      } else if (colorBy === 'year') {
        // Year legend
        const yearValues = [...new Set(searchResults.map(d => d.year))].sort();
        
        yearValues.forEach((year, i) => {
          legendG.append('circle')
            .attr('cx', 0)
            .attr('cy', i * 20)
            .attr('r', 6)
            .attr('fill', colorScale(year));
            
          legendG.append('text')
            .attr('x', 15)
            .attr('y', i * 20 + 4)
            .text(year)
            .style('font-size', '10px')
            .style('alignment-baseline', 'middle');
        });
      } else if (colorBy === 'venue') {
        // Venue legend - show only top 10 venues to avoid overcrowding
        const venueCounts = _.countBy(searchResults, 'venue');
        const topVenues = Object.entries(venueCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([venue]) => venue);
        
        topVenues.forEach((venue, i) => {
          legendG.append('circle')
            .attr('cx', 0)
            .attr('cy', i * 20)
            .attr('r', 6)
            .attr('fill', colorScale(venue));
            
          legendG.append('text')
            .attr('x', 15)
            .attr('y', i * 20 + 4)
            .text(venue.length > 15 ? venue.substring(0, 12) + '...' : venue)
            .style('font-size', '10px')
            .style('alignment-baseline', 'middle');
        });
      } else {
        // Score gradient legend
        const gradientHeight = 200;
        const gradientWidth = 30;
        
        // Create gradient
        const defs = svg.select('defs');
        if (defs.empty()) {
          svg.append('defs');
        }
        
        const gradientId = 'score-gradient-' + Date.now(); // Unique ID to avoid conflicts
        const gradient = svg.select('defs').append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('y1', '100%')
          .attr('x2', '0%')
          .attr('y2', '0%');
        
        // Add gradient stops
        const stops = [
          { offset: '0%', color: colorScale(-0.6) },
          { offset: '25%', color: colorScale(-0.3) },
          { offset: '50%', color: colorScale(0.0) },
          { offset: '75%', color: colorScale(0.3) },
          { offset: '100%', color: colorScale(0.6) }
        ];
        
        stops.forEach(stop => {
          gradient.append('stop')
            .attr('offset', stop.offset)
            .attr('stop-color', stop.color);
        });
        
        // Draw gradient rectangle
        legendG.append('rect')
          .attr('width', gradientWidth)
          .attr('height', gradientHeight)
          .style('fill', `url(#${gradientId})`);
        
        // Add scale ticks
        const ticks = [-0.6, -0.3, 0.0, 0.3, 0.6];
        ticks.forEach(tick => {
          const y = gradientHeight * (1 - ((tick + 0.6) / 1.2));
          
          legendG.append('line')
            .attr('x1', gradientWidth)
            .attr('y1', y)
            .attr('x2', gradientWidth + 5)
            .attr('y2', y)
            .style('stroke', 'black')
            .style('stroke-width', 1);
          
          legendG.append('text')
            .attr('x', gradientWidth + 10)
            .attr('y', y + 4)
            .text(tick.toFixed(1))
            .style('font-size', '10px')
            .style('alignment-baseline', 'middle');
        });
      }
      
      // Make sure tooltip exists
      let tooltip = d3.select('body').select('.tooltip');
      if (tooltip.empty()) {
        tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background-color', 'white')
          .style('border', 'solid')
          .style('border-width', '1px')
          .style('border-radius', '5px')
          .style('padding', '10px')
          .style('pointer-events', 'none')
          .style('z-index', '10')
          .style('transition', 'opacity 0.2s');
      }
      
      // MODIFIED: Generate fixed positions for papers with better distribution
      if (!visualizationRef.current.fixedPositions || Object.keys(visualizationRef.current.fixedPositions).length === 0) {
        visualizationRef.current.fixedPositions = {};
        
        // Generate fixed positions based on UMAP if available, otherwise use random positions
        searchResults.forEach((paper, i) => {
          // Use the paper ID to generate a stable position
          const idHash = parseInt(paper.id.split('-').pop() || '0', 10);
          
          // Add more jitter for better distribution
          const jitter = {
            x: Math.sin(idHash * 0.1) * 30,  // MODIFIED: increased jitter amount
            y: Math.cos(idHash * 0.1) * 30   // MODIFIED: increased jitter amount
          };
          
          // Use the initial UMAP embedding for initial layout if available
          const x = i < umapResult.length 
            ? xScale(umapResult[i][0]) + jitter.x
            : padding + (dimensions.width - 2 * padding) * (Math.sin(idHash * 0.01) * 0.4 + 0.5);
            
          const y = i < umapResult.length
            ? yScale(umapResult[i][1]) + jitter.y
            : padding + (dimensions.height - 2 * padding) * (Math.cos(idHash * 0.01) * 0.4 + 0.5);
          
          visualizationRef.current.fixedPositions[paper.id] = { x, y };
        });
      }
      
      // Get points container
      const pointsG = svg.select('.points-container');
      
      // Prepare data with fixed positions
      const nodesData = searchResults.map(paper => {
        // Use fixed position or generate one if needed
        let position = visualizationRef.current.fixedPositions[paper.id];
        
        // If paper doesn't have a fixed position yet (new paper), create one
        if (!position) {
          const idHash = parseInt(paper.id.split('-').pop() || '0', 10);
          position = {
            x: padding + (dimensions.width - 2 * padding) * (Math.sin(idHash * 0.01) * 0.4 + 0.5),
            y: padding + (dimensions.height - 2 * padding) * (Math.cos(idHash * 0.01) * 0.4 + 0.5)
          };
          visualizationRef.current.fixedPositions[paper.id] = position;
        }
        
        return {
          ...paper,
          x: position.x,
          y: position.y
        };
      });
      
      // Store for future reference
      visualizationRef.current.nodesData = nodesData;
      
      // Optimized D3 enter/update/exit pattern
      // Join data to circles using the paper id as the key
      const circles = pointsG.selectAll('circle')
        .data(nodesData, d => d.id);
      
      // ENTER selection: new circles
      const enterCircles = circles.enter()
        .append('circle')
        .attr('r', 0) // Start small for animation
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .style('opacity', 0)
        .attr('stroke', 'none')
        .attr('stroke-width', 0);
      
      // ENTER + UPDATE selection: all circles
      // For existing circles, only update the fill color based on score - no position change
      enterCircles.merge(circles)
        .transition()
        .duration(750)
        .attr('r', d => selectedPaper && d.id === selectedPaper.id ? POINT_SIZE * 1.5 : POINT_SIZE) 
        .attr('cx', d => d.x) // Use fixed position
        .attr('cy', d => d.y) // Use fixed position
        .attr('fill', d => {
          if (selectedPaper && d.id === selectedPaper.id) {
            return '#ff6600'; 
          } else if (colorBy === 'cluster' && computeClusters) {
            return d.cluster !== null ? colorScale(d.cluster) : '#cccccc';
          } else if (colorBy === 'year') {
            return colorScale(d.year);
          } else if (colorBy === 'venue') {
            return colorScale(d.venue);
          } else {
            return colorScale(d.score);
          }
        })
        .attr('stroke', d => selectedPaper && d.id === selectedPaper.id ? '#ff6600' : 'none')
        .attr('stroke-width', d => selectedPaper && d.id === selectedPaper.id ? 2 : 0)
        .style('opacity', d => selectedPaper && d.id === selectedPaper.id ? 1 : 0.8) 
        .style('cursor', 'pointer');
      
      // EXIT selection: circles to remove
      circles.exit()
        .transition()
        .duration(750)
        .attr('r', 0)
        .style('opacity', 0)
        .remove();
      
      // Update event handlers for all circles
      pointsG.selectAll('circle')
        .on('click', (event, d) => {
          event.stopPropagation(); // Prevent brush clearing
          setSelectedPaper(d);
        })
        .on('mouseover', function(event, d) {
          // Highlight circle
          d3.select(this)
            .transition()
            .duration(100)
            .attr('stroke-width', 2)
            .attr('stroke', '#ff6600');
          
          // Show tooltip with paper info
          tooltip
            .transition()
            .duration(200)
            .style('opacity', 0.9);
            
          // Format the tooltip content
          const tooltipContent = `
            <strong>${d.title}</strong><br/>
            ${d.authors}<br/>
            ${d.year}${d.cluster !== null ? `<br/>Cluster: ${d.cluster}` : ''}
            ${d.score !== undefined ? `<br/>Score: ${d.score.toFixed(2)}` : ''}
            ${d.area ? `<br/>Area: ${d.area}` : ''}
          `;
          
          tooltip.html(tooltipContent)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(event, d) {
          // Reset circle highlight
          d3.select(this)
            .transition()
            .duration(100)
            .attr('stroke-width', selectedPaper && d.id === selectedPaper.id ? 2 : 0)
            .attr('stroke', selectedPaper && d.id === selectedPaper.id ? '#ff6600' : 'none');
          
          // Hide tooltip
          tooltip.transition()
            .duration(200)
            .style('opacity', 0);
        });
        
      // Clear brush and selection on background click
      // Clear brush and selection on background click
      svg.on('click', function(event) {
        if (event.target.tagName === 'svg' || event.target.classList.contains('background')) {
          // Remove the brush clearing code since brush is undefined
          setPapersHighlighted([]);
        }
      });
        
      // Display results count and status
      svg.selectAll('.status-text').remove();
      svg.append('text')
        .attr('class', 'status-text')
        .attr('x', 10)
        .attr('y', 20)
        .text(`${searchResults.length} results found. ${computeClusters && computeState.clusteringComputed ? `Clustered into ${numClusters} groups. ` : ''}Click on a point to view paper details.`)
        .style('font-size', '14px')
        .style('fill', '#333');

    } catch (error) {
      console.error('Visualization error:', error);
      setError(`Visualization error: ${error.message}`);
    }
  }, [searchResults, dimensions, selectedPaper, computeClusters, colorBy, colorScheme, umapResult, 
     computeState.clusteringComputed, numClusters, papers]);

  // Update visualization when data or dimensions change
  useEffect(() => {
    if (!isLoading && umapResult && !computeState.isComputing) {
      visualizeResults();
    }
  }, [isLoading, visualizeResults, umapResult, computeState.isComputing]);

  // Reset clusters when computeClusters changes
  useEffect(() => {
    if (!computeClusters) {
      // Clear cluster assignments
      setSearchResults(prev => prev.map(paper => ({ ...paper, cluster: null })));
      setComputeState(prev => ({ ...prev, clusteringComputed: false }));
    } else if (computeClusters && umapResult && computeState.umapComputed && !computeState.clusteringComputed && !computeState.isComputing) {
      // Recompute clusters if enabled
      runKMeansClustering();
    }
  }, [computeClusters, umapResult, computeState.umapComputed, computeState.clusteringComputed, computeState.isComputing, runKMeansClustering]);
  
  // Render loading progress for computations
  const renderComputeProgress = () => {
    if (!computeState.isComputing && !isLoading) return null;
    
    return (
      <div className="computation-overlay">
        <div className="computation-card">
          <p className="computation-message">
            {computeState.computingTask || "Loading..."}
          </p>
          <div className="progress-container">
            <div 
              className="progress-bar"
              style={{ width: `${computeState.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };
  
  // Function to highlight keywords in text
  const highlightKeywords = useCallback((text) => {
    if (!text || !semanticSearchQuery.trim()) return text;
    
    // Get keywords from search query
    const keywords = semanticSearchQuery.toLowerCase()
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
  }, [semanticSearchQuery]);

  // Render paper details
  const renderPaperDetails = () => {
    if (!selectedPaper) {
      return <p>Select a paper from the visualization to view details</p>;
    }
    
    // Prepare highlighted title and abstract
    const highlightedTitle = highlightKeywords(selectedPaper.title);
    const highlightedAbstract = highlightKeywords(selectedPaper.abstract);
    
    return (
      <div className="paper-details">
        <h3 dangerouslySetInnerHTML={{ __html: highlightedTitle }}></h3>
        <p><strong>Authors:</strong> {selectedPaper.authors}</p>
        <p><strong>Year:</strong> {selectedPaper.year}</p>
        <p><strong>Venue:</strong> {selectedPaper.venue}</p>
        {selectedPaper.area && (
          <p><strong>Area:</strong> {selectedPaper.area}</p>
        )}
        {selectedPaper.cluster !== null && (
          <p><strong>Cluster:</strong> {selectedPaper.cluster}</p>
        )}
        {selectedPaper.score !== 0 && (
          <p><strong>Similarity Score:</strong> {(selectedPaper.score * 100).toFixed(1)}%</p>
        )}
        <div className="abstract-section">
          <h4>Abstract</h4>
          <p dangerouslySetInnerHTML={{ __html: highlightedAbstract }}></p>
        </div>
        <div className="actions">
          <a href={selectedPaper.link} className="action-button primary" target="_blank" rel="noopener noreferrer">View Paper</a>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container">
      
      {/* Semantic search bar */}
      <div className="semantic-search">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search papers by semantic similarity..."
            value={semanticSearchQuery}
            onChange={(e) => setSemanticSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSemanticSearch()}
          />
          <button onClick={performSemanticSearch}>Search</button>
        </div>
        <div className="search-options">
          <label>
            <input
              type="checkbox"
              checked={liveSearchEnabled}
              onChange={(e) => setLiveSearchEnabled(e.target.checked)}
            />
            Live Search
          </label>
          <div className="option-group">
            <label>Min Score:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
            />
            <span>{minScore}%</span>
          </div>
        </div>
      </div>

      {/* Visualization options */}
      <div className="filters">
        <div className="filter-group">
          <label>Enable Clustering:</label>
          <input
            type="checkbox"
            checked={computeClusters}
            onChange={(e) => setComputeClusters(e.target.checked)}
          />
        </div>
        <div className="filter-group">
          <label>Number of clusters:</label>
          <input
            type="range"
            min="2"
            max="10"
            value={numClusters}
            onChange={(e) => setNumClusters(parseInt(e.target.value))}
          />
          <span>{numClusters}</span>
        </div>
        <div className="filter-group">
          <label>Color by:</label>
          <select
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value)}
          >
            <option value="score">Relevance Score</option>
            <option value="cluster">Cluster</option>
            <option value="year">Year</option>
            <option value="venue">Venue</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Color scheme:</label>
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value)}
          >
            <option value="categorical">Categorical</option>
            <option value="diverging">Diverging</option>
            <option value="sequential">Sequential</option>
          </select>
        </div>
      </div>

      {/* Error message display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {/* MODIFIED: Changed layout to make visualization larger and details smaller */}
      <div className="main-content">
        <div className="visualization-section">
          <h2>Paper Similarity Visualization</h2>
          <div className="visualization-container" ref={containerRef}>
            <svg 
              ref={svgRef} 
              className="visualization-svg"
              style={{ height: dimensions.height + 'px' }}
            ></svg>
            
            {/* Show computation state when no results yet */}
            {(!umapResult && !isLoading) && (
              <div className="empty-state">
                <p>No visualization data available. Try a search query.</p>
              </div>
            )}
          </div>
          
          <div className="computation-status">
            <div className="progress-container">
              <div 
                className="progress-bar"
                style={{ width: `${computeState.progress}%` }}
              ></div>
            </div>
            <p>{computeState.computingTask || (isLoading ? "Loading papers..." : "Ready")}</p>
          </div>
        </div>
        
        <div className="paper-details-section">
          <h2>Paper Details</h2>
          <div className="paper-details-container">
            {renderPaperDetails()}
          </div>
        </div>
      </div>
      
      {/* MODIFIED: Moved Top Search Results below main content */}
      <TopSearchResults 
        searchResults={searchResults}
        onPaperSelect={setSelectedPaper}
      />
      
      {/* Render highlighted papers */}
      {papersHighlighted.length > 0 && (
        <div className="highlighted-papers">
          <h2>Selected Papers ({papersHighlighted.length})</h2>
          <div className="papers-grid">
            {papersHighlighted.slice(0, 5).map(paper => {
              const normalizedScore = ((paper.score + 0.6) / 1.2).toFixed(2);
              
              return(
              <div key={paper.id} className="paper-card">
                <h3>{paper.title}</h3>
                <p>{paper.authors}</p>
                <p>{paper.year} | {paper.venue}</p>
                {paper.score !== 0 && (
                  <p className="score">{(paper.score * 100).toFixed(1)}% similarity</p>
                )}
              </div>
              );
              })}
            {papersHighlighted.length > 5 && (
              <p>And {papersHighlighted.length - 5} more papers selected...</p>
            )}
          </div>
        </div>
      )}
      
      {/* Render computation progress overlay */}
      {renderComputeProgress()}

      <style jsx>{`
      .container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      h1 {
        text-align: center;
        color: #2c5282;
        margin-bottom: 30px;
      }

      h2 {
        color: #2a4365;
        margin-top: 20px;
        margin-bottom: 15px;
      }

      .semantic-search, .search-bar {
        margin-bottom: 20px;
      }

      .search-bar {
        display: flex;
        margin-bottom: 15px;
      }

      .search-bar input {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid #cbd5e0;
        border-radius: 4px 0 0 4px;
        font-size: 16px;
      }

      .search-bar button {
        padding: 10px 20px;
        background-color: #4299e1;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
        font-size: 16px;
      }

      .search-bar button:hover {
        background-color: #3182ce;
      }

      .search-options {
        display: flex;
        align-items: center;
        margin-top: 10px;
        gap: 20px;
      }

      .option-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        margin-bottom: 20px;
        padding: 15px;
        background-color: #f7fafc;
        border-radius: 4px;
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .filter-group select, .filter-group input {
        padding: 8px;
        border: 1px solid #cbd5e0;
        border-radius: 4px;
      }

      .viz-options {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
        padding: 15px;
        background-color: #f7fafc;
        border-radius: 4px;
      }

      /* MODIFIED: Changed layout to make visualization larger and details smaller */
      .main-content {
        display: grid;
        grid-template-columns: 3fr 1fr; /* MODIFIED: changed from 1fr 1fr to 3fr 1fr */
        gap: 20px;
        margin-bottom: 30px;
      }

      .visualization-container {
        height: 700px; /* MODIFIED: increased from 600px to 700px */
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        position: relative;
        background-color: #f8fafc;
      }

      .visualization-svg {
        width: 100%;
      }

      .empty-state {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(247, 250, 252, 0.8);
      }

      .computation-status {
        margin-top: 10px;
      }

      .progress-container {
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 4px;
        margin-bottom: 5px;
      }

      .progress-bar {
        height: 100%;
        background-color: #4299e1;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      /* MODIFIED: Made paper details smaller */
      .paper-details-container {
        padding: 15px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background-color: white;
        height: 700px; /* MODIFIED: increased from 600px to 700px to match visualization */
        overflow-y: auto;
        font-size: 14px; /* MODIFIED: reduced font size */
      }

      .paper-details h3 {
        margin-top: 0;
        color: #2c5282;
        font-size: 16px; /* MODIFIED: reduced font size */
      }
      
      .keyword-highlight {
        background-color: rgba(255, 220, 100, 0.4);
        border-radius: 2px;
        padding: 0 2px;
        font-weight: 500;
      }

      .abstract-section {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      }

      .abstract-section h4 {
        font-size: 14px; /* MODIFIED: reduced font size */
        margin-bottom: 5px;
      }

      .paper-details p {
        margin: 5px 0; /* MODIFIED: reduced margins */
      }

      .actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
      }

      .action-button {
        padding: 6px 12px; /* MODIFIED: reduced padding */
        border-radius: 4px;
        text-decoration: none;
        display: inline-block;
        font-size: 12px; /* MODIFIED: reduced font size */
      }

      .action-button.primary {
        background-color: #4299e1;
        color: white;
      }

      .highlighted-papers {
        margin-top: 30px;
      }

      .papers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .paper-card {
        padding: 15px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background-color: white;
        transition: box-shadow 0.3s ease;
      }

      .paper-card:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .paper-card h3 {
        margin-top: 0;
        font-size: 16px;
        color: #2c5282;
      }

      .score {
        display: inline-block;
        padding: 4px 8px;
        background-color: #ebf8ff;
        border-radius: 4px;
        color: #2b6cb0;
        font-weight: bold;
        font-size: 14px;
      }

      .computation-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .computation-card {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 80%;
        max-width: 400px;
      }

      .computation-message {
        text-align: center;
        margin-bottom: 15px;
      }

      .error-message {
        padding: 10px 15px;
        background-color: #fed7d7;
        border: 1px solid #fc8181;
        border-radius: 4px;
        color: #c53030;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .error-message button {
        background: none;
        border: none;
        color: #c53030;
        font-size: 20px;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .main-content {
          grid-template-columns: 1fr;
        }
        
        .papers-grid {
          grid-template-columns: 1fr;
        }
      }
      `}</style>
    </div>
  );
};

// Component for displaying top search results (continued)
const TopSearchResults = ({ searchResults, onPaperSelect }) => {
  // Take only top 8 papers by score
  const topPapers = [...searchResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

    const normalizeScore = (score) => {
      return ((score + 0.6) / 1.2).toFixed(2);
    };

    return (
      <div className="top-results">
        <h2>Top Search Results</h2>
        {topPapers.length > 0 ? (
          <div className="top-papers-grid">
            {topPapers.map((paper) => (
              <div 
                key={paper.id} 
                className="top-paper-card"
                onClick={() => onPaperSelect(paper)}
              >
                <h3>{paper.title}</h3>
                <p className="authors">{paper.authors}</p>
                <div className="paper-meta">
                  <span>{paper.year}</span>
                  <span>{paper.venue}</span>
                  {paper.area && <span className="area-tag">{paper.area}</span>}
                </div>
                <div className="score-badge">
                  Score: {normalizeScore(paper.score)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No results found. Try adjusting your search criteria.</p>
        )}
        <style jsx>{`
        .top-results {
          margin-top: 30px;
          margin-bottom: 30px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        
        .top-papers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .top-paper-card {
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: white;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .top-paper-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: #4299e1;
        }
        
        .top-paper-card h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #2c5282;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .authors {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .paper-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
          color: #718096;
        }
        
        .paper-meta span {
          display: inline-block;
          padding: 2px 6px;
          background-color: #edf2f7;
          border-radius: 4px;
        }
        
        .area-tag {
          background-color: #ebf4ff !important;
          color: #3182ce !important;
        }
        
        .score-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #4299e1;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        @media (max-width: 640px) {
          .top-papers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      </div>
    );
  };

export default EnhancedAcademicPaperVisualization;