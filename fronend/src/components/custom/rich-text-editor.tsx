"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)
    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const formatButtons = [
    { icon: Bold, action: () => insertText("**", "**"), title: "Bold" },
    { icon: Italic, action: () => insertText("*", "*"), title: "Italic" },
    { icon: Strikethrough, action: () => insertText("~~", "~~"), title: "Strikethrough" },
    { icon: List, action: () => insertText("\n- "), title: "Bullet List" },
    { icon: ListOrdered, action: () => insertText("\n1. "), title: "Numbered List" },
    { icon: Link, action: () => insertText("[", "](url)"), title: "Link" },
    { icon: ImageIcon, action: () => insertText("![alt text](", ")"), title: "Image" },
    { icon: Smile, action: () => insertText("😊"), title: "Emoji" },
  ]

  const alignButtons = [
    { icon: AlignLeft, action: () => insertText('\n<div align="left">\n', "\n</div>\n"), title: "Align Left" },
    { icon: AlignCenter, action: () => insertText('\n<div align="center">\n', "\n</div>\n"), title: "Align Center" },
    { icon: AlignRight, action: () => insertText('\n<div align="right">\n', "\n</div>\n"), title: "Align Right" },
  ]

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2">
        <div className="flex items-center gap-1 flex-wrap">
          {formatButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.title}
              className="h-8 w-8 p-0"
            >
              <button.icon className="w-4 h-4" />
            </Button>
          ))}

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {alignButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.title}
              className="h-8 w-8 p-0"
            >
              <button.icon className="w-4 h-4" />
            </Button>
          ))}

          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant={!isPreview ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsPreview(false)}
            >
              Write
            </Button>
            <Button
              type="button"
              variant={isPreview ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsPreview(true)}
            >
              Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="min-h-[200px]">
        {isPreview ? (
          <div className="p-4 prose max-w-none">
            {content ? (
              <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br>") }} />
            ) : (
              <p className="text-gray-500 italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] border-0 resize-none focus-visible:ring-0 rounded-none"
          />
        )}
      </div>
    </div>
  )
}
