import { useRef, useEffect, forwardRef } from "react"
import { MessageBubble } from "./MessageBubble"
import { LoadingIndicator } from "./LoadingIndicator"
import type { Message } from "@/types/chat"

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isLoading }, ref) => {
    return (
      <div
        ref={ref}
        className="flex-1 p-6 overflow-y-auto scroll-smooth"
        style={{ maxHeight: "calc(85vh - 200px)" }}
      >
        <div className="space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && <LoadingIndicator />}
        </div>
      </div>
    )
  }
)

ChatMessages.displayName = "ChatMessages"