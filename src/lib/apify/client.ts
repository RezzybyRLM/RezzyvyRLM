import { ApifyClient } from 'apify-client'
import { IndeedJob, ApifyScraperConfig } from '@/lib/types/indeed-job'

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN!,
})

export class ApifyIndeedClient {
  private readonly ACTOR_ID = 'hMvNSpz3JnHgl5jkh' // Indeed Scraper actor ID

  async scrapeJobs(config: ApifyScraperConfig): Promise<IndeedJob[]> {
    try {
      // Start the actor run
      const run = await apifyClient.actor(this.ACTOR_ID).call({
        position: config.position,
        country: config.country,
        location: config.location || '',
        maxItems: Math.min(config.maxItems, 10), // Hard limit to 10
        date: config.date,
      })

      if (!run.defaultDatasetId) {
        throw new Error('No dataset ID returned from Apify')
      }

      // Wait for the run to complete and get results
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems({
        limit: config.maxItems,
      })

      return items as unknown as IndeedJob[]
    } catch (error) {
      console.error('Apify scraping error:', error)
      throw new Error(`Failed to scrape jobs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getActorInfo() {
    try {
      const actor = await apifyClient.actor(this.ACTOR_ID).get()
      if (!actor) return null
      
      return {
        name: actor.name,
        description: actor.description,
        version: actor.versions?.[0]?.versionNumber || 'unknown',
        isPublic: actor.isPublic,
      }
    } catch (error) {
      console.error('Failed to get actor info:', error)
      return null
    }
  }

  async checkQuota(): Promise<{ remaining: number; resetDate: string }> {
    // Simplified quota check - return default values
    // In production, you would implement proper quota checking
    return { 
      remaining: 1000, 
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
    }
  }
}

export const apifyIndeedClient = new ApifyIndeedClient()