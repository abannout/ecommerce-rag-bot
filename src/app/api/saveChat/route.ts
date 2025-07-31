import supabase from "@/db/supabase";
import embedQuery from "@/lib/embed";
import { NextResponse } from "next/server";
import generateAnswer from "../../../lib/generateAnswer";


export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        console.log("User query:", query);

        const embedding = await embedQuery(query);

        const { data: matches } = await supabase.rpc("match_product_chunks", {
            query_embedding: embedding,
            match_threshold: 0.8,
            match_count: 5,
        });
        console.log(JSON.stringify(matches))
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

