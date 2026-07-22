import { mainLLM } from '../../services/llm.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * Generates an answer using the main LLM and strictly cites sources based on context metadata.
 */
export async function generateAnswer(query, topKDocs) {
  const contextString = topKDocs.map((doc, index) => {
    const meta = doc.metadata;
    return `[Document ${index + 1}]
Text: ${meta.text}
Lesson: ${meta.lesson_name}
Start Time: ${meta.start_time}`;
  }).join('\n\n');

  const template = `You are an expert teaching assistant.
Answer the user's question using ONLY the provided context. 
If the context does not contain the answer, say "I do not have enough information to answer that based on the course materials."

Crucially, you MUST cite your source for every piece of information using the exact metadata format: [Lesson: <lesson_name> @ <start_time>].
Do not make up citations. Only use the metadata provided below.

Context:
{context}

Question: {question}
Answer with Citations:`;

  const prompt = PromptTemplate.fromTemplate(template);
  const chain = prompt.pipe(mainLLM).pipe(new StringOutputParser());
  
  const response = await chain.invoke({
    context: contextString,
    question: query
  });

  return response;
}
