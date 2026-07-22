import fs from 'fs';
import path from 'path';
import { parseSubtitle } from './parser.js';
import { timeAwareChunker } from './chunker.js';
import { embeddings } from '../../services/llm.js';
import { getVectorStoreIndex } from '../../services/pinecone.js';

/**
 * Recursively find all subtitle files in a directory.
 */
function findSubtitleFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findSubtitleFiles(fullPath, fileList);
    } else if (file.endsWith('.vtt') || file.endsWith('.srt')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Main ingestion function.
 */
export async function runIngestion(subtitleDir) {
  console.log(`Starting ingestion from ${subtitleDir}`);
  const files = findSubtitleFiles(subtitleDir);
  console.log(`Found ${files.length} subtitle files.`);

  const index = await getVectorStoreIndex();
  let totalChunksIngested = 0;

  for (const file of files) {
    console.log(`Processing: ${file}`);
    try {
      // Basic extraction of course and lesson from path (e.g., module 1/01_what-is_epm.vtt)
      const pathParts = file.split(path.sep);
      const fileName = pathParts.pop();
      const lessonName = fileName.replace(/\.(vtt|srt)$/, '');
      const courseId = pathParts.pop() || 'unknown';

      const cues = parseSubtitle(file);
      const chunks = timeAwareChunker(cues, courseId, lessonName, 60, 15);

      if (chunks.length === 0) continue;

      // Extract texts to embed
      const texts = chunks.map(c => c.text);
      console.log(`  Created ${chunks.length} chunks. Generating embeddings...`);
      
      const vectors = await embeddings.embedDocuments(texts);
      
      // Prepare Pinecone format
      const pineconeRecords = chunks.map((chunk, i) => ({
        id: `${lessonName}-chunk-${i}`,
        values: vectors[i],
        metadata: {
          ...chunk.metadata,
          text: chunk.text // Store text in metadata so we can retrieve it
        }
      }));

      // Upsert in batches (e.g., max 100 per request)
      const batchSize = 100;
      for (let i = 0; i < pineconeRecords.length; i += batchSize) {
        const batch = pineconeRecords.slice(i, i + batchSize);
        // The Pinecone SDK v4 requires an array of records
        try {
          // Some versions take array directly, some take { records: batch }
          // Let's try array first, if not we will use an array of records.
          await index.upsert(batch);
        } catch (error) {
          if (error.message.includes("Must pass in at least 1 record") || error.name === 'PineconeArgumentError') {
             await index.upsert({ records: batch });
          } else {
             throw error;
          }
        }
      }

      totalChunksIngested += chunks.length;
      console.log(`  Successfully uploaded ${chunks.length} vectors to Pinecone.`);
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  console.log(`Ingestion complete! Total chunks ingested: ${totalChunksIngested}`);
}

// If run directly:
// runIngestion(path.resolve('../../class-subtitle'));
