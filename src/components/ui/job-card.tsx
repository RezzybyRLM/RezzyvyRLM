import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, MapPin, Clock, DollarSign, Bookmark } from 'lucide-react'
import { formatRelativeTime, formatSalary, getJobTypeColor } from '@/lib/utils'
import { TransformedJob } from '@/lib/types/indeed-job'

interface JobCardProps {
  job: TransformedJob
  onBookmark?: (jobId: string) => void
  isBookmarked?: boolean
}

export function JobCard({ job, onBookmark, isBookmarked = false }: JobCardProps) {
  const handleApply = () => {
    if (job.source === 'indeed') {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer')
    } else {
      // For premium jobs, navigate to internal application
      window.location.href = `/jobs/${job.id}/apply`
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {job.title}
            </h3>
            <p className="text-primary font-medium">{job.company_name}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {job.source === 'premium' && (
              <Badge variant="featured">Featured</Badge>
            )}
            {onBookmark && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onBookmark(job.id)}
                className={isBookmarked ? 'text-accent' : 'text-gray-400'}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Job Details */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            {job.job_type && (
              <Badge 
                variant="outline" 
                className={getJobTypeColor(job.job_type)}
              >
                {job.job_type}
              </Badge>
            )}
          </div>

          {/* Salary */}
          {job.salary_range && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>{formatSalary(job.salary_range)}</span>
            </div>
          )}

          {/* Posted Date */}
          {job.scraped_at && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Posted {formatRelativeTime(job.scraped_at)}</span>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-700 text-sm line-clamp-3">
            {job.description}
          </p>

          {/* Apply Button */}
          <div className="pt-2">
            <Button 
              onClick={handleApply}
              className="w-full"
              variant={job.source === 'indeed' ? 'default' : 'secondary'}
            >
              {job.source === 'indeed' ? (
                <>
                  Apply on Indeed
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Apply Now'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
