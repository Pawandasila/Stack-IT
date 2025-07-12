"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}


const emojiCategories = {
  smileys: {
    title: "Smileys & People",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳"]
  },
  gestures: {
    title: "Gestures",
    emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"]
  },
  objects: {
    title: "Objects & Symbols",
    emojis: ["💻", "📱", "⌨️", "🖥️", "🖨️", "📊", "📈", "📉", "💡", "🔒", "🔓", "🔑", "⚡", "🔥", "💯", "✅", "❌", "⭐", "🎯", "🚀", "💎", "🏆", "🎉", "🎊"]
  },
  nature: {
    title: "Nature",
    emojis: ["🌱", "🌿", "🍀", "🌳", "🌲", "🌴", "🌵", "🌸", "🌺", "🌻", "🌹", "🌷", "🌼", "💐", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🥝", "🍒", "🥥"]
  }
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof emojiCategories>('smileys')
  const [emojiSearch, setEmojiSearch] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)
    onChange(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertEmoji = (emoji: string) => {
    insertText(emoji)
  }

 
  const getFilteredEmojis = () => {
    if (!emojiSearch) {
      return emojiCategories[selectedEmojiCategory].emojis;
    }
    
    
    const allEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis);
    return allEmojis.filter(emoji => {
     
      return emoji.includes(emojiSearch);
    });
  }

  const formatButtons = [
    { icon: Bold, action: () => insertText("**", "**"), title: "Bold" },
    { icon: Italic, action: () => insertText("*", "*"), title: "Italic" },
    { icon: Strikethrough, action: () => insertText("~~", "~~"), title: "Strikethrough" },
    { icon: List, action: () => insertText("\n- "), title: "Bullet List" },
    { icon: ListOrdered, action: () => insertText("\n1. "), title: "Numbered List" },
    { icon: Link, action: () => insertText("[", "](url)"), title: "Link" },
    { icon: ImageIcon, action: () => insertText("![alt text](", ")"), title: "Image" },
    { icon: Code, action: () => insertText("```\n", "\n```"), title: "Code Block" },
    { icon: Quote, action: () => insertText("> "), title: "Quote" },
  ]

  const alignButtons = [
    { icon: AlignLeft, action: () => insertText('\n<div align="left">\n', "\n</div>\n"), title: "Align Left" },
    { icon: AlignCenter, action: () => insertText('\n<div align="center">\n', "\n</div>\n"), title: "Align Center" },
    { icon: AlignRight, action: () => insertText('\n<div align="right">\n', "\n</div>\n"), title: "Align Right" },
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
  
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            {formatButtons.map((button, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.title}
                className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
            
           
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Insert Emoji"
                  className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3">
                  <div className="text-sm font-medium mb-3">Insert Emoji</div>
                  
               
                  <div className="mb-3">
                    <Input
                      placeholder="Search emojis..."
                      value={emojiSearch}
                      onChange={(e) => setEmojiSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  {!emojiSearch && (
                    <>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2">Quick Access</div>
                        <div className="flex gap-1 flex-wrap">
                          {["😀", "😍", "🤔", "👍", "👎", "❤️", "🎉", "🔥", "💯", "✅"].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => insertEmoji(emoji)}
                              className="w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                     
                      <div className="flex gap-1 mb-3 border-b">
                        {Object.entries(emojiCategories).map(([key, category]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedEmojiCategory(key as keyof typeof emojiCategories)}
                            className={`px-2 py-1 text-xs rounded-t border-b-2 transition-colors ${
                              selectedEmojiCategory === key
                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            {category.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  
                
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {getFilteredEmojis().map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => insertEmoji(emoji)}
                        className="w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  
                  {emojiSearch && getFilteredEmojis().length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No emojis found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <div className="flex items-center gap-1">
            {alignButtons.map((button, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.title}
                className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          <div className="ml-auto flex gap-1">
            <Button
              type="button"
              variant={!isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(false)}
              className="transition-all"
            >
              Write
            </Button>
            <Button
              type="button"
              variant={isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(true)}
              className="transition-all"
            >
              Preview
            </Button>
          </div>
        </div>
      </div>

      
      <div className="min-h-[200px]">
        {isPreview ? (
          <div className="p-4 prose prose-sm max-w-none overflow-auto">
            {content ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                 
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto border border-gray-200">
                      {children}
                    </pre>
                  ),
                  code: ({ children, className, ...props }: any) => {
                    const isInline = !className || !className.includes('language-')
                    return isInline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="text-sm font-mono" {...props}>
                        {children}
                      </code>
                    )
                  },
              
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 bg-blue-50 py-2 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-4 py-2">
                      {children}
                    </td>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-500 italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Start writing your content here... Use the toolbar above for formatting options."}
            className="min-h-[200px] border-0 resize-none focus-visible:ring-0 rounded-none p-4 font-mono text-sm leading-relaxed"
          />
        )}
      </div>
    </div>
  )
}