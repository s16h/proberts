# Peter Roberts Immigration Assistant

A chatbot that simulates Peter Roberts (YC's immigration attorney) answering immigration questions, based on his past Hacker News AMAs.

## Features

- Chat interface for asking immigration questions
- Uses GPT-4o mini by default, with option to use a fine-tuned model
- Filters out non-immigration related questions
- Provides informative answers based on Peter Roberts' style and expertise
- Trained on historical HN AMA responses when using the fine-tuned model

## Getting Started

### Prerequisites

- Node.js (>= 18.x recommended)
- npm
- OpenAI API key

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/proberts.git
   cd proberts
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with your OpenAI API key
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   # Uses gpt-4o-mini by default if no fine-tuned model is specified
   # After fine-tuning, uncomment and add your fine-tuned model ID:
   # OPENAI_MODEL_ID=your_fine_tuned_model_id
   ```

### Data Collection and Model Fine-tuning

1. Run the scraping script to collect Peter Roberts' HN AMA data
   ```
   node scripts/scrape-amas.js
   ```

2. Fine-tune GPT-4o mini with the collected data
   ```
   node scripts/fine-tune.js
   ```
   Note: This process uses GPT-4o mini as the base model for fine-tuning

3. Check the status of your fine-tuning job
   ```
   node scripts/fine-tune.js --status JOB_ID
   ```

4. Once fine-tuning is complete, add the model ID to your `.env.local` file
   ```
   OPENAI_MODEL_ID=your_fine_tuned_model_id
   ```

### Development

Run the development server:
```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Deployment

This application is designed to be deployed on [Vercel](https://vercel.com/).

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add your environment variables (OPENAI_API_KEY and OPENAI_MODEL_ID) in the Vercel dashboard
4. Deploy!

## Disclaimer

This application is for informational purposes only and does not provide legal advice. The responses are based on Peter Roberts' public HN AMA answers but may not be suitable for your specific situation. Always consult with a qualified immigration attorney for legal advice.

## License

MIT