import { normalizeSearchText } from './content-id.js'
import { normalizeArticleText, splitKoreanArticleSentences } from './sentence-splitter.js'

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
  }

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
}

function extractMetaContent(html: string, expression: RegExp): string | null {
  const match = html.match(expression)
  return match?.[1]?.trim() ?? null
}

export function normalizeArticleUrl(url: string): string {
  const normalized = url.trim()
  let parsed: URL

  try {
    parsed = new URL(normalized)
  } catch {
    throw new Error('Enter a valid article URL to continue.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https article URLs are supported.')
  }

  parsed.hash = ''
  return parsed.toString()
}

export function extractArticleSource(html: string): { title: string | null; text: string } {
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)

  const candidateHtml = articleMatch?.[1] ?? mainMatch?.[1] ?? bodyMatch?.[1] ?? html
  const text = normalizeArticleText(stripHtml(candidateHtml))

  const title =
    extractMetaContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? extractMetaContent(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? extractMetaContent(html, /<title>([\s\S]*?)<\/title>/i)

  return {
    title,
    text,
  }
}

function deriveTitleFromText(text: string): string {
  const firstSentence = splitKoreanArticleSentences(text)[0] ?? normalizeArticleText(text)
  if (!firstSentence) {
    return 'Imported article'
  }

  return firstSentence.length > 48 ? `${firstSentence.slice(0, 45).trimEnd()}...` : firstSentence
}

function deriveTitleFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const lastPathSegment = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).at(-1) ?? '').replace(/[-_]+/g, ' ').trim()
    return lastPathSegment || parsed.hostname
  } catch {
    return null
  }
}

export function deriveArticleTitle(input: { providedTitle?: string; scrapedTitle?: string | null; url?: string; text: string }): string {
  const providedTitle = input.providedTitle?.trim()
  if (providedTitle) {
    return providedTitle
  }

  const scrapedTitle = input.scrapedTitle?.trim()
  if (scrapedTitle) {
    return scrapedTitle
  }

  return deriveTitleFromUrl(input.url ?? '') ?? deriveTitleFromText(input.text)
}

export function createArticleSearchText(title: string, sentences: string[], sourceDetail?: string): string {
  return normalizeSearchText([title, sourceDetail ?? '', ...sentences].join(' '))
}

export function createArticleDuplicateCheckText(sentences: string[]): string {
  return normalizeSearchText(sentences.join(' '))
}