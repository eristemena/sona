import { extractArticleSource, normalizeArticleUrl } from '@sona/domain/content'

interface ArticleScraperRuntime {
  fetch: typeof fetch
}

export interface ScrapedArticle {
  url: string
  title: string | null
  text: string
}

export class ArticleScraper {
  constructor(private readonly runtime: ArticleScraperRuntime = { fetch }) {}

  async scrape(url: string): Promise<ScrapedArticle> {
    const normalizedUrl = normalizeArticleUrl(url)

    let response: Response
    try {
      response = await this.runtime.fetch(normalizedUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
        },
      })
    } catch {
      throw new Error('The article could not be retrieved. Paste the text instead or try again when the source is reachable.')
    }

    if (!response.ok) {
      throw new Error('The article could not be retrieved. Paste the text instead or try again when the source is reachable.')
    }

    const html = await response.text()
    const extracted = extractArticleSource(html)

    if (!extracted.text) {
      throw new Error('The article could not be extracted from the provided URL.')
    }

    return {
      url: normalizedUrl,
      title: extracted.title,
      text: extracted.text,
    }
  }
}