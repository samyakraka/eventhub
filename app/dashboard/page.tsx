"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CalendarDays,
  MapPin,
  Loader2,
  Download,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initFirebase } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const mockTickets = [
  {
    id: "tkt-001",
    eventId: "evt-1",
    eventName: "Tech Conference 2025",
    eventDate: "2025-06-15T09:00:00",
    ticketType: "VIP",
    purchaseDate: "2025-03-10T14:30:00",
    price: 599,
    status: "active",
    qrCode: "qr-code-data-1",
  },
  {
    id: "tkt-002",
    eventId: "evt-2",
    eventName: "Music Festival",
    eventDate: "2025-07-22T16:00:00",
    ticketType: "Standard",
    purchaseDate: "2025-05-01T10:15:00",
    price: 199,
    status: "active",
    qrCode: "qr-code-data-2",
  },
  {
    id: "tkt-003",
    eventId: "evt-3",
    eventName: "Business Summit",
    eventDate: "2025-04-10T08:30:00",
    ticketType: "VIP",
    purchaseDate: "2025-02-15T09:45:00",
    price: 899,
    status: "used",
    qrCode: "qr-code-data-3",
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const app = initFirebase();
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate upcoming and past tickets
  const upcomingTickets = mockTickets.filter(
    (ticket) =>
      ticket.status === "active" && new Date(ticket.eventDate) > new Date()
  );

  const pastTickets = mockTickets.filter(
    (ticket) =>
      ticket.status === "used" || new Date(ticket.eventDate) < new Date()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2">Loading your tickets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
        <p className="text-muted-foreground">
          Manage your event tickets.
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Tickets</h2>
        {upcomingTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingTickets.map((ticket) => (
              <Card key={ticket.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{ticket.eventName}</CardTitle>
                      <CardDescription>
                        {format(new Date(ticket.eventDate), "PPP 'at' p")}
                      </CardDescription>
                    </div>
                    <Badge>{ticket.ticketType}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{format(new Date(ticket.eventDate), "p")}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {format(new Date(ticket.eventDate), "PP")}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>San Francisco Convention Center</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm">
                    <QrCode className="h-4 w-4 mr-1" />
                    View QR Code
                  </Button>
                </CardFooter>
                <div className="absolute top-0 right-0 h-full w-1 bg-primary/20"></div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Upcoming Tickets</CardTitle>
              <CardDescription>
                You don't have any upcoming tickets. Browse events to purchase tickets.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/events")}>
                Browse Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        <h2 className="text-xl font-semibold mt-8">Past Tickets</h2>
        {pastTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastTickets.map((ticket) => (
              <Card key={ticket.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{ticket.eventName}</CardTitle>
                      <CardDescription>
                        {format(new Date(ticket.eventDate), "PPP 'at' p")}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{ticket.ticketType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">Past Event</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Past Tickets</CardTitle>
              <CardDescription>
                You don't have any past tickets.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
