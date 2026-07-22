import { getVectorStoreIndex } from '../../services/pinecone.js';
import { embeddings } from '../../services/llm.js';
import { translateQuery } from '../query/translator.js';

/**
 * Perform a vector search for a given query string.
 * @param {string} queryString 
 * @param {number} topK 
 * @returns {Array} List of document matches
 */
async function queryVectorDB(queryString, topK) {
  const index = await getVectorStoreIndex();
  
  // Embed the query
  const queryEmbedding = await embeddings.embedQuery(queryString);
  
  // Search
  const response = await index.query({
    topK,
    vector: queryEmbedding,
    includeMetadata: true
  });
  
  return response.matches;
}

/**
 * Retrieves documents using the original query and translated queries (HyDE, Step-Back).
 * We fetch a broader pool (e.g., 120 documents total) to be re-ranked later.
 */
export async function retrieveDocuments(originalQuery) {
  const translations = await translateQuery(originalQuery);
  
  console.log('Query Translations:', translations);

  // We want ~120 candidate documents total, so we can split it 40/40/40
  // across the original, stepBack, and hyde queries.
  const [originalMatches, stepBackMatches, hydeMatches] = await Promise.all([
    queryVectorDB(translations.original, 40),
    queryVectorDB(translations.stepBack, 40),
    queryVectorDB(translations.hyde, 40)
  ]);

  // Combine and deduplicate based on chunk ID
  const allMatches = [...originalMatches, ...stepBackMatches, ...hydeMatches];
  const uniqueMatchesMap = new Map();
  
  for (const match of allMatches) {
    if (!uniqueMatchesMap.has(match.id)) {
      uniqueMatchesMap.set(match.id, match);
    }
  }

  const candidateDocuments = Array.from(uniqueMatchesMap.values());
  return candidateDocuments;
}
