"use client";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, Ticket } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Share2,
  Heart,
  Star,
  CheckCircle,
  Globe,
  Video,
  TicketIcon,
  BarChart3,
  Check,
  X,
  Shield,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { EventRegistrationDialog } from "@/components/dashboard/EventRegistrationDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthPage } from "@/components/auth/AuthPage";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTicket, setUserTicket] = useState<Ticket | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState<"login" | "signup">(
    "login"
  );
  const [organizerInfo, setOrganizerInfo] = useState<{
    displayName: string;
    email: string;
    role: string;
  } | null>(null);

  const eventId = params.eventId as string;

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchUserTicket();
      fetchAttendeeCount();
    }
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        const eventData = {
          id: eventDoc.id,
          ...data,
          startDate: data.startDate
            ? data.startDate.toDate()
            : data.date?.toDate() || new Date(),
          endDate: data.endDate
            ? data.endDate.toDate()
            : data.date?.toDate() || new Date(),
          createdAt: data.createdAt.toDate(),
          registrationCount: 0, // Default value for consistency
          // Ensure all required Event properties have defaults
          title: data.title || "",
          description: data.description || "",
          type: data.type || "",
          time: data.time || "",
          location: data.location || "",
          status: data.status || "upcoming",
        } as unknown as Event;
        setEvent(eventData);

        // Fetch organizer information
        if (eventData.organizerUid) {
          await fetchOrganizerInfo(eventData.organizerUid);
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerInfo = async (organizerUid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", organizerUid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setOrganizerInfo({
          displayName:
            userData.displayName ||
            userData.firstName + " " + userData.lastName ||
            "Event Organizer",
          email: userData.email || "",
          role: userData.role || "organizer",
        });
      }
    } catch (error) {
      console.error("Error fetching organizer info:", error);
      setOrganizerInfo({
        displayName: "Event Organizer",
        email: "",
        role: "organizer",
      });
    }
  };

  const fetchUserTicket = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "tickets"),
        where("eventId", "==", eventId),
        where("attendeeUid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const ticketData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
          createdAt: querySnapshot.docs[0].data().createdAt.toDate(),
        } as Ticket;
        setUserTicket(ticketData);
      }
    } catch (error) {
      console.error("Error fetching user ticket:", error);
    }
  };

  const fetchAttendeeCount = async () => {
    try {
      const q = query(
        collection(db, "tickets"),
        where("eventId", "==", eventId)
      );
      const querySnapshot = await getDocs(q);
      setTotalAttendees(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching attendee count:", error);
    }
  };

  const shareEvent = async () => {
    if (!event) return;

    const shareData = {
      title: event.title,
      text: `Check out this amazing event: ${event.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyEventLink();
      }
    } else {
      copyEventLink();
    }
  };

  const copyEventLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link Copied!",
        description: "Event link copied to clipboard",
      });
    });
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    // Show registration dialog once user is authenticated
    if (user) {
      setShowRegistration(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event not found
          </h2>
          <p className="text-gray-600 mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </Button>
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                EventHub
              </span>
            </div>
            <Button
              variant="outline"
              onClick={shareEvent}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Event</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-8">
          {event.bannerBase64 ? (
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden">
              <img
                src={event.bannerBase64 || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge
                    className={`${
                      event.status === "live"
                        ? "bg-red-500"
                        : event.status === "upcoming"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    } text-white`}
                  >
                    {event.status === "live" && (
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    )}
                    {event.status.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white/90 text-gray-900"
                  >
                    {event.type}
                  </Badge>
                  {event.isVirtual && (
                    <Badge
                      variant="outline"
                      className="bg-white/90 text-purple-700"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Virtual
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                  {event.title}
                </h1>
              </div>
            </div>
          ) : (
            <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500 mx-auto mb-4" />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge
                    className={`${
                      event.status === "live"
                        ? "bg-red-500"
                        : event.status === "upcoming"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    } text-white`}
                  >
                    {event.status === "live" && (
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    )}
                    {event.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{event.type}</Badge>
                  {event.isVirtual && (
                    <Badge variant="outline" className="text-purple-700">
                      <Globe className="w-3 h-3 mr-1" />
                      Virtual
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">
                        {format(event.startDate, "EEEE, MMMM dd, yyyy")} -{" "}
                        {format(event.endDate, "EEEE, MMMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold">
                        {event.time} - {event.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      {event.isVirtual ? (
                        <Globe className="w-5 h-5 text-pink-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-pink-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">
                        {event.isVirtual ? "Virtual Event" : event.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-semibold">
                        {event.ticketPrice === 0
                          ? "Free"
                          : `$${event.ticketPrice}`}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold mb-3">About this event</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-3">Event Details</h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        <span>
                          Date: {format(event.startDate, "PPPP")} -{" "}
                          {format(event.endDate, "PPPP")}, {event.time} -{" "}
                          {event.endTime}
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        {event.isVirtual ? (
                          <Globe className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        ) : (
                          <MapPin className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        )}
                        <span>
                          Location:{" "}
                          {event.isVirtual ? "Virtual Event" : event.location}
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        <span>
                          Attendees:{" "}
                          {event.maxAttendees
                            ? `${totalAttendees}/${event.maxAttendees}`
                            : "Unlimited"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        <span>
                          Price:{" "}
                          {event.ticketPrice === 0
                            ? "Free"
                            : `$${event.ticketPrice}`}
                        </span>
                      </li>
                      {event.requiresCheckIn && (
                        <li className="flex items-center gap-3 text-orange-700 font-medium">
                          <Shield className="w-5 h-5 flex-shrink-0" />
                          <span>Check-in Required</span>
                        </li>
                      )}
                      {event.discountEnabled && (
                        <li className="flex items-center gap-3 text-purple-700 font-medium">
                          <Tag className="w-5 h-5 flex-shrink-0" />
                          <span>Discounts Enabled</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {user && user.uid === event.organizerUid && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold mb-3">
                      Organizer Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <Users className="w-8 h-8 text-blue-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">
                                Attendees
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {totalAttendees} / {event.maxAttendees || "∞"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">
                                Checked In
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {userTicket && userTicket.checkedIn
                                  ? "Yes"
                                  : "No"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <DollarSign className="w-8 h-8 text-purple-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">
                                Total Revenue
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                ${event.ticketPrice * totalAttendees}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <BarChart3 className="w-8 h-8 text-purple-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">
                                Donations
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                ${0}
                              </p>{" "}
                              {/* Placeholder for donations */}
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
                        {event.isVirtual && (
                          <TabsTrigger value="stream">Live Stream</TabsTrigger>
                        )}
                      </TabsList>
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Event Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-gray-700">
                              <p>
                                <strong>Type:</strong> {event.type}
                              </p>
                              <p>
                                <strong>Status:</strong> {event.status}
                              </p>
                              <p>
                                <strong>Organizer:</strong>{" "}
                                {event.organizerUid || "N/A"}
                              </p>
                              {event.virtualLink && (
                                <p>
                                  <strong>Virtual Link:</strong>{" "}
                                  <a
                                    href={event.virtualLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {event.virtualLink}
                                  </a>
                                </p>
                              )}
                              {event.virtualType && (
                                <p>
                                  <strong>Virtual Type:</strong>{" "}
                                  {event.virtualType}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle>Financial Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-gray-700">
                              <p>
                                <strong>Ticket Price:</strong>{" "}
                                {event.ticketPrice === 0
                                  ? "Free"
                                  : `$${event.ticketPrice}`}
                              </p>
                              <p>
                                <strong>Total Revenue:</strong> $
                                {event.ticketPrice * totalAttendees}
                              </p>
                              <p>
                                <strong>Total Donations:</strong> ${0}
                              </p>{" "}
                              {/* Placeholder for donations */}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      <TabsContent value="attendees" className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-bold">
                            Attendees ({totalAttendees})
                          </h4>
                          <Input
                            placeholder="Search attendees..."
                            className="max-w-xs"
                            value={""} // Placeholder for attendee search
                            onChange={() => {}} // Placeholder for attendee search
                          />
                        </div>
                        {true ? ( // Placeholder for attendees list
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Registered On</TableHead>
                                <TableHead>Checked In</TableHead>
                                <TableHead className="text-right">
                                  Price Paid
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>John Doe</TableCell>
                                <TableCell>john.doe@example.com</TableCell>
                                <TableCell>
                                  {format(new Date(), "MMM dd, yyyy p")}
                                </TableCell>
                                <TableCell>
                                  <Check className="w-4 h-4 text-green-500" />
                                </TableCell>
                                <TableCell className="text-right">
                                  ${event.ticketPrice.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-gray-600">No attendees found.</p>
                        )}
                      </TabsContent>
                      <TabsContent value="checkin" className="space-y-4">
                        <h4 className="text-lg font-bold mb-4">
                          Check-in Attendees
                        </h4>
                        <p className="text-gray-600 mb-4">
                          Use the QR code scanner to check in attendees.
                        </p>
                        {/* <QRCodeReader onScan={handleScanQRCode} /> */}
                        {/* {scanResult && (
                          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <p className="font-semibold">Scan Result:</p>
                            <p>{scanResult}</p>
                            {checkInMessage && (
                              <p className={checkInMessage.includes("successfully") ? "text-green-600" : "text-red-600"}>
                                {checkInMessage}
                              </p>
                            )}
                          </div>
                        )} */}
                      </TabsContent>
                      {event.isVirtual && (
                        <TabsContent value="stream" className="space-y-4">
                          <h4 className="text-lg font-bold mb-4">
                            Live Stream
                          </h4>
                          {event.virtualLink ? (
                            <div className="aspect-video w-full rounded-lg overflow-hidden border">
                              {event.virtualType === "meeting" ? (
                                <iframe
                                  src={event.virtualLink}
                                  title="Virtual Meeting"
                                  allow="camera; microphone; fullscreen; display-capture"
                                  className="w-full h-full"
                                ></iframe>
                              ) : (
                                <iframe
                                  src={event.virtualLink}
                                  title="Virtual Broadcast"
                                  allow="fullscreen"
                                  className="w-full h-full"
                                ></iframe>
                              )}
                            </div>
                          ) : (
                            <div className="p-6 bg-gray-100 rounded-lg text-gray-600 text-center">
                              <p>
                                No virtual stream link provided for this event.
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info */}
            <Card>
              <CardHeader>
                <CardTitle>About the Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {organizerInfo?.displayName || "Event Organizer"}
                    </p>
                    <p className="text-gray-600">
                      {organizerInfo?.role === "organizer"
                        ? "Professional event management"
                        : "Event Creator"}
                    </p>
                    {organizerInfo?.email && (
                      <p className="text-sm text-gray-500">
                        {organizerInfo.email}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                  </div>
                  {event.ticketPrice > 0 && (
                    <p className="text-gray-600">per ticket</p>
                  )}
                </div>

                {userTicket ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-green-900">
                        You're registered!
                      </p>
                      <p className="text-green-700 text-sm">
                        Ticket ID: {userTicket.id.slice(0, 8)}...
                      </p>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => router.push("/")}
                    >
                      <TicketIcon className="w-4 h-4 mr-2" />
                      View My Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => {
                        if (user) {
                          setShowRegistration(true);
                        } else {
                          setActiveAuthTab("login");
                          setShowAuthDialog(true);
                        }
                      }}
                      disabled={event.status === "completed"}
                    >
                      {event.status === "completed"
                        ? "Event Ended"
                        : "Register Now"}
                    </Button>
                    {!user && (
                      <p className="text-xs text-gray-500 text-center">
                        Sign in required to register
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Attendees</span>
                    <span className="font-semibold">{totalAttendees}</span>
                  </div>
                  {event.maxAttendees && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Capacity</span>
                      <span className="font-semibold">
                        {event.maxAttendees}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={shareEvent}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Registered</span>
                  </div>
                  <span className="font-semibold">{totalAttendees}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Event Type</span>
                  </div>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Status</span>
                  </div>
                  <Badge
                    className={`${
                      event.status === "live"
                        ? "bg-red-100 text-red-800"
                        : event.status === "upcoming"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {event.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {event && (
        <EventRegistrationDialog
          event={event}
          open={showRegistration}
          onOpenChange={setShowRegistration}
          onRegistrationComplete={fetchUserTicket}
        />
      )}

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md max-h-[90vh] p-0 flex flex-col backdrop-blur-xl bg-gray-900/80 rounded-xl shadow-2xl border border-white/10 overflow-y-auto">
          <AuthPage onSuccess={handleAuthSuccess} defaultTab={activeAuthTab} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
