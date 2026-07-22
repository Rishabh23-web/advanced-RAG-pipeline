import { miniLLM } from '../../services/llm.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * Step-Back Prompting: Generates a more abstract version of the query.
 */
export async function generateStepBackQuery(originalQuery) {
  const template = `You are an expert at information retrieval.
Given a specific user question, write a more generic, step-back question that would help gather background information needed to answer the specific question.

Specific Question: {question}
Step-Back Question:`;

  const prompt = PromptTemplate.fromTemplate(template);
  const chain = prompt.pipe(miniLLM).pipe(new StringOutputParser());
  
  return await chain.invoke({ question: originalQuery });
}

/**
 * HyDE (Hypothetical Document Embeddings): Generates a fake answer to embed for vector search.
 */
export async function generateHyDE(originalQuery) {
  const template = `You are a knowledgeable AI assistant.
Please write a brief, plausible paragraph that answers the user's question. It does not need to be perfectly accurate, but it should contain the types of keywords and concepts that a real document containing the answer would have.

Question: {question}
Hypothetical Answer:`;

  const prompt = PromptTemplate.fromTemplate(template);
  const chain = prompt.pipe(miniLLM).pipe(new StringOutputParser());
  
  return await chain.invoke({ question: originalQuery });
}

/**
 * Translates a query using both methods for a broader search net.
 */
export async function translateQuery(originalQuery) {
  const [stepBack, hyde] = await Promise.all([
    generateStepBackQuery(originalQuery),
    generateHyDE(originalQuery)
  ]);

  return {
    original: originalQuery,
    stepBack,
    hyde
  };
}
