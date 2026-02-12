'use client';

import { useEffect, useRef } from 'react';

export interface WC3ChatMessage {
  id: string;
  text: string;
  type: 'ally' | 'enemy' | 'system';
  timestamp?: number;
}

interface WC3ChatLogProps {
  messages: WC3ChatMessage[];
  className?: string;
  autoScroll?: boolean;
}

export function WC3ChatLog({ messages, className = '', autoScroll = true }: WC3ChatLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);
  
  return (
    <div ref={scrollRef} className={`wc3-chat-log wc3-scrollbar ${className}`}>
      {messages.map((msg) => (
        <div key={msg.id} className={`wc3-chat-line wc3-chat-line--${msg.type}`}>
          {msg.text}
        </div>
      ))}
    </div>
  );
}
