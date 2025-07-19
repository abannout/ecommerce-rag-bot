import { CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"

export function ChatHeader() {
  return (
    <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">AI Shopping Assistant</CardTitle>
          <p className="text-white/80 text-sm mt-1">Your personal shopping companion</p>
        </div>
        <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
          Online
        </Badge>
      </div>
    </CardHeader>
  )
}