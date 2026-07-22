import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

let pineconeClient = null;

export async function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

export async function getVectorStoreIndex() {
  const client = await getPineconeClient();
  // Assume the index is named 'udemy-rag'
  return client.Index(process.env.PINECONE_INDEX || 'udemy-rag');
}
