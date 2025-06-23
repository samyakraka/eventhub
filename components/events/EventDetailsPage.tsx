"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Ticket, Donation } from "@/types"
import { ArrowLeft, Users, DollarSign, BarChart3, QrCode } from "lucide-react"
import { format } from "date-fns"
import { QRScanner } from "../checkin/QRScanner"
import { LiveStreamViewer } from "../virtual/LiveStreamViewer"

interface EventDetailsPageProps {
  eventId: string
  onBack: () => void
}

export function EventDetailsPage({ eventId, onBack }: EventDetailsPageProps) {
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventDetails()
  }, [eventId])

  const fetchEventDetails = async () => {
    try {
      // Fetch event
      const eventDoc = await getDoc(doc(db, "events", eventId))
      if (eventDoc.exists()) {
        const eventData = {
          id: eventDoc.id,
          ...eventDoc.data(),
          date: eventDoc.data().date.toDate(),
          createdAt: eventDoc.data().createdAt.toDate(),
        } as Event
        setEvent(eventData)
      }

      // Fetch tickets - simplified query
      const ticketsQuery = query(collection(db, "tickets"), where("eventId", "==", eventId))
      const ticketsSnapshot = await getDocs(ticketsQuery)
      const ticketsData = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[]

      // Sort tickets in memory
      ticketsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setTickets(ticketsData)

      // Fetch donations - simplified query
      const donationsQuery = query(collection(db, "donations"), where("eventId", "==", eventId))
      const donationsSnapshot = await getDocs(donationsQuery)
      const donationsData = donationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Donation[]

      // Sort donations in memory
      donationsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setDonations(donationsData)
    } catch (error) {
      console.error("Error fetching event details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  const checkedInCount = tickets.filter((t) => t.checkedIn).length
  const totalRevenue = tickets.reduce((sum, ticket) => sum + (event.ticketPrice || 0), 0)
  const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <p className="text-gray-600">
                  {format(event.date, "MMM dd, yyyy")} at {event.time}
                </p>
              </div>
            </div>
            <Badge className={event.status === "live" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
              {event.status}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Registered</p>
                  <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <QrCode className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Checked In</p>
                  <p className="text-2xl font-bold text-gray-900">{checkedInCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Donations</p>
                  <p className="text-2xl font-bold text-gray-900">${totalDonations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            {event.isVirtual && <TabsTrigger value="stream">Live Stream</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{event.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900 capitalize">{event.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{event.isVirtual ? "Virtual Event" : event.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ticket Price</label>
                    <p className="text-gray-900">{event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tickets
                      .slice(-5)
                      .reverse()
                      .map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">
                              {ticket.registrationData?.firstName} {ticket.registrationData?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Registered {format(ticket.createdAt, "MMM dd, HH:mm")}
                            </p>
                          </div>
                          <Badge variant={ticket.checkedIn ? "default" : "secondary"}>
                            {ticket.checkedIn ? "Checked In" : "Registered"}
                          </Badge>
                        </div>
                      ))}
                    {tickets.length === 0 && <p className="text-gray-500 text-center py-4">No registrations yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendees">
            <Card>
              <CardHeader>
                <CardTitle>Attendee List ({tickets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">
                              {ticket.registrationData?.firstName} {ticket.registrationData?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{ticket.registrationData?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={ticket.checkedIn ? "default" : "secondary"}>
                          {ticket.checkedIn ? "Checked In" : "Registered"}
                        </Badge>
                        <span className="text-xs text-gray-500">{format(ticket.createdAt, "MMM dd")}</span>
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No attendees registered yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin">
            <QRScanner eventId={eventId} />
          </TabsContent>

          {event.isVirtual && (
            <TabsContent value="stream">
              <LiveStreamViewer event={event} hasAccess={true} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
