/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://rezzybyrlm.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/api/*', '/admin/*', '/auth/*'],
  additionalPaths: async (config) => {
    const result = []

    // Add dynamic job pages (if you have them)
    // You would fetch job IDs from your database here
    // const jobs = await fetchJobsFromDatabase()
    // jobs.forEach(job => {
    //   result.push({
    //     loc: `/jobs/${job.id}`,
    //     lastmod: job.updated_at,
    //     changefreq: 'weekly',
    //     priority: 0.7,
    //   })
    // })

    return result
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/'],
      },
    ],
    additionalSitemaps: [
      'https://rezzybyrlm.com/sitemap.xml',
    ],
  },
}
