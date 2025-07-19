import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Loader2 } from "lucide-react"

export function LoadingIndicator() {
  return (
    <div className="flex gap-4 justify-start">
      <Avatar className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
        <AvatarFallback className="bg-transparent">
          <Bot className="w-5 h-5 text-white" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          <span className="text-sm text-gray-600">Thinking...</span>
        </div>
      </div>
    </div>
  )
}