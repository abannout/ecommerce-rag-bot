import { pipeline } from '@xenova/transformers';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
 /* const model = await SentenceTransformer.from_pretrained(
    "intfloat/multilingual-e5-small",
  );
  */
    const extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small');

const query = await req.json();
  console.log("user querey is:" + query)
  const sentence_embedding = await extractor('mean', { pooling: 'mean', normalize: true });
  // returns Tensor from '@xenova/transformers'
        return NextResponse.json( sentence_embedding);
}

