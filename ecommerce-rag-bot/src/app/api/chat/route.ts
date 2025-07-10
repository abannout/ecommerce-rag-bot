import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stringify } from "querystring";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const EMBED_API = process.env.EMBED_API!;
const KISKI_API = process.env.KISKI_ENDPOINT!;
const KISKI_API_KEY = process.env.KISKI_API!;

async function embedQuery(query: string) {
  const res = await fetch(EMBED_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: query }),
  });
  const json = await res.json();
  return json.embedding;
}

async function generateAnswer(context: string, query: string) {
  const messages  = [
    {
      role: "system",
      content: "You are a helpful e-commerce assistant. Use the product info provided to answer the user's question. please in reply in the langauge that the user uses, if there is no product info provided, just say there si no matching products",
    },
    {
      role: "user",
      content: `${context}\n\nQ: ${query}`,
    },
  ];

  let res, json;

    try {
    res = await fetch(KISKI_API, {
     method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${KISKI_API_KEY}`,
        },
     body: JSON.stringify({
       model: "meta-llama-3.1-8b-instruct",
       messages,
       max_tokens: 512,
       temperature: 0.5,
       top_p: 0.5,
     }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`LLM API Error (${res.status}): ${errorText}`);
     }
     console.log(res)

      json = await res.json();
      const answer = json.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("No answer returned from LLM. Full response: " + JSON.stringify(json));
    }

    return answer;

    } catch (error: any) {
     console.error("Fetch error:", error.message);
     throw new Error("Failed to call LLM API");
}

}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    console.log("User query:", query);

    const embedding = await embedQuery(query);

    const { data: matches } = await supabase.rpc("match_product_chunks", {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 5,
    });

    let context = "";
    if (matches && matches.length > 0) {
      context = matches.map((m: any) => m.content).join("\n\n");
    } else {
      context = "No relevant product data available.";
    }

    const answer = await generateAnswer(context, query);

    if (!answer) {
      throw new Error("No answer returned from LLM.");
    }

    return NextResponse.json({ answer });

  } catch (e: any) {
    console.error("Error in POST /api/chat:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}

