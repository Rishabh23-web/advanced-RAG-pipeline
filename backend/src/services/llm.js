import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

// Main LLM (Generation, Routing)
export const mainLLM = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0,
});

// Mini LLM (Grader, Translator)
export const miniLLM = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
});

// Embeddings model
export const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-small',
});
