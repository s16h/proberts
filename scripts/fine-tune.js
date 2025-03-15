// Script to fine-tune an OpenAI model using the processed data
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Check if API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable not set.');
  console.error('Please create a .env.local file with your OpenAI API key.');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function uploadFile() {
  console.log('Uploading training file...');
  const filePath = path.join(__dirname, '..', 'data', 'processed_data.jsonl');
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Training file not found at ${filePath}`);
    console.error('Please run the scrape-amas.js script first to generate the training data.');
    process.exit(1);
  }
  
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'fine-tune',
    });
    
    console.log(`File uploaded successfully. File ID: ${file.id}`);
    return file.id;
  } catch (error) {
    console.error('Error uploading file:', error);
    process.exit(1);
  }
}

async function createFineTuningJob(fileId) {
  console.log('Creating fine-tuning job...');
  
  try {
    const fineTuningJob = await openai.fineTuning.jobs.create({
      training_file: fileId,
      model: 'gpt-3.5-turbo',
      hyperparameters: {
        n_epochs: 3,
      },
    });
    
    console.log(`Fine-tuning job created successfully. Job ID: ${fineTuningJob.id}`);
    console.log('Run this script with the --status flag to check the status of your fine-tuning job.');
    return fineTuningJob.id;
  } catch (error) {
    console.error('Error creating fine-tuning job:', error);
    process.exit(1);
  }
}

async function checkJobStatus(jobId) {
  try {
    const job = await openai.fineTuning.jobs.retrieve(jobId);
    console.log(`Job status: ${job.status}`);
    
    if (job.status === 'succeeded') {
      console.log(`Fine-tuned model ID: ${job.fine_tuned_model}`);
      console.log('Add this model ID to your .env.local file as OPENAI_MODEL_ID to use it in your app.');
    } else if (job.status === 'failed') {
      console.log('Job failed. Error:', job.error);
    }
    
    return job;
  } catch (error) {
    console.error('Error checking job status:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    const jobId = args[args.indexOf('--status') + 1];
    if (!jobId) {
      console.error('Error: No job ID provided.');
      console.error('Usage: node fine-tune.js --status <job_id>');
      process.exit(1);
    }
    
    await checkJobStatus(jobId);
  } else {
    const fileId = await uploadFile();
    const jobId = await createFineTuningJob(fileId);
    
    // Save the job ID to a file for later reference
    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'fine_tuning_job.json'),
      JSON.stringify({ jobId, fileId, timestamp: new Date().toISOString() })
    );
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});