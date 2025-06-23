"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Ticket } from "@/types"
import { QrCode, Calendar, MapPin, Clock, Copy, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import QRCode from "react-qr-code"

interface MyTicketsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MyTicketsDialog({ open, onOpenChange }: MyTicketsDialogProps) {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<(Ticket & { event?: Event })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && user) {
      fetchMyTickets()
    }
  }, [open, user])

  const fetchMyTickets = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "tickets"), where("attendeeUid", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const ticketsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[]

      const ticketsWithEvents = await Promise.all(
        ticketsData.map(async (ticket) => {
          try {
            const eventDoc = await getDoc(doc(db, "events", ticket.eventId))
            if (eventDoc.exists()) {
              const eventData = {
                id: eventDoc.id,
                ...eventDoc.data(),
                date: eventDoc.data().date.toDate(),
                createdAt: eventDoc.data().createdAt.toDate(),
              } as Event
              return { ...ticket, event: eventData }
            }
            return ticket
          } catch (error) {
            console.error("Error fetching event for ticket:", error)
            return ticket
          }
        }),
      )

      ticketsWithEvents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setTickets(ticketsWithEvents)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    })
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Tickets</DialogTitle>
            <DialogDescription>Your event tickets and QR codes</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">My Tickets ({tickets.length})</DialogTitle>
          <DialogDescription>Your event tickets and QR codes for check-in</DialogDescription>
        </DialogHeader>

        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-600">Register for events to see your tickets here</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <CardTitle className="text-base sm:text-lg line-clamp-2">
                      {ticket.event?.title || "Event Details Loading..."}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {ticket.checkedIn && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Checked In
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {ticket.event?.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Event Details */}
                    <div className="lg:col-span-2 space-y-4">
                      {ticket.event && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{format(ticket.event.date, "MMM dd, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{ticket.event.time}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="truncate">
                              {ticket.event.isVirtual ? "Virtual Event" : ticket.event.location}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">Price:</span>
                            {ticket.finalPrice === 0 ? (
                              "Free"
                            ) : (
                              <span>
                                ${ticket.finalPrice.toFixed(2)}
                                {ticket.discountAmount && ticket.discountAmount > 0 && (
                                  <span className="text-green-600 ml-1">(${ticket.discountAmount.toFixed(2)} off)</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Ticket ID:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-mono break-all flex-1">
                              {ticket.id}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(ticket.id, "Ticket ID")}
                              className="flex-shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-600">QR Code Data:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-mono break-all flex-1">
                              {ticket.qrCode}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(ticket.qrCode, "QR Code")}
                              className="flex-shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Registered on {format(ticket.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-sm font-medium text-gray-600 text-center">QR Code for Check-in</div>
                      <div className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                        <QRCode
                          value={ticket.qrCode}
                          size={120}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          viewBox={`0 0 256 256`}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center max-w-[150px]">
                        Show this QR code at the event for check-in
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
