import supabase from "@/db/supabase"
import { Message } from "@/types/chat"
import { useCallback, useEffect, useState } from "react"

const useChatMessages = (userId: string | null, isAuthInitialized: boolean) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI shopping assistant. How can I help you find the perfect product today?",
      timestamp: new Date(),
    },
  ])

  const loadMessages = useCallback(async () => {
    if (!userId) return

    try {
      const { data: msgs, error } = await supabase
        .from("chats")
        .select("id, user_id, role, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading messages:", error)
        return
      }

      if (msgs && msgs.length > 0) {
        const loadedMessages = msgs.map((row, index) => ({
          id: row.id,
          role: row.role as Message["role"],
          content: row.content,
          timestamp: new Date(row.created_at),
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }, [userId])

  useEffect(() => {
    if (isAuthInitialized && userId) {
      loadMessages()
    }
  }, [isAuthInitialized, userId, loadMessages])

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const addMessages = useCallback((newMessages: Message[]) => {
    setMessages(prev => [...prev, ...newMessages])
  }, [])

  return { messages, addMessage, addMessages }
}

export default useChatMessages;