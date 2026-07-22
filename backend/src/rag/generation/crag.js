import { miniLLM } from '../../services/llm.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * Grades the generated response.
 * Returns an object with the score (1-10) and suggested keywords if it failed.
 */
export async function gradeResponse(query, contextDocs, responseText) {
  const contextString = contextDocs.map(d => d.metadata.text).join('\n\n');

  const template = `You are an evaluator grading an AI's response to a user's question based strictly on the provided context.
If the response accurately answers the question using only the context and includes citations, give it a high score.
If the context does not contain the answer, and the response correctly states that it does not have enough information, give it a high score (10) because it correctly avoided hallucinating.
If it tries to answer using outside knowledge, hallucinates, or misses citations, give it a low score.

Question: {question}
Context: {context}
Response: {response}

Analyze the response and output a JSON object exactly in this format, and nothing else:
{{
  "score": <number 1-10>,
  "reasoning": "<brief explanation>",
  "missingKeywords": ["<keyword1>", "<keyword2>"] // Only populate if score < 6 and you think other keywords might help find better context
}}`;

  const prompt = PromptTemplate.fromTemplate(template);
  const chain = prompt.pipe(miniLLM).pipe(new StringOutputParser());
  
  const resultStr = await chain.invoke({
    question: query,
    context: contextString,
    response: responseText
  });

  try {
    // Basic extraction to handle Markdown JSON blocks if the LLM adds them
    const jsonStr = resultStr.replace(/```json\n?/, '').replace(/```/, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse C-RAG grade:", resultStr);
    return { score: 10, reasoning: "Parse failure, passing by default", missingKeywords: [] };
  }
}
