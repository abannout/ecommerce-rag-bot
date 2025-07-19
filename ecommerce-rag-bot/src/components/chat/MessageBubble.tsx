import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User } from "lucide-react"
import type { Message } from "@/types/chat"

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div
      className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      {message.role === "assistant" && (
        <Avatar className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
          <AvatarFallback className="bg-transparent">
            <Bot className="w-5 h-5 text-white" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            message.role === "user"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto"
              : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <p
          className={`text-xs mt-2 ${
            message.role === "user" ? "text-right text-gray-500" : "text-left text-gray-400"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
      {message.role === "user" && (
        <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
          <AvatarFallback className="bg-transparent">
            <User className="w-5 h-5 text-white" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}