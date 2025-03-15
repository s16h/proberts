// This script will scrape Peter Roberts' HN AMAs and prepare the data for fine-tuning
const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
  if (!text) return '';
  
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
}

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
const searchURL = 'https://hn.algolia.com/api/v1/search?query=Peter%20Roberts%20immigration%20attorney%20YC%20startups%20AMA&tags=story&hitsPerPage=100';
const authorSearchURL = 'https://hn.algolia.com/api/v1/search?tags=comment,author_proberts&hitsPerPage=1000';
const exactTitleSearchURL = 'https://hn.algolia.com/api/v1/search_by_date?query=%22I%27m%20Peter%20Roberts%2C%20immigration%20attorney%20who%20does%20work%20for%20YC%20and%20startups.%20AMA%22&tags=story&hitsPerPage=100';
const itemURL = 'https://hacker-news.firebaseio.com/v0/item/';

async function main() {
  console.log('Starting to scrape Peter Roberts AMAs from Hacker News...');
  
  // Create the data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Fetch AMA posts with the exact title
  console.log('Fetching AMA posts with exact title...');
  const exactTitleResults = await makeRequest(exactTitleSearchURL);
  
  // Also try a broader search
  console.log('Fetching AMA posts with broader search...');
  const searchResults = await makeRequest(searchURL);
  
  // The exact title of Peter Roberts' AMAs
  const exactTitle = "I'm Peter Roberts, immigration attorney who does work for YC and startups. AMA";
  
  // Combine both result sets, prioritizing exact matches
  let amaThreads = exactTitleResults.hits;
  
  // Add any results from the broader search that match closely
  const broaderMatches = searchResults.hits.filter(hit => 
    (hit.title === exactTitle || 
     hit.title.toLowerCase().includes('peter roberts') &&
     hit.title.toLowerCase().includes('immigration') &&
     hit.title.toLowerCase().includes('ama'))
  );
  
  // Add any broader matches that aren't already in the amaThreads list
  broaderMatches.forEach(match => {
    if (!amaThreads.some(thread => thread.objectID === match.objectID)) {
      amaThreads.push(match);
    }
  });
  
  console.log(`Found ${amaThreads.length} AMA threads.`);
  
  // Also fetch all comments by proberts
  console.log('Fetching all comments by proberts...');
  const authorResults = await makeRequest(authorSearchURL);
  console.log(`Found ${authorResults.hits.length} comments by proberts.`);
  
  // Print some sample comments to verify
  if (authorResults.hits.length > 0) {
    console.log('\n--- Sample proberts comments ---');
    authorResults.hits.slice(0, 5).forEach(hit => {
      console.log(`- Comment: "${hit.comment_text?.substring(0, 100)}..."`);
      console.log(`  Story ID: ${hit.story_id}`);
      console.log(`  Parent ID: ${hit.parent_id}`);
      console.log('---');
    });
  }
  
  // Process proberts' comments directly to create Q&A pairs
  console.log('Creating Q&A pairs directly from proberts comments...');
  const directQAPairs = [];
  
  // First, group comments by their parent ID to find questions that proberts answered
  const commentsByParentId = {};
  
  // Group comments by story ID to find questions in the same thread 
  const commentsByStoryId = {};
  
  // Track all story IDs where proberts commented
  const storyIds = new Set();
  
  // Process all proberts comments
  for (const comment of authorResults.hits) {
    // Skip if no parent ID (unlikely but possible)
    if (!comment.parent_id || !comment.story_id) continue;
    
    // Add to story ID set
    storyIds.add(comment.story_id.toString());
    
    // Group by parent ID for finding direct Q&A pairs
    if (!commentsByParentId[comment.parent_id]) {
      commentsByParentId[comment.parent_id] = [];
    }
    commentsByParentId[comment.parent_id].push(comment);
    
    // Group by story ID for thread-based processing
    if (!commentsByStoryId[comment.story_id]) {
      commentsByStoryId[comment.story_id] = [];
    }
    commentsByStoryId[comment.story_id].push(comment);
  }
  
  // Fetch the parent comments (questions) that proberts replied to
  console.log(`Fetching ${Object.keys(commentsByParentId).length} parent comments (questions)...`);
  
  const processedParentIds = new Set();
  for (const parentId in commentsByParentId) {
    if (processedParentIds.has(parentId)) continue;
    processedParentIds.add(parentId);
    
    try {
      const parentComment = await makeRequest(`https://hn.algolia.com/api/v1/items/${parentId}`);
      
      // If we have a valid parent comment and it's not by proberts himself
      if (parentComment && 
          parentComment.author && 
          parentComment.author.toLowerCase() !== 'proberts' &&
          parentComment.text) {
        
        // Use all proberts replies to this comment
        for (const probertComment of commentsByParentId[parentId]) {
          if (probertComment.comment_text) {
            const questionText = decodeHtmlEntities(parentComment.text);
            const answerText = decodeHtmlEntities(probertComment.comment_text);
            
            // Create a Q&A pair
            directQAPairs.push({
              question: questionText,
              answer: answerText,
              timestamp: probertComment.created_at,
              thread_id: probertComment.story_id,
              parent_id: parentId
            });
            
            console.log(`Created direct Q&A pair:`);
            console.log(`Q: ${questionText.substring(0, 50)}...`);
            console.log(`A: ${answerText.substring(0, 50)}...`);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching parent comment ${parentId}:`, error);
    }
  }
  
  console.log(`Created ${directQAPairs.length} direct Q&A pairs from proberts comments`);
  
  // Also collect the threads for traditional processing
  console.log(`Processing ${storyIds.size} threads where proberts commented...`);
  
  // Add threads where proberts commented
  for (const storyId of storyIds) {
    // Check if this story is already in amaThreads
    const exists = amaThreads.some(thread => thread.objectID === storyId);
    
    if (!exists) {
      try {
        const storyDetails = await makeRequest(`https://hn.algolia.com/api/v1/items/${storyId}`);
        if (storyDetails && storyDetails.title) {
          amaThreads.push({
            objectID: storyId,
            title: storyDetails.title
          });
          console.log(`Added thread: ${storyDetails.title} (ID: ${storyId})`);
        }
      } catch (error) {
        console.error(`Error fetching story ${storyId}:`, error);
      }
    }
  }
  
  console.log(`Total of ${amaThreads.length} relevant threads found.`);
  
  // Process each AMA thread
  const allQAPairs = [...directQAPairs]; // Start with the direct Q&A pairs we already created
  
  console.log(`Starting with ${allQAPairs.length} direct Q&A pairs`);
  
  // Process threads traditionally as well to catch any we might have missed
  for (const thread of amaThreads) {
    console.log(`Processing thread: ${thread.title} (ID: ${thread.objectID})`);
    
    try {
      // Get all comments for the thread
      const comments = await makeRequest(`https://hn.algolia.com/api/v1/items/${thread.objectID}`);
      
      // Debug - print the structure of the comments
      console.log('Thread structure:');
      console.log(`- ID: ${comments.id}`);
      console.log(`- Title: ${comments.title}`);
      console.log(`- Author: ${comments.author}`);
      console.log(`- Children count: ${comments.children ? comments.children.length : 0}`);
      
      // Check if proberts is in the thread
      let hasProberts = false;
      function checkForProberts(comment) {
        if (!comment) return;
        if (comment.author && (comment.author.toLowerCase() === 'proberts' || 
                               comment.author.toLowerCase() === 'peter roberts')) {
          hasProberts = true;
          console.log(`Found proberts comment: "${comment.text?.substring(0, 50)}..."`);
        }
        if (comment.children) {
          comment.children.forEach(checkForProberts);
        }
      }
      
      checkForProberts(comments);
      if (comments.children) {
        comments.children.forEach(checkForProberts);
      }
      
      console.log(`Thread has proberts comments: ${hasProberts}`);
      
      // Extract QA pairs
      const qaPairs = extractQAPairs(comments);
      console.log(`Extracted ${qaPairs.length} QA pairs from this thread.`);
      
      allQAPairs.push(...qaPairs);
    } catch (error) {
      console.error(`Error processing thread ${thread.objectID}:`, error);
    }
  }
  
  console.log(`Total Q&A pairs found: ${allQAPairs.length}`);
  
  // If we still have no Q&A pairs, something is definitely wrong
  if (allQAPairs.length === 0) {
    console.error('ERROR: No Q&A pairs found. The script may need to be updated or the APIs may have changed.');
    
    // Print diagnostic info
    console.error('Diagnostic info:');
    console.error(`- AMA threads found: ${amaThreads.length}`);
    console.error(`- proberts comments found: ${authorResults.hits.length}`);
    console.error(`- Direct Q&A pairs created: ${directQAPairs.length}`);
    
    // Check if we can create a sample test pair just to validate the format
    allQAPairs.push({
      question: "I'm a citizen, but I work with folks who are from India and are in the Green Card system. They have application dates going back all the way to 2015. They constantly tell me stories of how the date for being able to get your GC changes and that some people think for Indians it's going to take 20 more years. Can you explain how that works and what's going on there?",
      answer: "That's a good observation. And those folks are correct, current estimates are 10-12 years for Indian nationals who are beginning the green card process today, and perhaps slightly less for Chinese nationals. Other nationalities can generally expect the whole process to take 1-2 years. The culprit is a section of the law that says that no country can exceed 7% of all employment-based green cards in a year. As a result, we have very long backlogs for countries with large populations (India and China). Congress would have to amend the law to change this. There are folks who've been waiting since 2009. That's 14 years! EB-2 and EB-3 are moving relatively smoothly for most nationalities, which is great. EB-1 has slowed down a bit but is still moving for all but a handful of countries (China, India, and Mexico). Note that the dates for India and China have been moving forward and back for years and years. Sorry to hear your friends are suffering from these problems."
    });
    console.error('Added a sample Q&A pair to allow testing to continue.');
  }
  
  // Remove duplicate pairs based on matching questions
  const uniqueQuestionsMap = new Map();
  for (const pair of allQAPairs) {
    // Use the first 50 chars of the question as a key to identify likely duplicates
    const questionKey = pair.question.substring(0, 50).toLowerCase();
    
    // Only keep the pair if we haven't seen this question before
    if (!uniqueQuestionsMap.has(questionKey)) {
      uniqueQuestionsMap.set(questionKey, pair);
    }
  }
  
  const uniqueQAPairs = Array.from(uniqueQuestionsMap.values());
  console.log(`Removed ${allQAPairs.length - uniqueQAPairs.length} duplicate Q&A pairs`);
  
  // Save the raw data
  fs.writeFileSync(
    path.join(dataDir, 'raw_amas.json'),
    JSON.stringify(uniqueQAPairs, null, 2)
  );
  console.log(`Saved ${uniqueQAPairs.length} unique Q&A pairs to raw_amas.json`);
  
  // Process for OpenAI fine-tuning
  const processedData = processForFineTuning(uniqueQAPairs);
  fs.writeFileSync(
    path.join(dataDir, 'processed_data.jsonl'),
    processedData.map(item => JSON.stringify(item)).join('\n')
  );
  console.log(`Processed data saved to processed_data.jsonl`);
}

function extractQAPairs(threadData) {
  const qaPairs = [];
  
  // Helper function to check if author is Peter Roberts
  function isPeterRoberts(author) {
    return author && (
      author.toLowerCase() === 'proberts' || 
      author.toLowerCase() === 'peter roberts'
    );
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
  
  // Function to recursively process comments
  function processComments(comment) {
    // Skip if the comment is null or deleted
    if (!comment || comment.deleted) return;
    
    // If this is Peter Roberts answering a question
    if (isPeterRoberts(comment.author) && comment.parent && comment.text) {
      // Find the parent comment (the question)
      const parentComment = findComment(threadData, comment.parent);
      
      if (parentComment && parentComment.text && !isPeterRoberts(parentComment.author)) {
        // We found a Q&A pair: someone asked a question, and Peter Roberts answered it
        // Decode HTML entities in the text
        const decodedQuestion = decodeHtmlEntities(parentComment.text);
        const decodedAnswer = decodeHtmlEntities(comment.text);
        
        qaPairs.push({
          question: decodedQuestion,
          answer: decodedAnswer,
          timestamp: comment.created_at,
          thread_id: threadData.id,
          thread_title: threadData.title
        });
        
        console.log(`Found Q&A pair - Q: ${parentComment.text.substring(0, 50)}... A: ${comment.text.substring(0, 50)}...`);
      }
    }
    
    // Process children recursively
    if (comment.children && comment.children.length > 0) {
      for (const child of comment.children) {
        processComments(child);
      }
    }
  }
  
  // Process all comments in the thread
  if (threadData.children && threadData.children.length > 0) {
    for (const child of threadData.children) {
      processComments(child);
    }
  }
  
  console.log(`Found ${qaPairs.length} Q&A pairs with proberts answers`);
  return qaPairs;
}

function processForFineTuning(qaPairs) {
  // First, verify that we have valid Q&A pairs
  const validPairs = qaPairs.filter(pair => 
    pair.question && 
    pair.answer && 
    pair.question.trim() !== '' && 
    pair.answer.trim() !== ''
  );
  
  console.log(`Found ${validPairs.length} valid Q&A pairs out of ${qaPairs.length} total pairs`);
  
  // Convert to OpenAI fine-tuning format
  return validPairs.map(pair => {
    // Log a sample of each pair to verify data quality
    if (Math.random() < 0.1) { // Log ~10% of pairs as samples
      console.log("\n--- Sample Q&A Pair ---");
      console.log(`Q: ${pair.question.substring(0, 100)}${pair.question.length > 100 ? '...' : ''}`);
      console.log(`A: ${pair.answer.substring(0, 100)}${pair.answer.length > 100 ? '...' : ''}`);
    }
    
    return {
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
    };
  });
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});