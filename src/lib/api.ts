/**
 * Frontend API helper — calls serverless functions at /api/*
 * instead of calling OpenAI directly from the browser.
 */
import type { Language, MasteryLevel, ContentType, ArabicDialect, SpanishDialect } from '../types/database';
import type { LookupWordResult, PassageResult, AIContent } from './openai';

async function post<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiLookupWord(
  input: string,
  options: { language: Language; dialect?: ArabicDialect | SpanishDialect }
): Promise<LookupWordResult> {
  return post<LookupWordResult>('/api/lookup', {
    input,
    language: options.language,
    dialect: options.dialect,
  });
}

export async function apiAnalyzePassage(
  text: string,
  options: { language: Language; dialect?: ArabicDialect | SpanishDialect }
): Promise<PassageResult> {
  return post<PassageResult>('/api/analyze-passage', {
    text,
    language: options.language,
    dialect: options.dialect,
  });
}

export async function apiGenerateLessonContent(
  topic: string,
  language: Language,
  level: MasteryLevel,
  contentType: ContentType = 'word',
  dialect?: ArabicDialect | SpanishDialect,
  excludeWords: string[] = []
): Promise<AIContent> {
  return post<AIContent>('/api/generate-lesson', {
    topic,
    language,
    level,
    contentType,
    dialect,
    excludeWords,
  });
}

export async function apiEvaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  language: Language
): Promise<{ correct: boolean; feedback: string }> {
  return post<{ correct: boolean; feedback: string }>('/api/evaluate-answer', {
    userAnswer,
    correctAnswer,
    language,
  });
}

export async function apiGenerateMemoryImage(
  word: string,
  translation: string,
  customPrompt?: string
): Promise<string | null> {
  try {
    const result = await post<{ imageData: string }>('/api/generate-image', {
      word,
      translation,
      customPrompt,
    });
    return result.imageData;
  } catch (error) {
    console.error('[apiGenerateMemoryImage] Failed:', error);
    return null;
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function apiChat(
  messages: ChatMessage[],
  word: string,
  translation: string,
  context?: string
): Promise<string> {
  const result = await post<{ content: string }>('/api/chat', {
    messages,
    word,
    translation,
    context,
  });
  return result.content;
}
