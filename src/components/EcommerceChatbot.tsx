"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChatHeader } from "./chat/ChatHeader"
import { ChatMessages } from "./chat/ChatMessages"
import { ChatInput } from "./chat/ChatInput"
import { sendMessage } from "@/lib/chatService"
import type { Message } from "@/types/chat"
import useAuth from "./hooks/useAuth"
import useChatMessages from "./hooks/useChatMessages"

// Utility functions
const generateMessageId = () => Date.now().toString()

const createMessage = (
  role: Message["role"],
  content: string,
  id?: string
): Message => ({
  id: id || generateMessageId(),
  role,
  content,
  timestamp: new Date(),
})

export default function EcommerceChatbot() {
  const { userId, isInitialized } = useAuth()
  const { messages, addMessage, addMessages } = useChatMessages(userId, isInitialized)
  const [isLoading, setIsLoading] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = async (content: string) => {
    if (!userId) {
      console.error("User is not authenticated")
      return
    }

    const userMessage = createMessage("user", content)
    addMessage(userMessage)
    setIsLoading(true)

    try {
      const response = await sendMessage(content, userId)
      const assistantMessage = createMessage("assistant", response)
      addMessage(assistantMessage)
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = createMessage(
        "assistant",
        "Sorry, I encountered an error while processing your request. Please try again."
      )
      addMessage(errorMessage)
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