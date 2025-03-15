// This script will scrape Peter Roberts' HN AMAs and prepare the data for fine-tuning
const fs = require('fs');
const path = require('path');
const https = require('https');

// Function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// HN API endpoints
const searchURL = 'https://hn.algolia.com/api/v1/search?query=Peter%20Roberts%20immigration%20ask%20me%20anything&tags=story&hitsPerPage=100';
const itemURL = 'https://hacker-news.firebaseio.com/v0/item/';

async function main() {
  console.log('Starting to scrape Peter Roberts AMAs from Hacker News...');
  
  // Create the data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Fetch AMA posts
  console.log('Fetching AMA posts...');
  const searchResults = await makeRequest(searchURL);
  const amaThreads = searchResults.hits.filter(hit => 
    hit.title.toLowerCase().includes('peter roberts') && 
    hit.title.toLowerCase().includes('immigration') &&
    hit.title.toLowerCase().includes('ask me anything')
  );
  
  console.log(`Found ${amaThreads.length} AMA threads.`);
  
  // Process each AMA thread
  const allQAPairs = [];
  
  for (const thread of amaThreads) {
    console.log(`Processing thread: ${thread.title} (ID: ${thread.objectID})`);
    
    // Get all comments for the thread
    const comments = await makeRequest(`https://hn.algolia.com/api/v1/items/${thread.objectID}`);
    
    // Extract QA pairs
    const qaPairs = extractQAPairs(comments);
    console.log(`Extracted ${qaPairs.length} QA pairs from this thread.`);
    
    allQAPairs.push(...qaPairs);
  }
  
  // Save the raw data
  fs.writeFileSync(
    path.join(dataDir, 'raw_amas.json'),
    JSON.stringify(allQAPairs, null, 2)
  );
  console.log(`Saved ${allQAPairs.length} QA pairs to raw_amas.json`);
  
  // Process for OpenAI fine-tuning
  const processedData = processForFineTuning(allQAPairs);
  fs.writeFileSync(
    path.join(dataDir, 'processed_data.jsonl'),
    processedData.map(item => JSON.stringify(item)).join('\n')
  );
  console.log(`Processed data saved to processed_data.jsonl`);
}

function extractQAPairs(threadData) {
  const qaPairs = [];
  
  // Function to recursively process comments
  function processComments(comment, parentAuthor) {
    // Skip if the comment is null or deleted
    if (!comment || comment.deleted) return;
    
    // If parent is Peter Roberts and this is a response, save it
    if (parentAuthor && 
        parentAuthor.toLowerCase() === 'peter roberts' && 
        comment.text) {
      qaPairs.push({
        question: comment.text,
        answer: parentAuthor.text,
        timestamp: comment.created_at,
        thread_id: threadData.id,
        thread_title: threadData.title
      });
    }
    
    // If this is Peter Roberts answering a question
    if (comment.author && 
        comment.author.toLowerCase() === 'peter roberts' && 
        comment.parent && 
        comment.text) {
      
      // Find the parent comment (the question)
      const parentComment = findComment(threadData, comment.parent);
      
      if (parentComment && parentComment.text) {
        qaPairs.push({
          question: parentComment.text,
          answer: comment.text,
          timestamp: comment.created_at,
          thread_id: threadData.id,
          thread_title: threadData.title
        });
      }
    }
    
    // Process children
    if (comment.children && comment.children.length > 0) {
      for (const child of comment.children) {
        processComments(child, comment.author);
      }
    }
  }
  
  // Helper function to find a comment by ID
  function findComment(threadData, commentId) {
    function search(comment) {
      if (!comment) return null;
      if (comment.id === commentId) return comment;
      
      if (comment.children && comment.children.length > 0) {
        for (const child of comment.children) {
          const found = search(child);
          if (found) return found;
        }
      }
      
      return null;
    }
    
    // Start with the main thread
    return search(threadData);
  }
  
  // Process all comments in the thread
  if (threadData.children && threadData.children.length > 0) {
    for (const child of threadData.children) {
      processComments(child, threadData.author);
    }
  }
  
  return qaPairs;
}

function processForFineTuning(qaPairs) {
  return qaPairs.map(pair => ({
    messages: [
      {
        role: "system",
        content: "You are Peter Roberts, an immigration attorney who has done AMAs on Hacker News. Answer immigration-related questions based on your expertise. If you are unsure or if the question requires specific legal advice based on individual circumstances, make it clear that your response is for informational purposes only and suggest consulting with an immigration attorney."
      },
      {
        role: "user",
        content: pair.question
      },
      {
        role: "assistant",
        content: pair.answer
      }
    ]
  }));
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});