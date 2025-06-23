"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Ticket } from "@/types"
import { ArrowLeft, Calendar, Clock, MapPin, AlertTriangle, Shield, QrCode } from "lucide-react"
import { format } from "date-fns"
import { LiveStreamViewer } from "../virtual/LiveStreamViewer"

interface VirtualEventPageProps {
  eventId: string
  onBack: () => void
}

export function VirtualEventPage({ eventId, onBack }: VirtualEventPageProps) {
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    fetchEventAndAccess()
  }, [eventId, user])

  const fetchEventAndAccess = async () => {
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

      // Check if user has access (registered for event)
      if (user) {
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId),
          where("attendeeUid", "==", user.uid),
        )
        const ticketsSnapshot = await getDocs(ticketsQuery)

        if (!ticketsSnapshot.empty) {
          const ticketData = {
            id: ticketsSnapshot.docs[0].id,
            ...ticketsSnapshot.docs[0].data(),
            createdAt: ticketsSnapshot.docs[0].data().createdAt.toDate(),
          } as Ticket

          setTicket(ticketData)
          setHasAccess(true)
          setIsCheckedIn(ticketData.checkedIn || false)
        } else {
          setHasAccess(false)
          setIsCheckedIn(false)
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!eventId || !user || !hasAccess) return

    // Real-time listener for event updates
    const eventUnsubscribe = onSnapshot(
      doc(db, "events", eventId),
      (doc) => {
        if (doc.exists()) {
          const eventData = {
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate(),
          } as Event
          setEvent(eventData)
        }
      },
      (error) => {
        console.error("Error listening to event updates:", error)
      },
    )

    // Real-time listener for ticket updates (to detect check-in status changes)
    let ticketUnsubscribe: (() => void) | undefined

    if (ticket) {
      ticketUnsubscribe = onSnapshot(
        doc(db, "tickets", ticket.id),
        (doc) => {
          if (doc.exists()) {
            const ticketData = doc.data() as Ticket
            setIsCheckedIn(ticketData.checkedIn || false)
          }
        },
        (error) => {
          console.error("Error listening to ticket updates:", error)
        },
      )
    }

    return () => {
      eventUnsubscribe()
      if (ticketUnsubscribe) ticketUnsubscribe()
    }
  }, [eventId, user, hasAccess, ticket])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading event...</p>
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

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Required</h2>
            <p className="text-gray-600 mb-6">You need to register for this event to access the content.</p>
            <Button onClick={onBack}>Back to Events</Button>
          </div>
        </div>
      </div>
    )
  }

  // Check-in requirement for ALL events (both virtual and physical)
  if (event.requiresCheckIn && !isCheckedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <Shield className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Check-in Required</h2>
            <p className="text-gray-600 mb-8 text-lg">
              {event.isVirtual
                ? "You need to be checked in by an event organizer before accessing this virtual event."
                : "You need to be checked in at the venue before accessing this event content."}
            </p>

            {/* Event Details Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  {event.logoBase64 && (
                    <img src={event.logoBase64 || "/placeholder.svg"} alt="Event logo" className="w-8 h-8 rounded" />
                  )}
                  <span>{event.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{format(event.date, "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      {event.time} - {event.endTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{event.isVirtual ? "Virtual Event" : event.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Check-in Instructions */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-orange-800 mb-3 flex items-center justify-center">
                <QrCode className="w-5 h-5 mr-2" />
                How to Get Checked In
              </h3>
              <div className="text-orange-700 space-y-2">
                {event.isVirtual ? (
                  <>
                    <p>1. Wait for the event organizer to start the check-in process</p>
                    <p>2. Show your QR code from "My Tickets" to the organizer</p>
                    <p>3. Once checked in, you'll automatically gain access to the virtual event</p>
                  </>
                ) : (
                  <>
                    <p>1. Arrive at the event venue: {event.location}</p>
                    <p>2. Present your QR code from "My Tickets" at the check-in desk</p>
                    <p>3. Once scanned, you'll gain access to all event content</p>
                  </>
                )}
              </div>
            </div>

            {/* Ticket Information */}
            {ticket && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-blue-800 font-medium">Your Ticket ID: {ticket.id.slice(0, 8)}...</p>
                <p className="text-blue-700 text-sm">
                  Registered on {format(ticket.createdAt, "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}

            <Button onClick={onBack} className="mr-4">
              Back to Events
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                  {event.status === "live" && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                      LIVE
                    </span>
                  )}
                  {isCheckedIn && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Checked In
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(event.date, "MMM dd, yyyy")}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {event.time} - {event.endTime}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {event.isVirtual
                      ? event.virtualType === "meeting"
                        ? "Virtual Meeting"
                        : "Live Broadcast"
                      : event.location}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About This Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{event.description}</p>
            {event.isVirtual && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  {event.virtualType === "meeting"
                    ? "🎥 This is a virtual meeting event - you'll join via video call"
                    : "📺 This is a live broadcast event with interactive chat"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Status Message */}
        {event.status !== "live" && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {event.status === "upcoming" ? "Event Starting Soon" : "Event Completed"}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {event.status === "upcoming"
                      ? `This event will begin at ${event.time} on ${format(event.date, "MMM dd, yyyy")}`
                      : "This event has ended. Thank you for participating!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Stream or Event Content */}
        {event.isVirtual ? (
          <LiveStreamViewer event={event} hasAccess={true} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Event Access Granted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Welcome to {event.title}!</h3>
                <p className="text-gray-600 mb-4">
                  You have been successfully checked in. Enjoy the event at {event.location}!
                </p>
                {event.status === "live" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">🎉 The event is currently live!</p>
                    <p className="text-green-700 text-sm">Make sure you're at the venue to participate.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
