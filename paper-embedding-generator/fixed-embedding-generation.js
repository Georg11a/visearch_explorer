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

  // Log versions for debugging
  console.log(`Node.js version: ${process.version}`);
  console.log(`@xenova/transformers version: ${require('@xenova/transformers/package.json').version}`);
  
  // Read CSV file
  console.log("Reading CSV file...");
  const csvText = fs.readFileSync('../src/data/unique_papers.csv', 'utf-8');
  
  // Parse CSV
  const papers = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  }).data;
  
  console.log(`Found ${papers.length} papers`);
  
  // Load model
  console.log("Loading transformer model...");
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  // Test the model on a sample text to verify it works correctly
  const testText = "This is a test to verify the embedding model works correctly";
  const testResult = await extractor(testText, { pooling: 'mean', normalize: true });
  const testEmbedding = Array.from(testResult.data);
  
  // Calculate the magnitude of the test embedding
  const testMagnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
  console.log(`Test embedding magnitude: ${testMagnitude}`);
  if (Math.abs(testMagnitude - 1.0) > 0.01) {
    console.warn("WARNING: Test embedding is not properly normalized! Expected magnitude close to 1.0");
  } else {
    console.log("Test embedding is correctly normalized");
  }
  
  // Process papers in small batches to avoid memory issues
  const batchSize = 20;
  let processedPapers = [];
  
  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1}/${Math.ceil(papers.length/batchSize)}`);
    
    for (const paper of batch) {
      // Combine title and abstract as input text
      const text = `${paper.title || ''} ${paper.abstract || ''}`.trim();
      
      if (!text) {
        console.log(`Warning: Paper ${paper.id} has no title or abstract`);
        continue;
      }
      
      try {
        // Generate embedding with explicit normalization
        const result = await extractor(text, {
          pooling: 'mean',
          normalize: true
        });
        
        // Convert to regular array and verify normalization
        const embedding = Array.from(result.data);
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        
        if (Math.abs(magnitude - 1.0) > 0.01) {
          // If not normalized, manually normalize
          console.warn(`Warning: Embedding for paper ${paper.id} not normalized (mag=${magnitude.toFixed(4)}), normalizing manually`);
          const normalizedEmbedding = embedding.map(val => val / magnitude);
          
          // Verify manual normalization
          const newMagnitude = Math.sqrt(normalizedEmbedding.reduce((sum, val) => sum + val * val, 0));
          console.log(`After manual normalization: ${newMagnitude.toFixed(4)}`);
          
          processedPapers.push({
            ...paper,
            embedding: normalizedEmbedding
          });
        } else {
          processedPapers.push({
            ...paper,
            embedding: embedding
          });
        }
      } catch (error) {
        console.error(`Error processing paper ${paper.id}:`, error);
      }
    }
    
    // Save intermediate results to avoid losing progress
    const batchFile = path.join(outputDir, `papers_batch_${i/batchSize + 1}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(batch.map(p => ({
      id: p.id,
      title: p.title,
      embedding: processedPapers.find(pp => pp.id === p.id)?.embedding || null
    }))));
    
    console.log(`Saved batch to ${batchFile}`);
  }
  
  // Save complete results
  console.log("Saving all embeddings...");
  fs.writeFileSync('papers_with_embeddings.json', JSON.stringify(processedPapers));
  console.log("Processing complete! Processed " + processedPapers.length + " papers");
  
  // Final verification: check a few random embeddings
  const sampleSize = Math.min(5, processedPapers.length);
  console.log(`\nVerifying ${sampleSize} random embeddings:`);
  
  for (let i = 0; i < sampleSize; i++) {
    const randomIndex = Math.floor(Math.random() * processedPapers.length);
    const paper = processedPapers[randomIndex];
    const magnitude = Math.sqrt(paper.embedding.reduce((sum, val) => sum + val * val, 0));
    
    console.log(`Paper "${paper.title.substring(0, 30)}..." - Magnitude: ${magnitude.toFixed(4)}`);
  }
}

// Execute main function
generateEmbeddings().catch(error => {
  console.error("Error occurred:", error);
});