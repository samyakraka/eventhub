'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RecommendationEngine } from '@/lib/recommendation-engine'
import type { Event } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, MapPin, Users, Star } from 'lucide-react'
import { format } from 'date-fns'

interface EventRecommendationsProps {
  events: Event[]
}

export function EventRecommendations({ events }: EventRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Event[]>([])
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([])
  const { user } = useAuth()
  const recommendationEngine = new RecommendationEngine()

  useEffect(() => {
    if (user && events.length > 0) {
      // Get personalized recommendations
      const userPreferences = {
        priceRange: [0, 1000] as [number, number],
        categories: ['music', 'sports', 'food'],
        location: 'New York', // Default location
        dateRange: [Date.now(), Date.now() + 30 * 24 * 60 * 60 * 1000] as [number, number]
      }

      const personalizedRecs = recommendationEngine.getRecommendations(
        userPreferences,
        events,
        3
      )
      setRecommendations(personalizedRecs)

      // Get trending events
      const trending = recommendationEngine.getTrendingEvents(events, 3)
      setTrendingEvents(trending)
    }
  }, [user, events])

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Personalized Recommendations */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(event.startDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location || 'Virtual Event'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{event.maxAttendees || 'Unlimited'} spots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>${event.ticketPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trending Events */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Trending Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(event.startDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location || 'Virtual Event'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{event.maxAttendees || 'Unlimited'} spots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>${event.ticketPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
