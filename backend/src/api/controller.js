import { checkInputGuardrails } from '../rag/guardrails/input.js';
import { checkOutputGuardrails } from '../rag/guardrails/output.js';
import { routeQuery } from '../rag/query/router.js';
import { retrieveDocuments } from '../rag/retrieval/search.js';
import { rerankDocuments } from '../rag/retrieval/reranker.js';
import { generateAnswer } from '../rag/generation/generate.js';
import { gradeResponse } from '../rag/generation/crag.js';

export async function handleChat(req, res) {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    // 1. Input Guardrails
    const guardrailCheck = checkInputGuardrails(query);
    if (!guardrailCheck.isValid) {
      return res.status(403).json({ answer: guardrailCheck.reason });
    }

    let currentQuery = query;
    let finalAnswer = "";
    let rewrites = 0;
    const MAX_REWRITES = 3;

    // C-RAG Loop
    while (rewrites < MAX_REWRITES) {
      console.log(`[RAG Loop] Iteration ${rewrites + 1} for query: ${currentQuery}`);

      // 2. Query Routing (Hardcoded to vector-store for now)
      const route = await routeQuery(currentQuery);
      if (route !== 'vector-store') {
        return res.json({ answer: "Query routed outside of course context." });
      }

      // 3. Retrieval (includes HyDE & Step-Back internally)
      const candidateDocs = await retrieveDocuments(currentQuery);

      // 4. Re-ranking
      const topDocs = await rerankDocuments(currentQuery, candidateDocs, 5);

      if (topDocs.length === 0) {
        finalAnswer = "I couldn't find any relevant course materials to answer your question.";
        break;
      }

      // 5. Generation
      const generatedAnswer = await generateAnswer(query, topDocs);

      // 6. C-RAG Evaluation
      const evaluation = await gradeResponse(query, topDocs, generatedAnswer);
      console.log(`[C-RAG Eval] Score: ${evaluation.score}, Reason: ${evaluation.reasoning}`);

      if (evaluation.score >= 6) {
        finalAnswer = generatedAnswer;
        break; // Good answer, exit loop
      } else {
        console.log(`[C-RAG] Score below threshold. Missing keywords: ${evaluation.missingKeywords}`);
        if (evaluation.missingKeywords && evaluation.missingKeywords.length > 0) {
          // Adjust query with missing keywords for the next loop
          currentQuery = `${query} ${evaluation.missingKeywords.join(' ')}`;
        }
        rewrites++;
        
        // If we hit max rewrites, just use the last generated answer anyway
        if (rewrites === MAX_REWRITES) {
          finalAnswer = generatedAnswer;
        }
      }
    }

    // 7. Output Guardrails
    const safeOutput = checkOutputGuardrails(finalAnswer);

    return res.json({ answer: safeOutput });
  } catch (error) {
    console.error("Error in RAG pipeline:", error);
    return res.status(500).json({ error: "Internal server error processing your request." });
  }
}
