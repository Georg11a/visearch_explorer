import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';

const ImprovedAcademicPaperVisualization = () => {
  // State for papers data and UI controls
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('papers');
  const [activeFilters, setActiveFilters] = useState({
    task: true,
    user: true,
    technology: true,
    interaction: true,
    ecosystem: true
  });

  // State for detailed filters
  const [showDetailFilters, setShowDetailFilters] = useState({
    writingStage: false,
    writingContext: false,
    purpose: false,
    specificity: false,
    audience: false
  });

  // Reference for the visualization SVG
  const svgRef = React.useRef(null);

  // Mock data similar to the academic paper design space shown in screenshots
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      const mockPapers = [
        {
          id: 'paper-1',
          title: 'Beyond the Chat: Executable and Verifiable Text-Editing with LLMs',
          authors: 'Mina Lee, Percy Liang, Jacob Austin',
          year: 2024,
          abstract: 'This paper presents research on executable text editing with LLMs, offering verifiable editing capabilities that extend beyond traditional chat interfaces.',
          venue: 'ACL',
          tags: ['task', 'technology'],
          categories: {
            writingStage: ['revision'],
            writingContext: ['technical', 'academic'],
            purpose: ['expository'],
            specificity: ['detailed requirements'],
            audience: ['specified']
          }
        },
        {
          id: 'paper-2',
          title: 'Your Text Is Hard to Read: Facilitating Readability Awareness to Support Writing Proficiency',
          authors: 'Michelle A. Lee, Michael S. Bernstein',
          year: 2023,
          abstract: 'This paper explores how providing readability awareness can improve writing proficiency in text production by offering immediate feedback on complexity and clarity.',
          venue: 'CHI',
          tags: ['user', 'interaction'],
          categories: {
            writingStage: ['drafting', 'revision'],
            writingContext: ['academic', 'journalistic'],
            purpose: ['expository', 'narrative'],
            specificity: ['general direction'],
            audience: ['implied']
          }
        },
        {
          id: 'paper-3',
          title: 'Visualize Before You Write: Imagination-Guided Open-Ended Text Generation',
          authors: 'Alex Wang, Kendra S. Ocampo',
          year: 2023,
          abstract: 'This paper presents a novel approach to generative text writing by incorporating visualization techniques as a precursor to the writing process.',
          venue: 'NAACL',
          tags: ['technology', 'interaction'],
          categories: {
            writingStage: ['planning'],
            writingContext: ['creative'],
            purpose: ['narrative', 'descriptive'],
            specificity: ['general direction'],
            audience: ['implied']
          }
        },
        {
          id: 'paper-4',
          title: 'To Revise or Not to Revise: Learning to Detect Improvable Claims for Argumentative Writing Support',
          authors: 'Christopher Tensmeyer, Marilyn Walker',
          year: 2023,
          abstract: 'This paper introduces methods to automatically identify claims in argumentative writing that could benefit from revision, helping writers strengthen their arguments.',
          venue: 'ACL',
          tags: ['task', 'interaction'],
          categories: {
            writingStage: ['revision'],
            writingContext: ['academic'],
            purpose: ['persuasive'],
            specificity: ['detailed requirements'],
            audience: ['specified']
          }
        },
        {
          id: 'paper-5',
          title: 'Supporting Novices Author Audio Descriptions via Automatic Feedback',
          authors: 'Elaine Wu, Jeffrey P. Bigham',
          year: 2023,
          abstract: 'This paper presents a system that assists novice users in creating high-quality audio descriptions through automated feedback mechanisms.',
          venue: 'ASSETS',
          tags: ['user', 'ecosystem'],
          categories: {
            writingStage: ['drafting'],
            writingContext: ['technical'],
            purpose: ['descriptive'],
            specificity: ['detailed requirements'],
            audience: ['specified']
          }
        },
        {
          id: 'paper-6',
          title: 'Structured Persuasive Writing Support in Legal Education: A Model and Tool for German Legal Case Solutions',
          authors: 'Judith Simonis, Roman Klinger',
          year: 2023,
          abstract: 'This paper outlines a structured approach to support persuasive writing specifically for legal education, with a focus on German legal case solutions.',
          venue: 'CHI',
          tags: ['ecosystem', 'task'],
          categories: {
            writingStage: ['planning', 'drafting'],
            writingContext: ['academic', 'technical'],
            purpose: ['persuasive'],
            specificity: ['detailed requirements'],
            audience: ['specified']
          }
        },
        {
          id: 'paper-7',
          title: 'Social Dynamics of AI Support in Creative Writing',
          authors: 'Tim Smith, Lila Weng',
          year: 2023,
          abstract: 'This research examines how social dynamics change when AI writing assistants are introduced into creative writing processes and communities.',
          venue: 'CSCW',
          tags: ['user', 'ecosystem'],
          categories: {
            writingStage: ['planning', 'drafting', 'revision'],
            writingContext: ['creative'],
            purpose: ['narrative', 'descriptive'],
            specificity: ['general direction'],
            audience: ['implied']
          }
        }
      ];
      
      setPapers(mockPapers);
      setFilteredPapers(mockPapers);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter papers based on search query and active filters
  useEffect(() => {
    if (papers.length === 0) return;
    
    let results = [...papers];
    
    // Apply text search filter
    if (searchQuery.trim()) {
      results = results.filter(paper => 
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filters
    const activeTags = Object.entries(activeFilters)
      .filter(([_, isActive]) => isActive)
      .map(([tag]) => tag);
    
    if (activeTags.length > 0) {
      results = results.filter(paper => 
        paper.tags.some(tag => activeTags.includes(tag))
      );
    }
    
    setFilteredPapers(results);
  }, [searchQuery, activeFilters, papers]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Handle filter toggle
  const handleFilterToggle = (filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Handle detailed filter visibility toggle
  const handleDetailFilterToggle = (filter) => {
    setShowDetailFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Create a simple force-directed visualization when papers data changes
  useEffect(() => {
    if (isLoading || !svgRef.current || filteredPapers.length === 0) return;
    
    // D3 visualization setup
    const width = svgRef.current.clientWidth;
    const height = 500;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
      
    // Create nodes for each paper
    const nodes = filteredPapers.map((paper, i) => ({
      id: paper.id,
      radius: 8,
      paper: paper
    }));
    
    // Create links based on shared tags
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const paperA = nodes[i].paper;
        const paperB = nodes[j].paper;
        
        // Calculate how many tags they share
        const sharedTags = paperA.tags.filter(tag => paperB.tags.includes(tag));
        
        if (sharedTags.length > 0) {
          links.push({
            source: nodes[i],
            target: nodes[j],
            value: sharedTags.length
          });
        }
      }
    }
    
    // Create color scale for the nodes
    const tagColors = {
      task: '#4285F4',
      user: '#EA4335',
      technology: '#FBBC05',
      interaction: '#34A853',
      ecosystem: '#8F00FF'
    };
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 2));
    
    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value));
    
    // Create nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => {
        if (d.paper.tags.length > 0) {
          return tagColors[d.paper.tags[0]];
        }
        return "#ccc";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedPaper(d.paper);
      });
    
    // Add title tooltips
    node.append("title")
      .text(d => d.paper.title);
    
    // Highlight selected paper
    if (selectedPaper) {
      node.attr("stroke", d => d.paper.id === selectedPaper.id ? "#FF6D01" : "#fff")
          .attr("stroke-width", d => d.paper.id === selectedPaper.id ? 3 : 1.5);
    }
    
    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node
        .attr("cx", d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)))
        .attr("cy", d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y)));
    });
    
  }, [filteredPapers, isLoading, selectedPaper]);

  return (
    <div className="academic-papers-explorer">
      <div className="flex mb-6">
        <div className="flex-col w-full">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search papers by title, author, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input flex-grow"
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </form>
          
          <div className="tabs mb-6">
            <div className="tabs-list">
              <button 
                className="tab-trigger"
                onClick={() => setActiveTab('papers')}
                data-state={activeTab === 'papers' ? 'active' : ''}
              >
                Annotated Papers
              </button>
              <button 
                className="tab-trigger"
                onClick={() => setActiveTab('visualization')}
                data-state={activeTab === 'visualization' ? 'active' : ''}
              >
                Visualization
              </button>
              <button 
                className="tab-trigger"
                onClick={() => setActiveTab('details')}
                data-state={activeTab === 'details' ? 'active' : ''}
              >
                Paper Details
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="card mb-4">
            <div className="card-header">
              <h2 className="card-title">Filter by Aspects</h2>
              <p className="card-description">Select dimensions to explore</p>
            </div>
            <div className="card-content">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="filter-task" 
                    checked={activeFilters.task} 
                    onChange={() => handleFilterToggle('task')}
                  />
                  <label htmlFor="filter-task" className="flex-grow cursor-pointer">
                    <span className="badge badge-primary mr-2">Task</span>
                  </label>
                  <button 
                    className="btn btn-outline p-1"
                    onClick={() => handleDetailFilterToggle('writingStage')}
                  >
                    +
                  </button>
                </div>
                
                {showDetailFilters.writingStage && (
                  <div className="ml-6 mt-2 mb-2">
                    <div className="text-sm mb-1">Writing Stage</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="badge badge-outline">Planning</span>
                      <span className="badge badge-outline">Drafting</span>
                      <span className="badge badge-outline">Revision</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="filter-user" 
                    checked={activeFilters.user} 
                    onChange={() => handleFilterToggle('user')}
                  />
                  <label htmlFor="filter-user" className="flex-grow cursor-pointer">
                    <span className="badge" style={{backgroundColor: '#EA4335', color: 'white'}}>User</span>
                  </label>
                  <button 
                    className="btn btn-outline p-1"
                    onClick={() => handleDetailFilterToggle('writingContext')}
                  >
                    +
                  </button>
                </div>
                
                {showDetailFilters.writingContext && (
                  <div className="ml-6 mt-2 mb-2">
                    <div className="text-sm mb-1">Writing Context</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="badge badge-outline">Academic</span>
                      <span className="badge badge-outline">Technical</span>
                      <span className="badge badge-outline">Creative</span>
                      <span className="badge badge-outline">Journalistic</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="filter-technology" 
                    checked={activeFilters.technology} 
                    onChange={() => handleFilterToggle('technology')}
                  />
                  <label htmlFor="filter-technology" className="flex-grow cursor-pointer">
                    <span className="badge" style={{backgroundColor: '#FBBC05', color: 'white'}}>Technology</span>
                  </label>
                  <button 
                    className="btn btn-outline p-1"
                    onClick={() => handleDetailFilterToggle('purpose')}
                  >
                    +
                  </button>
                </div>
                
                {showDetailFilters.purpose && (
                  <div className="ml-6 mt-2 mb-2">
                    <div className="text-sm mb-1">Purpose</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="badge badge-outline">Expository</span>
                      <span className="badge badge-outline">Narrative</span>
                      <span className="badge badge-outline">Descriptive</span>
                      <span className="badge badge-outline">Persuasive</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="filter-interaction" 
                    checked={activeFilters.interaction} 
                    onChange={() => handleFilterToggle('interaction')}
                  />
                  <label htmlFor="filter-interaction" className="flex-grow cursor-pointer">
                    <span className="badge" style={{backgroundColor: '#34A853', color: 'white'}}>Interaction</span>
                  </label>
                  <button 
                    className="btn btn-outline p-1"
                    onClick={() => handleDetailFilterToggle('specificity')}
                  >
                    +
                  </button>
                </div>
                
                {showDetailFilters.specificity && (
                  <div className="ml-6 mt-2 mb-2">
                    <div className="text-sm mb-1">Specificity</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="badge badge-outline">General Direction</span>
                      <span className="badge badge-outline">Detailed Requirements</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="filter-ecosystem" 
                    checked={activeFilters.ecosystem} 
                    onChange={() => handleFilterToggle('ecosystem')}
                  />
                  <label htmlFor="filter-ecosystem" className="flex-grow cursor-pointer">
                    <span className="badge" style={{backgroundColor: '#8F00FF', color: 'white'}}>Ecosystem</span>
                  </label>
                  <button 
                    className="btn btn-outline p-1"
                    onClick={() => handleDetailFilterToggle('audience')}
                  >
                    +
                  </button>
                </div>
                
                {showDetailFilters.audience && (
                  <div className="ml-6 mt-2 mb-2">
                    <div className="text-sm mb-1">Audience</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="badge badge-outline">Specified</span>
                      <span className="badge badge-outline">Implied</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Legend</h2>
              <p className="card-description">Visualization color coding</p>
            </div>
            <div className="card-content">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-4 h-4 rounded-full" style={{backgroundColor: '#4285F4'}}></span>
                <span>Task</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-4 h-4 rounded-full" style={{backgroundColor: '#EA4335'}}></span>
                <span>User</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-4 h-4 rounded-full" style={{backgroundColor: '#FBBC05'}}></span>
                <span>Technology</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-4 h-4 rounded-full" style={{backgroundColor: '#34A853'}}></span>
                <span>Interaction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full" style={{backgroundColor: '#8F00FF'}}></span>
                <span>Ecosystem</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeTab === 'papers' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Annotated Papers</h2>
                <p className="card-description">{filteredPapers.length} papers found</p>
              </div>
              <div className="card-content">
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading papers...</p>
                  </div>
                ) : (
                  <div>
                    {filteredPapers.map(paper => (
                      <div 
                        key={paper.id} 
                        className={`paper-item ${selectedPaper && selectedPaper.id === paper.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPaper(paper)}
                      >
                        <h3 className="paper-title">{paper.title}</h3>
                        <p className="paper-authors">{paper.authors}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-wrap gap-1">
                            {paper.tags.map(tag => (
                              <span 
                                key={tag} 
                                className="badge" 
                                style={{
                                  backgroundColor: 
                                    tag === 'task' ? '#4285F4' :
                                    tag === 'user' ? '#EA4335' :
                                    tag === 'technology' ? '#FBBC05' :
                                    tag === 'interaction' ? '#34A853' :
                                    '#8F00FF',
                                  color: 'white'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm">{paper.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'visualization' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Paper Network Visualization</h2>
                <p className="card-description">Papers grouped by shared aspects and dimensions</p>
              </div>
              <div className="card-content">
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading visualization...</p>
                  </div>
                ) : (
                  <div className="visualization-container">
                    <svg ref={svgRef} className="visualization-svg"></svg>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Paper Details</h2>
                <p className="card-description">
                  {selectedPaper ? `Details for "${selectedPaper.title}"` : 'Select a paper to view details'}
                </p>
              </div>
              <div className="card-content">
                {selectedPaper ? (
                  <div className="paper-details">
                    <div className="mb-4">
                      <h3 className="text-xl font-medium mb-2">{selectedPaper.title}</h3>
                      <p className="text-base text-gray-600 mb-2">{selectedPaper.authors}</p>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="badge badge-outline">{selectedPaper.venue}</span>
                        <span className="badge badge-outline">{selectedPaper.year}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2">Abstract</h4>
                      <p className="text-base">{selectedPaper.abstract}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2">Categories</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {selectedPaper.categories && Object.entries(selectedPaper.categories).map(([category, values]) => (
                          <div key={category} className="mb-2">
                            <h5 className="font-medium mb-1 capitalize">
                              {category.replace(/([A-Z])/g, ' $1').trim()}
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {values.map(value => (
                                <span key={value} className="badge badge-outline">{value}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="btn btn-primary">Read Full Paper</button>
                      <button className="btn btn-outline">Cite</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>Select a paper from the visualization or list to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedAcademicPaperVisualization;