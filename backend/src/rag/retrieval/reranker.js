/**
 * Re-ranks candidate documents.
 * In a full production system, you would use Cohere Re-rank API here.
 * For this implementation, we will use a naive keyword-overlap heuristic 
 * or just return the top K based on the original Pinecone score if no API is available.
 */

export async function rerankDocuments(query, candidateDocs, topK = 5) {
  // Sort primarily by the vector similarity score from Pinecone
  // If we had Cohere:
  // const response = await cohere.rerank({ query, documents: candidateDocs.map(d => d.metadata.text), topN: topK });
  // return response.results...

  // Simulated re-ranking: simply sort by score and return Top K
  const sorted = candidateDocs.sort((a, b) => b.score - a.score);
  
  return sorted.slice(0, topK);
}
