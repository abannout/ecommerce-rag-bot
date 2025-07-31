"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChatHeader } from "./chat/ChatHeader"
import { ChatMessages } from "./chat/ChatMessages"
import { ChatInput } from "./chat/ChatInput"
import { sendMessage } from "@/lib/chatService"
import type { Message } from "@/types/chat"
import supabase from "@/db/supabase"

export default function EcommerceChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI shopping assistant. How can I help you find the perfect product today?",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [userId, setUserId] = useState<string | null>(null)


  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const init = async () => {
      // Check existing Supabase Auth session
      const { data: UserData, error: sessionError } = await supabase.auth.getUser()
      if (sessionError) {
        console.error("Error getting UserData:", sessionError)
      }

      let user = UserData?.user?.id
      console.log(user + "ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss");

      if (!user) {
        // No active session => sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error || !data) {
          console.error("Anon sign‑in failed:", error)
          return
        }
        user = data.user?.id

      }
    
      if (user) {
        setUserId(user)
        //localStorage.setItem("session_id", user)

        // Fetch past messages for this user
        const { data: msgs, error: msgErr } = await supabase
          .from("chats")
          .select("user_id, role, content, created_at")
          .eq("user_id", user)
          .order("created_at", { ascending: true })

        if (msgErr) {
          console.error("Error loading messages:", msgErr)
        } else if (msgs) {
          const loaded = msgs.map((row) => ({
            id: row.user_id.toString(),
            role: row.role as Message["role"],
            content: row.content,
            timestamp: new Date(row.created_at),
          }))
          setMessages(loaded)
        }
      }
    }
     init()
  }, [])

  const handleSendMessage = async (content: string) => {
        if (!userId) throw Error("User is not logged In")

  
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      /*
      await supabase.from("messages").insert({
        user_id: userId,
        role: "user",
        content,
      })
*/
      const response = await sendMessage(content,userId)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      // Insert assistant message
      /*await supabase.from("messages").insert({
        user_id: userId,
        role: "assistant",
        content: response,
      })
      */
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[85vh] bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden flex flex-col">
        <ChatHeader />
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <ChatMessages
            ref={messagesContainerRef}
            messages={messages}
            isLoading={isLoading}
          />
          <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}