"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { doc, updateDoc, query, collection, where, getDocs, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Ticket, Event } from "@/types"
import { QrCode, Camera, CheckCircle, User, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Html5Qrcode } from "html5-qrcode"

interface QRScannerProps {
  eventId: string
}

export function QRScanner({ eventId }: QRScannerProps) {
  const [manualCode, setManualCode] = useState("")
  const [scannedTickets, setScannedTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [totalRegistered, setTotalRegistered] = useState(0)
  const [event, setEvent] = useState<Event | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "qr-reader"

  useEffect(() => {
    fetchEventDetails()
    fetchScannedTickets()
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [eventId])

  const fetchEventDetails = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching event details:", error)
    }
  }

  const fetchScannedTickets = async () => {
    try {
      // Get checked in tickets
      const checkedInQuery = query(
        collection(db, "tickets"),
        where("eventId", "==", eventId),
        where("checkedIn", "==", true),
      )
      const checkedInSnapshot = await getDocs(checkedInQuery)
      const tickets = checkedInSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[]

      // Get total registered tickets
      const totalQuery = query(collection(db, "tickets"), where("eventId", "==", eventId))
      const totalSnapshot = await getDocs(totalQuery)
      setTotalRegistered(totalSnapshot.size)

      // Sort in memory by check-in time (if available) or creation date
      tickets.sort((a, b) => {
        if (a.checkInTime && b.checkInTime) {
          return b.checkInTime.toDate().getTime() - a.checkInTime.toDate().getTime()
        }
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      setScannedTickets(tickets)
    } catch (error) {
      console.error("Error fetching scanned tickets:", error)
    }
  }

  const startCamera = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId)
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // On successful scan
          checkInTicket(decodedText)
          // Don't stop scanner to allow multiple check-ins
        },
        (errorMessage) => {
          // Ignore errors during scanning
          console.log(errorMessage)
        },
      )

      setScannerActive(true)
    } catch (error) {
      console.error("Error starting camera:", error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use manual entry.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
        setScannerActive(false)
      } catch (error) {
        console.error("Error stopping camera:", error)
      }
    }
  }

  const checkInTicket = async (qrCode: string) => {
    setLoading(true)
    try {
      // Simplified query to find ticket by QR code
      const q = query(collection(db, "tickets"), where("eventId", "==", eventId), where("qrCode", "==", qrCode))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        toast({
          title: "Invalid Ticket",
          description: "No ticket found with this QR code.",
          variant: "destructive",
        })
        return
      }

      const ticketDoc = querySnapshot.docs[0]
      const ticketData = ticketDoc.data() as Ticket

      if (ticketData.checkedIn) {
        toast({
          title: "Already Checked In",
          description: "This ticket has already been used for check-in.",
          variant: "destructive",
        })
        return
      }

      // Update ticket to checked in
      await updateDoc(doc(db, "tickets", ticketDoc.id), {
        checkedIn: true,
        checkInTime: new Date(),
      })

      toast({
        title: "Check-in Successful!",
        description: `${ticketData.registrationData?.firstName} ${ticketData.registrationData?.lastName} checked in successfully.`,
      })

      fetchScannedTickets()
      setManualCode("")
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      checkInTicket(manualCode.trim())
    }
  }

  return (
    <div className="space-y-6">
      {/* Event Info */}
      {event && (
        <Card>
          <CardHeader>
            <CardTitle>{event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {event.date.toLocaleDateString()} at {event.time} • {event.location || "Virtual Event"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button onClick={scannerActive ? stopCamera : startCamera} variant="outline">
                {scannerActive ? <X className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                {scannerActive ? "Stop Camera" : "Start Camera"}
              </Button>
            </div>

            {/* Scanner Container */}
            <div id={scannerContainerId} className={`${scannerActive ? "block" : "hidden"} w-full max-w-md mx-auto`}>
              {/* Html5QrCode will insert elements here */}
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Manual QR Code or Ticket ID Entry</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter QR code or ticket ID..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualEntry()}
                />
                <Button onClick={handleManualEntry} disabled={loading || !manualCode.trim()}>
                  {loading ? "Checking..." : "Check In"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Check-in Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{scannedTickets.length}</div>
              <div className="text-sm text-green-700">Checked In</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalRegistered}</div>
              <div className="text-sm text-blue-700">Total Registered</div>
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="space-y-2">
            <h4 className="font-medium">Recent Check-ins</h4>
            {scannedTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {ticket.registrationData?.firstName} {ticket.registrationData?.lastName}
                  </span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Checked In
                </Badge>
              </div>
            ))}
            {scannedTickets.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No check-ins yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
