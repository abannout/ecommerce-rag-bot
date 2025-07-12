"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, ShoppingCart, Loader2 } from 'lucide-react';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function EcommerceChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI shopping assistant. How can I help you find the perfect product today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[85vh] bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-6">
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

        <CardContent className="p-0 h-full flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
                      <AvatarFallback className="bg-transparent">
                        <Bot className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex flex-col max-w-[75%]">
                    <div
                      className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200'
                        }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-right text-gray-500' : 'text-left text-gray-400'
                      }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                      <AvatarFallback className="bg-transparent">
                        <User className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
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
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <Separator />

          <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e: any) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about products, prices, recommendations..."
                className="flex-1 rounded-full border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-400 px-4 py-3 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full px-6 py-3 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                Powered by AI • Ask about products, compare items, or get recommendations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}