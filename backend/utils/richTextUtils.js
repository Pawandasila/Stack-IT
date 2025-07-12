import User from "../models/user.model.js";
import { createNotification } from "../controllers/notificationController.js";

// Extract @mentions from text content
export const extractMentions = (content) => {
  if (!content) return [];
  
  // Regex to match @username patterns
  const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      username: match[1],
      position: match.index,
      fullMatch: match[0]
    });
  }
  
  return mentions;
};

// Process mentions and create notifications
export const processMentions = async (content, senderId, relatedQuestion, relatedAnswer = null, relatedComment = null) => {
  try {
    const mentions = extractMentions(content);
    
    if (mentions.length === 0) {
      return [];
    }
    
    const createdNotifications = [];
    
    for (const mention of mentions) {
      // Find user by username (assuming username is same as name for now)
      const mentionedUser = await User.findOne({ 
        name: { $regex: new RegExp(`^${mention.username}$`, 'i') }
      });
      
      if (mentionedUser && mentionedUser._id.toString() !== senderId.toString()) {
        // Get context around the mention (50 chars before and after)
        const contextStart = Math.max(0, mention.position - 50);
        const contextEnd = Math.min(content.length, mention.position + mention.fullMatch.length + 50);
        const context = content.substring(contextStart, contextEnd);
        
        const notification = await createNotification({
          recipient: mentionedUser._id,
          sender: senderId,
          type: "mention",
          title: "You were mentioned",
          message: `Someone mentioned you in a ${relatedComment ? 'comment' : relatedAnswer ? 'answer' : 'question'}`,
          relatedQuestion,
          relatedAnswer,
          relatedComment,
          metadata: {
            mentionContext: context
          }
        });
        
        if (notification) {
          createdNotifications.push(notification);
        }
      }
    }
    
    return createdNotifications;
  } catch (error) {
    console.error('Error processing mentions:', error);
    return [];
  }
};

// Validate and sanitize rich text content
export const sanitizeRichText = (content) => {
  if (!content) return '';
  
  // Allow specific HTML tags for rich text
  const allowedTags = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'span', 'div'
  ];
  
  const allowedAttributes = {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'span': ['style'],
    'div': ['style'],
    'p': ['style']
  };
  
  // Basic HTML sanitization (in production, use a proper library like DOMPurify)
  let sanitized = content;
  
  // Remove script tags completely
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: URLs
  
  return sanitized;
};

// Extract plain text from rich text content for search/indexing
export const extractPlainText = (richTextContent) => {
  if (!richTextContent) return '';
  
  // Remove HTML tags and get plain text
  return richTextContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

// Validate image URLs
export const validateImageUrl = (url) => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Process rich text content (sanitize + extract mentions)
export const processRichTextContent = async (content, senderId, relatedQuestion, relatedAnswer = null, relatedComment = null) => {
  // Sanitize the content
  const sanitizedContent = sanitizeRichText(content);
  
  // Extract plain text for search
  const plainText = extractPlainText(sanitizedContent);
  
  // Process mentions
  const mentionNotifications = await processMentions(plainText, senderId, relatedQuestion, relatedAnswer, relatedComment);
  
  return {
    sanitizedContent,
    plainText,
    mentionNotifications
  };
};
