// keywordExtractor.js - Advanced keyword extraction for academic papers

// Define AI and research-specific stopwords to filter out common terminology
export const aiStopwords = [
  // AI/ML specific
  'ai', 'artificial', 'intelligence', 'ml', 'machine', 'learning',
  'dl', 'deep', 'neural', 'network', 'networks', 'layer', 'layers',
  'model', 'models', 'pretrained', 'pretraining', 'fine-tune', 'finetune', 'finetuning',
  'training', 'trained', 'train', 'test', 'testing', 'validation', 'cross-validation',
  
  'algorithm', 'algorithms', 'method', 'methods', 'approach', 'approaches',
  'baseline', 'baselines', 'state-of-the-art', 'sota',
  
  'parameter', 'parameters', 'hyperparameter', 'hyperparameters',
  'weight', 'weights', 'bias', 'biases', 'gradient', 'gradients',
  'loss', 'losses', 'objective', 'function', 'functions', 'activation', 'relu', 'sigmoid', 'softmax',
  'dropout', 'batchnorm', 'normalization', 'regularization',
  'optimizer', 'optimizers', 'optimization', 'sgd', 'adam',

  'supervised', 'unsupervised', 'semi-supervised', 'self-supervised',
  'classification', 'regression', 'clustering', 'segmentation', 'detection',

  'prediction', 'predict', 'predictive', 'inference', 'infer', 'inferencing',
  'embedding', 'embeddings', 'vector', 'vectors', 'dimension', 'dimensions',
  'feature', 'features', 'representation', 'representations',
  
  'transformer', 'transformers', 'attention', 'self-attention', 'positional',
  'llm', 'llms', 'large', 'language', 'model', 'models',
  'pretrain', 'prompt', 'prompting', 'instruction', 'instruction-tuning',
  
  'nlp', 'natural', 'language', 'processing', 'text', 'token', 'tokens', 'tokenization', 'vocab',
  'linguistic', 'semantic', 'syntax', 'parsing', 'generation',

  'cv', 'computer', 'vision', 'image', 'images', 'object', 'objects', 'detection', 'segmentation',
  'classification', 'recognition', 'augmentation', 'preprocessing',

  'rl', 'reinforcement', 'reward', 'agent', 'agents', 'environment', 'policy', 'policies',
  'decision', 'decisions', 'decision-making', 'exploration', 'exploitation',
  'value', 'q-value', 'advantage', 'trajectory',

  'graph', 'graphs', 'gnn', 'gcn', 'node', 'nodes', 'edge', 'edges', 'embedding',

  'generative', 'generation', 'gan', 'gans', 'vae', 'diffusion', 'sampling', 'decoder', 'encoder',
  'autoencoder', 'autoregressive', 'decoder-only', 'seq2seq',

  'framework', 'frameworks', 'library', 'libraries', 'pytorch', 'tensorflow', 'jax', 'huggingface',

  'benchmark', 'benchmarks', 'dataset', 'datasets', 'split', 'label', 'labels',
  'metric', 'metrics', 'accuracy', 'precision', 'recall', 'f1', 'auc', 'loss',
  'overfitting', 'underfitting', 'generalization', 'bias', 'variance',
  
  'scalable', 'scalability', 'efficient', 'efficiency', 'performance', 'speedup',
  'compute', 'computational', 'latency', 'throughput',
  
  'hardware', 'gpu', 'gpus', 'tpu', 'cpu', 'memory', 'storage', 'infrastructure',
  
  // Common research paper terms
  'which', 'based', 'making', 'using', 'used', 'approach', 'method', 'methods',
  'technique', 'techniques', 'system', 'systems', 'framework', 'frameworks',
  'architecture', 'architectures', 'model', 'models', 'algorithm', 'algorithms',
  'design', 'designed', 'develop', 'developed', 'development', 'build', 'built',
  'propose', 'proposed', 'introduce', 'introduced', 'novel', 'new',
  'paper', 'research', 'study', 'studies', 'work', 'works', 'literature',
  'implement', 'implementation', 'perform', 'performance', 'result', 'results',
  'evaluate', 'evaluation', 'measure', 'measurement', 'metrics',
  'analysis', 'analyze', 'analyses', 'present', 'presents', 'presented',
  'show', 'shows', 'shown', 'demonstrate', 'demonstrates', 'demonstrated',
  'experiment', 'experiments', 'experimental',
  'dataset', 'datasets', 'data', 'information', 'knowledge',
  'task', 'tasks', 'problem', 'problems', 'issue', 'issues',
  'solution', 'solutions', 'solve', 'solving',
  'application', 'applications', 'applied', 'usage', 'utilize', 'utilized',
  'field', 'fields', 'area', 'areas', 'domain', 'domains',
  'current', 'existing', 'previous', 'prior', 'recent', 'traditional', 'conventional',
  'following', 'different', 'various', 'several', 'multiple', 'numerous',
  'significant', 'important', 'notable', 'key', 'major',
  'challenge', 'challenges', 'limitation', 'limitations',
  'future', 'direction', 'directions', 'perspective', 'perspectives',
  'compare', 'compared', 'comparison', 'comparative', 'baseline',
  'advantage', 'advantages', 'benefit', 'benefits', 'drawback', 'drawbacks',
  'potential', 'effectiveness', 'efficiency', 'robust', 'robustness', 'scalable', 'scalability',
  'contribution', 'contributions', 'insight', 'insights',
  'goal', 'objective', 'aim', 'target', 'motivation',
  'theoretical', 'practical', 'empirical', 'qualitative', 'quantitative',
  'setting', 'scenario', 'context', 'environment',
  'tool', 'tools', 'resource', 'resources', 'platform', 'platforms',
  'case', 'cases', 'case study', 'case studies',
  
  // Common English stopwords
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'so', 'because',
  'if', 'then', 'else', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'mine', 'yours', 'hers', 'ours', 'theirs',
  'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
  'not', 'no', 'yes', 'yet', 'also', 'just', 'very', 'too', 'quite',
  'than', 'then', 'there', 'here', 'out', 'in', 'on', 'at', 'by', 'of', 'to', 'from', 'up', 'down',
  'with', 'without', 'about', 'into', 'onto', 'off', 'over', 'under', 'again',
  'once', 'all', 'any', 'both', 'each', 'few', 'many', 'some', 'such',
  'only', 'own', 'same', 'other', 'another', 'more', 'most', 'less', 'least',
  'every', 'much', 'several',
  'because', 'although', 'though', 'while', 'whereas',
  'before', 'after', 'during', 'until', 'since',
  'if', 'unless', 'whether',
  'just', 'even', 'ever', 'never', 'always', 'already', 'yet', 'still',
  'get', 'got', 'gets', 'getting', 'make', 'makes', 'made',
  'say', 'says', 'said', 'go', 'goes', 'went', 'gone',
  'see', 'seen', 'look', 'looked', 'looking',
  'come', 'came', 'coming', 'take', 'took', 'taken',
  'know', 'knew', 'known', 'think', 'thought', 'high','state', 'however', 'real', 'cost',
  
  // Technical terms
  'embedding', 'embeddings', 'vector', 'vectors', 'feature', 'features', 'parameter', 'parameters',
  'weight', 'weights', 'bias', 'biases', 'gradient', 'gradients', 'optimization', 'optimizer'
];
  
  /**
   * Extracts meaningful keywords from a cluster of papers using TF-IDF and bigram analysis
   * 
   * @param {Array} papersInCluster - Array of paper objects in the current cluster
   * @param {Array} allPapers - Array of all paper objects for corpus-wide calculations
   * @param {Array} [customStopwords] - Optional additional stopwords to filter out
   * @param {Number} [maxKeywords=5] - Maximum number of keywords to return
   * @returns {Array} - Array of meaningful keywords extracted from the cluster
   */
  export const extractMeaningfulKeywords = (papersInCluster, allPapers, customStopwords = [], maxKeywords = 5) => {
    // Combine default and custom stopwords
    const stopwords = [...aiStopwords, ...customStopwords];
    
    // 1. Collect all words from papers in this cluster
    const clusterWords = papersInCluster.flatMap(paper => {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      return text.split(/\W+/).filter(word => 
        word.length > 3 && 
        !stopwords.includes(word.toLowerCase())
      );
    });
  
    // 2. Count word frequencies within this cluster (term frequency)
    const clusterWordCounts = {};
    clusterWords.forEach(word => {
      clusterWordCounts[word] = (clusterWordCounts[word] || 0) + 1;
    });
  
    // 3. Calculate how many papers in the whole dataset contain each word (document frequency)
    const wordDocumentFrequency = {};
    const totalDocuments = allPapers.length;
  
    // Calculate document frequency for significant words only
    Object.keys(clusterWordCounts).forEach(word => {
      const docsWithWord = allPapers.filter(paper => 
        `${paper.title} ${paper.abstract}`.toLowerCase().includes(word)
      ).length;
      wordDocumentFrequency[word] = docsWithWord;
    });
  
    // 4. Calculate TF-IDF scores
    const tfidfScores = {};
    Object.keys(clusterWordCounts).forEach(word => {
      // Term frequency in this cluster
      const tf = clusterWordCounts[word] / clusterWords.length;
      
      // Inverse document frequency (add 1 to avoid division by zero)
      const idf = Math.log(totalDocuments / (1 + (wordDocumentFrequency[word] || 1)));
      
      // TF-IDF score
      tfidfScores[word] = tf * idf;
    });
  
    // 5. Extract bigrams (two-word phrases) for context
    const bigrams = [];
    papersInCluster.forEach(paper => {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      const words = text.split(/\W+/).filter(word => 
        word.length > 2 && !stopwords.includes(word)
      );
      
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i+1]}`;
        bigrams.push(bigram);
      }
    });
  
    // Count bigram frequencies
    const bigramCounts = {};
    bigrams.forEach(bigram => {
      bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
    });
  
    // 6. Sort words by TF-IDF score and get top keywords
    const topKeywords = Object.entries(tfidfScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  
    // 7. Get top bigrams as additional context
    const topBigrams = Object.entries(bigramCounts)
      .filter(([bigram]) => {
        // Only keep bigrams where both words are not stopwords
        const [word1, word2] = bigram.split(' ');
        return !stopwords.includes(word1) && !stopwords.includes(word2);
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.ceil(maxKeywords / 2))
      .map(([bigram]) => bigram);
  
    // 8. Combine unigrams and bigrams, prioritizing bigrams for better context
    const combinedKeywords = [...topBigrams];
    
    // Add single words that aren't already part of the bigrams
    topKeywords.forEach(keyword => {
      const alreadyIncluded = combinedKeywords.some(bigram => 
        bigram.includes(keyword)
      );
      
      if (!alreadyIncluded) {
        combinedKeywords.push(keyword);
      }
    });
  
    // Return the top combined keywords
    return combinedKeywords.slice(0, maxKeywords);
  };
  
  /**
   * Extracts noun phrases from text using simple heuristics
   * This is a supplementary method that can be used to further refine keyword extraction
   * 
   * @param {string} text - Text to extract noun phrases from
   * @param {Array} stopwords - Array of stopwords to filter out
   * @returns {Array} - Array of potential noun phrases
   */
  export const extractNounPhrases = (text, stopwords = aiStopwords) => {
    // Simple regex patterns to identify potential noun phrases (this is a simplified approach)
    const nounPhrasePatterns = [
      /(\w+)\s+(analysis|model|learning|system|algorithm|framework|method|approach)/gi,
      /(deep|machine|reinforcement|supervised|unsupervised)\s+(\w+)/gi,
      /(neural|bayesian|generative)\s+(\w+)/gi,
      /(\w+)\s+(recognition|detection|classification|prediction|estimation|segmentation)/gi
    ];
    
    const phrases = [];
    
    // Extract phrases that match the patterns
    nounPhrasePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const phrase = match[0].toLowerCase();
        // Filter out phrases containing stopwords
        const words = phrase.split(/\s+/);
        if (!words.some(word => stopwords.includes(word))) {
          phrases.push(phrase);
        }
      }
    });
    
    return Array.from(new Set(phrases)); // Remove duplicates
  };
  
  /**
   * Evaluates the distinctiveness of keywords between clusters
   * This can be used to further refine keywords by selecting those that best distinguish one cluster from others
   * 
   * @param {Array} clustersWithKeywords - Array of objects containing cluster ID and keywords
   * @returns {Array} - Array of objects with cluster ID and distinctive keywords
   */
  export const findDistinctiveKeywords = (clustersWithKeywords) => {
    // Track keywords across all clusters
    const keywordCounts = {};
    
    // Count keyword occurrences across all clusters
    clustersWithKeywords.forEach(cluster => {
      cluster.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });
    
    // For each cluster, prioritize keywords that appear in fewer other clusters
    return clustersWithKeywords.map(cluster => {
      const scoredKeywords = cluster.keywords.map(keyword => ({
        keyword,
        // Lower scores are better (more distinctive)
        distinctiveness: keywordCounts[keyword]
      }));
      
      // Sort by distinctiveness (lower is better)
      scoredKeywords.sort((a, b) => a.distinctiveness - b.distinctiveness);
      
      return {
        clusterId: cluster.clusterId,
        keywords: scoredKeywords.map(k => k.keyword)
      };
    });
  };
  
  export default {
    extractMeaningfulKeywords,
    extractNounPhrases,
    findDistinctiveKeywords,
    aiStopwords
  };