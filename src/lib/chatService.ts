import supabase from "@/db/supabase"

export interface ChatResponse {
  answer: string
  error?: string
}

export async function sendMessage(query: string,userId:string): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query , userId }),
  })

  if (!response.ok) {
    throw new Error("Failed to get response")
  }

  const data: ChatResponse = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data.answer
}

export async function saveUserChat(userId:string, chat:string ,context:string) {
  
  const {error} = await supabase.from("chats").insert({
        user_id: userId,
        role: "user",
        content: chat,
        context:context
      })
      if(error){
        throw new Error("Could not save chat from User!!" + JSON.stringify(error.message))
      }
}
export async function saveAssistantChat(userId:string, answer:string) {
  
  const {error} = await supabase.from("chats").insert({
        user_id: userId,
        role: "assistant",
        content:answer,
      })
      if(error){
        throw new Error("Could not save chat from assistant!!" + JSON.stringify(error.message))
      }
}
export async function getRecentChatForUser(userId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select("id, user_id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(4)

  if (error) {
    console.error("Error fetching recent messages:", error)
    return { data: null, error }
  }

  // Reverse (oldest first)
  const messages = data?.reverse() || []
  return { data: messages, error: null }
}