import { NextResponse } from "next/server";
import generateAnswer from "../../../lib/chat/generateAnswer";
import { getRecentChatForUser, saveAssistantChat, saveUserChat } from "@/lib/chat/chatService";
import { performEnhancedSearch } from "@/lib/querySearch/enhancedSearch";

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    context?: string,
    timestamp?: Date;
}

export async function POST(req: Request) {
    try {
        const { query, userId } = await req.json();
        console.log("User query:", query);

        const matches = await performEnhancedSearch(query, 5);
        console.log("Enhanced search results:", matches.length);

        const { data: recentChats, error: chatError } = await getRecentChatForUser(userId);
        let chatHistory: ChatMessage[] = [];
        
        if (recentChats && !chatError) {

            chatHistory = recentChats.map((chat: any) => ({
                role: chat.role as 'user' | 'assistant',
                content: chat.content,
                context:chat.context!,
                timestamp: new Date(chat.created_at)
            }));
            console.log(`Loaded ${chatHistory.length} previous messages for context`);
        } else if (chatError) {
            console.warn("Could not load chat history:", chatError);
        }
        
        let context = "";
        if (matches && matches.length > 0) {
            context = matches.map((m: any) => {
                const genderInfo = m.extracted_attributes?.gender ? ` (Gender: ${m.extracted_attributes.gender})` : '';
                const categoryInfo = m.extracted_attributes?.category ? ` (Category: ${m.extracted_attributes.category})` : '';
                
                return `Product: ${m.content}${genderInfo}${categoryInfo}`;
            }).join("\n\n");
        } else {
            context = "No relevant product data available.";
        }

        saveUserChat(userId, query, context);
        const answer = await generateAnswer(context, query, chatHistory);
        
        if (!answer) {
            throw new Error("No answer returned from LLM.");
        }
        
        saveAssistantChat(userId, answer);
        return NextResponse.json({ answer });

    } catch (e: any) {
        console.error("Error in POST /api/chat:", e);
        return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
    }
}