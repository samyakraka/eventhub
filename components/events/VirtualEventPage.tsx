"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Ticket } from "@/types"
import { ArrowLeft, Calendar, Clock, MapPin, AlertTriangle, Shield, QrCode, Copy, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { LiveStreamViewer } from "../virtual/LiveStreamViewer"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { MyTicketsDialog } from "@/components/dashboard/MyTicketsDialog"

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
  const [showMyTickets, setShowMyTickets] = useState(false)

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

  // Add auto-refresh for check-in status
  useEffect(() => {
    if (!eventId || !user || !hasAccess || isCheckedIn) return;
    const interval = setInterval(() => {
      fetchEventAndAccess();
    }, 5000);
    return () => clearInterval(interval);
  }, [eventId, user, hasAccess, isCheckedIn]);

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
      <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#181F36] to-[#181F36]">
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
      <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#181F36] to-[#181F36]">
        <header className="bg-[#181F36] shadow-sm border-b border-[#232A45] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-4">
              <Button variant="ghost" onClick={onBack} className="text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
              <h1 className="text-2xl font-bold text-white ml-2">{event.title}</h1>
              {event.status === "live" && (
                <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full flex items-center ml-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                  LIVE
                </span>
              )}
              {isCheckedIn && (
                <span className="px-2 py-1 bg-green-700/20 text-green-300 text-xs rounded-full flex items-center ml-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Checked In
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-8 bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none shadow-lg rounded-2xl text-white p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-white font-bold flex items-center">
                <Shield className="w-6 h-6 text-orange-400 mr-2" />
                Check-in Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-300 mb-6 text-lg">
                {event.isVirtual
                  ? "You need to be checked in by an event organizer before accessing this virtual event."
                  : "You need to be checked in at the venue before accessing this event content."}
              </div>
              {/* Event Banner */}
              {event.bannerBase64 && (
                <div className="mb-6">
                  <img
                    src={event.bannerBase64 || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-[220px] object-cover rounded-xl shadow"
                  />
                </div>
              )}
              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                <div className="flex items-center text-blue-100">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(event.date, "MMM dd, yyyy")}
                </div>
                <div className="flex items-center text-blue-100">
                  <Clock className="w-4 h-4 mr-2" />
                  {event.time} - {event.endTime}
                </div>
                <div className="flex items-center text-blue-100">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.isVirtual ? "Virtual Event" : event.location}
                </div>
              </div>
              {/* Check-in Instructions */}
              <div className="mb-6">
                <div className="font-semibold text-blue-300 mb-2 flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  How to Get Checked In
                </div>
                <div className="text-blue-100 space-y-2">
                  {event.isVirtual ? (
                    <>
                      <p>1. Wait for the event organizer to start the check-in process</p>
                      <p>
                        2. Show your QR code from
                        <span
                          className="ml-1 text-blue-400 underline cursor-pointer hover:text-blue-200"
                          onClick={() => setShowMyTickets(true)}
                          tabIndex={0}
                          role="button"
                          aria-label="Open My Tickets"
                        >
                          My Tickets
                        </span>
                        {" "}to the organizer
                      </p>
                      <p>3. Once checked in, you'll automatically gain access to the virtual event</p>
                    </>
                  ) : (
                    <>
                      <p>1. Arrive at the event venue: {event.location}</p>
                      <p>
                        2. Present your QR code from
                        <span
                          className="ml-1 text-blue-400 underline cursor-pointer hover:text-blue-200"
                          onClick={() => setShowMyTickets(true)}
                          tabIndex={0}
                          role="button"
                          aria-label="Open My Tickets"
                        >
                          My Tickets
                        </span>
                        {" "}at the check-in desk
                      </p>
                      <p>3. Once scanned, you'll gain access to all event content</p>
                    </>
                  )}
                </div>
              </div>
              {/* Ticket Info */}
              {ticket && (
                <div className="bg-[#22305A]/80 rounded-xl p-4 mb-8 mt-4 w-full max-w-xl mx-auto shadow-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-blue-100 break-all">Ticket ID: {ticket.id}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="ml-1 text-blue-200 hover:text-blue-100 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 transition-shadow"
                            onClick={() => {
                              navigator.clipboard.writeText(ticket.id);
                              toast({
                                title: "Copied!",
                                description: `Ticket ID copied to clipboard`,
                              });
                            }}
                            tabIndex={0}
                            aria-label="Copy Ticket ID"
                          >
                            <Copy className="w-4 h-4 drop-shadow-[0_0_4px_rgba(255,255,255,0.25)]" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-[#232A45] text-white rounded-md px-3 py-2 text-xs shadow-lg">
                          Click to copy
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-xs text-blue-200">
                    Registered on {format(ticket.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                  </div>
                </div>
              )}
              {/* Success message if checked in */}
              {isCheckedIn && (
                <div className="bg-green-700/20 rounded-lg p-4 mb-8 flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-green-200 font-semibold text-lg">You're now checked in! Access to the event is unlocked.</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                <Button onClick={() => { setShowMyTickets(false); onBack(); }} className="w-full sm:w-auto bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white">
                  Back to Events
                </Button>
                {!isCheckedIn && (
                  <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white">
                    Refresh Status
                  </Button>
                )}
              </div>
            </CardContent>
            <MyTicketsDialog open={showMyTickets} onOpenChange={setShowMyTickets} />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#181F36] to-[#181F36]">
      {/* Header */}
      <header className="bg-[#181F36] shadow-sm border-b border-[#232A45] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Button variant="ghost" onClick={onBack} className="text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
            <h1 className="text-2xl font-bold text-white ml-2">{event.title}</h1>
            {event.status === "live" && (
              <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full flex items-center ml-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                LIVE
              </span>
            )}
            {isCheckedIn && (
              <span className="px-2 py-1 bg-green-700/20 text-green-300 text-xs rounded-full flex items-center ml-2">
                <Shield className="w-3 h-3 mr-1" />
                Checked In
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Description */}
        <Card className="mb-6 bg-[#232A45] rounded-2xl shadow-lg border border-[#232A45] p-6 text-white">
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
          <Card className="bg-[#232A45] rounded-2xl shadow-lg border border-[#232A45] p-6 text-white">
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
