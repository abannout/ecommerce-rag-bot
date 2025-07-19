export interface ChatResponse {
  answer: string
  error?: string
}

export async function sendMessage(query: string): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
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