const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { pipeline } = require('@xenova/transformers');

async function generateEmbeddings() {
  // Create output directory
  const outputDir = './embeddings_output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Set up logging
  const logFile = path.join(outputDir, 'embedding_generation.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  // Helper function for logging
  const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
  };

  // Log versions for debugging
  log(`Node.js version: ${process.version}`);
  log(`@xenova/transformers version: ${require('@xenova/transformers/package.json').version}`);
  
  // Read CSV file
  log("Reading CSV file...");
  const csvText = fs.readFileSync('../src/data/unique_papers.csv', 'utf-8');
  
  // Parse CSV
  const papers = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  }).data;
  
  log(`Found ${papers.length} papers`);
  
  // Load model
  log("Loading transformer model...");
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  // Test the model on a sample text to verify it works correctly
  const testText = "This is a test to verify the embedding model works correctly";
  const testResult = await extractor(testText, { pooling: 'mean', normalize: true });
  const testEmbedding = Array.from(testResult.data);
  
  // Calculate the magnitude of the test embedding
  const testMagnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
  log(`Test embedding magnitude: ${testMagnitude}`);
  if (Math.abs(testMagnitude - 1.0) > 0.01) {
    log("WARNING: Test embedding is not properly normalized! Expected magnitude close to 1.0");
  } else {
    log("Test embedding is correctly normalized");
  }
  
  // Process papers in small batches to avoid memory issues
  const batchSize = 20;
  let processedPapers = [];
  
  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);
    log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(papers.length/batchSize)}`);
    
    // Array to store batch results separately
    const batchResults = [];
    
    for (let j = 0; j < batch.length; j++) {
      const paper = batch[j];
      // Combine title and abstract as input text
      const text = `${paper.title || ''} ${paper.abstract || ''}`.trim();
      
      if (!text) {
        log(`Warning: Paper ${paper.id} has no title or abstract`);
        continue;
      }
      
      try {
        log(`Processing paper ${i + j + 1}/${papers.length}: ${paper.title.substring(0, 50)}...`);
        
        // Generate embedding with explicit normalization
        const result = await extractor(text, {
          pooling: 'mean',
          normalize: true
        });
        
        // Convert to regular array and verify normalization
        const embedding = Array.from(result.data);
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        
        let finalEmbedding = embedding;
        if (Math.abs(magnitude - 1.0) > 0.01) {
          // If not normalized, manually normalize
          log(`Warning: Embedding for paper ${paper.id} not normalized (mag=${magnitude.toFixed(4)}), normalizing manually`);
          finalEmbedding = embedding.map(val => val / magnitude);
          
          // Verify manual normalization
          const newMagnitude = Math.sqrt(finalEmbedding.reduce((sum, val) => sum + val * val, 0));
          log(`After manual normalization: ${newMagnitude.toFixed(4)}`);
        }
        
        // Add to batch results
        batchResults.push({
          id: paper.id,
          title: paper.title,
          embedding: finalEmbedding
        });
        
        // Add to all processed papers
        processedPapers.push({
          ...paper,
          embedding: finalEmbedding
        });
      } catch (error) {
        log(`Error processing paper ${paper.id}: ${error.message}`);
      }
    }
    
    // Check for embedding uniqueness in this batch
    if (batchResults.length > 1) {
      log(`Running uniqueness check for batch of ${batchResults.length} papers`);
      
      // Simple check: compute hash of first few embedding values to compare
      const embedHashMap = new Map();
      for (const result of batchResults) {
        // Use first 10 values as a quick hash
        const embedHash = JSON.stringify(result.embedding.slice(0, 10));
        if (embedHashMap.has(embedHash)) {
          log(`WARNING: Potential duplicate embedding detected! Paper ${result.id} has similar embedding to paper ${embedHashMap.get(embedHash)}`);
        } else {
          embedHashMap.set(embedHash, result.id);
        }
      }
      
      // More thorough check: compute average cosine similarity
      let totalSim = 0, comparisons = 0;
      for (let a = 0; a < batchResults.length; a++) {
        for (let b = a + 1; b < batchResults.length; b++) {
          const embA = batchResults[a].embedding;
          const embB = batchResults[b].embedding;
          
          // Compute cosine similarity
          let dotProduct = 0, normA = 0, normB = 0;
          for (let k = 0; k < embA.length; k++) {
            dotProduct += embA[k] * embB[k];
            normA += embA[k] * embA[k];
            normB += embB[k] * embB[k];
          }
          const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          totalSim += similarity;
          comparisons++;
          
          // Flag high similarity papers (likely duplicates or very similar content)
          if (similarity > 0.95) {
            log(`WARNING: Very high similarity (${similarity.toFixed(4)}) between papers ${batchResults[a].id} and ${batchResults[b].id}`);
          }
        }
      }
      
      // Log average similarity across the batch
      if (comparisons > 0) {
        const avgSim = totalSim / comparisons;
        log(`Average similarity in batch: ${avgSim.toFixed(4)}`);
        if (avgSim > 0.9) {
          log(`CRITICAL WARNING: Batch has extremely high average similarity! Embedding generation may be faulty.`);
        }
      }
    }
    
    // Save intermediate results to avoid losing progress
    const batchFile = path.join(outputDir, `papers_batch_${Math.floor(i/batchSize) + 1}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(batchResults, null, 2));
    
    log(`Saved batch to ${batchFile}`);
  }
  
  // Save complete results
  log("Saving all embeddings...");
  fs.writeFileSync(path.join(outputDir, 'papers_with_embeddings.json'), 
                   JSON.stringify(processedPapers, null, 2));
  log("Processing complete! Processed " + processedPapers.length + " papers");
  
  // Final verification: check a few random embeddings
  const sampleSize = Math.min(5, processedPapers.length);
  log(`\nVerifying ${sampleSize} random embeddings:`);
  
  for (let i = 0; i < sampleSize; i++) {
    const randomIndex = Math.floor(Math.random() * processedPapers.length);
    const paper = processedPapers[randomIndex];
    const magnitude = Math.sqrt(paper.embedding.reduce((sum, val) => sum + val * val, 0));
    
    log(`Paper "${paper.title.substring(0, 30)}..." - Magnitude: ${magnitude.toFixed(4)}`);
  }
  
  // Close log stream
  logStream.end();
}

// Execute main function
generateEmbeddings().catch(error => {
  console.error("Error occurred:", error);
});