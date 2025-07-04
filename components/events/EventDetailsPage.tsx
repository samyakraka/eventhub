"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc as firestoreDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, Ticket, Donation, RaceCategory, TimingResult } from "@/types";
import {
  ArrowLeft,
  Users,
  DollarSign,
  BarChart3,
  QrCode,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { QRScanner } from "../checkin/QRScanner";
import { LiveStreamViewer } from "../virtual/LiveStreamViewer";
import { GalaAdminPanel } from './GalaAdminPanel';
import { toast } from "@/components/ui/use-toast";

interface EventDetailsPageProps {
  eventId: string;
  onBack: () => void;
}

export function EventDetailsPage({ eventId, onBack }: EventDetailsPageProps) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerInfo, setOrganizerInfo] = useState<{
    displayName: string;
    email: string;
    organizationType?: string;
    website?: string;
    industry?: string;
    experience?: string;
    specializations?: string[];
  } | null>(null);

  // Helper: is the current user the organizer?
  const isOrganizer = user && event && user.uid === event.organizerUid;

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      // Fetch event
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        const eventData: Event = {
          id: eventDoc.id,
          title: data.title,
          description: data.description,
          type: data.type,
          location: data.location,
          virtualLink: data.virtualLink,
          virtualType: data.virtualType,
          startDate: data.startDate
            ? data.startDate.toDate()
            : data.date?.toDate() || new Date(),
          endDate: data.endDate
            ? data.endDate.toDate()
            : data.date?.toDate() || new Date(),
          time: data.time,
          endTime: data.endTime,
          themeColor: data.themeColor,
          status: data.status,
          logoBase64: data.logoBase64,
          bannerBase64: data.bannerBase64,
          organizerUid: data.organizerUid,
          maxAttendees: data.maxAttendees,
          ticketPrice: data.ticketPrice,
          isVirtual: data.isVirtual,
          requiresCheckIn: data.requiresCheckIn,
          discountEnabled: data.discountEnabled,
          discountPercentage: data.discountPercentage,
          createdAt: data.createdAt.toDate(),
          raceCategories: data.raceCategories,
          timingResults: data.timingResults,
          routeMapUrl: data.routeMapUrl,
          performerLineup: data.performerLineup,
          concertSchedule: data.concertSchedule,
          ticketTypes: data.ticketTypes,
          liveStreamUrl: data.liveStreamUrl,
        };
        setEvent(eventData);

        // Fetch organizer information with profile data
        if (eventData.organizerUid) {
          const userDoc = await getDoc(
            doc(db, "users", eventData.organizerUid)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const profile = userData.profile || {};
            setOrganizerInfo({
              displayName:
                profile.organizationName ||
                userData.displayName ||
                (userData.firstName && userData.lastName
                  ? `${userData.firstName} ${userData.lastName}`
                  : "Event Organizer"),
              email: userData.email || "",
              organizationType: profile.organizationType || "",
              website: profile.website || "",
              industry: profile.industry || "",
              experience: profile.eventManagementExperience || "",
              specializations: profile.specializations || [],
            });
          }
        }
      }

      // Fetch tickets - simplified query
      const ticketsQuery = query(
        collection(db, "tickets"),
        where("eventId", "==", eventId)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const ticketsData = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[];

      // Sort tickets in memory
      ticketsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTickets(ticketsData);

      // Fetch donations - simplified query
      const donationsQuery = query(
        collection(db, "donations"),
        where("eventId", "==", eventId)
      );
      const donationsSnapshot = await getDocs(donationsQuery);
      const donationsData = donationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Donation[];

      // Sort donations in memory
      donationsData.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      setDonations(donationsData);
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const checkedInCount = tickets.filter((t) => t.checkedIn).length;
  const totalRevenue = tickets.reduce(
    (sum, ticket) => sum + (event.ticketPrice || 0),
    0
  );
  const totalDonations = donations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  const bibToLiveStreamUrl: Record<string, string> = {};
  if (event.timingResults && event.timingResults.length > 0 && tickets) {
    tickets.forEach((t: any) => {
      if (t.registrationData?.bibNumber && t.registrationData?.liveStreamUrl) {
        bibToLiveStreamUrl[t.registrationData.bibNumber] = t.registrationData.liveStreamUrl;
      }
    });
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
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {event.title}
                </h1>
                <p className="text-gray-600">
                  {format(event.startDate, "MMM dd, yyyy")} at {event.time}
                  {organizerInfo && (
                    <span className="ml-2 text-sm">
                      • Organized by {organizerInfo.displayName}
                    </span>
                  )}
                </p>
              </div>
              {/* Social Sharing Buttons */}
              {event.type === 'concert' && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy Link</Button>
                  <Button variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`,'_blank')}>Share WhatsApp</Button>
                  <Button variant="outline" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`,'_blank')}>Share Twitter</Button>
                </div>
              )}
            </div>
            <Badge
              className={
                event.status === "live"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }
            >
              {event.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Live Stream for Concerts */}
      {event.type === 'concert' && event.liveStreamUrl && (
        <div className="max-w-4xl mx-auto mt-6">
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
            <iframe
              src={event.liveStreamUrl}
              title="Live Stream"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Registered
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <QrCode className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Checked In
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {checkedInCount}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalRevenue}
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
                  <p className="text-sm font-medium text-gray-600">Donations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalDonations}
                  </p>
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
            <TabsTrigger value="organizer">Organizer Info</TabsTrigger>
            {event.isVirtual && (
              <TabsTrigger value="stream">Live Stream</TabsTrigger>
            )}
            {/* Gala Management Tab: Only for gala events and organizers */}
            {event.type === 'gala' && isOrganizer && (
              <TabsTrigger value="gala-admin">Gala Management</TabsTrigger>
            )}
            {event.type === 'marathon' && <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Description
                    </label>
                    <p className="text-gray-900">{event.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Type
                    </label>
                    <p className="text-gray-900 capitalize">{event.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Location
                    </label>
                    <p className="text-gray-900">
                      {event.isVirtual ? "Virtual Event" : event.location}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Ticket Price
                    </label>
                    <p className="text-gray-900">
                      {event.ticketPrice === 0
                        ? "Free"
                        : `$${event.ticketPrice}`}
                    </p>
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
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {ticket.registrationData?.firstName}{" "}
                              {ticket.registrationData?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Registered{" "}
                              {format(ticket.createdAt, "MMM dd, HH:mm")}
                            </p>
                          </div>
                          <Badge
                            variant={ticket.checkedIn ? "default" : "secondary"}
                          >
                            {ticket.checkedIn ? "Checked In" : "Registered"}
                          </Badge>
                        </div>
                      ))}
                    {tickets.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No registrations yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {event.type === 'marathon' && event.routeMapUrl && (
                <div className="my-6">
                  <h4 className="text-lg font-semibold mb-2">Route Map</h4>
                  {event.routeMapUrl.match(/^https?:\/\//) && event.routeMapUrl.includes('google.com/maps') ? (
                    <iframe
                      src={event.routeMapUrl}
                      title="Route Map"
                      className="w-full h-96 rounded border"
                      allowFullScreen
                    />
                  ) : (
                    <img src={event.routeMapUrl} alt="Route Map" className="max-w-full rounded border" />
                  )}
                </div>
              )}

              {/* Concert-specific fields */}
              {event.type === 'concert' && (
                <>
                  {/* Performer Lineup */}
                  {event.performerLineup && event.performerLineup.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Performer Lineup</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {event.performerLineup.map((p) => (
                            <li key={p.id} className="flex flex-col md:flex-row md:items-center md:space-x-4">
                              {p.photoUrl && <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover border mb-2 md:mb-0" />}
                              <div>
                                <div className="font-semibold text-lg">{p.name} {p.setTime && <span className="text-xs text-gray-500">({p.setTime})</span>}</div>
                                {p.bio && <div className="text-sm text-gray-600 mb-1">{p.bio}</div>}
                                {p.socialLinks && p.socialLinks.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {p.socialLinks.map((link, idx) => (
                                      link.url ? <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">{link.platform || 'Link'}</a> : null
                                    ))}
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {/* Concert Schedule */}
                  {event.concertSchedule && event.concertSchedule.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Concert Schedule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {event.concertSchedule.map((item, idx) => (
                            <li key={idx} className="flex flex-col md:flex-row md:items-center md:space-x-4">
                              <span className="font-semibold w-20">{item.time}</span>
                              <span className="font-medium">{item.title}</span>
                              {item.description && <span className="text-sm text-gray-600">{item.description}</span>}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {/* Ticket Types */}
                  {event.ticketTypes && event.ticketTypes.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Ticket Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {event.ticketTypes.map((t) => (
                            <li key={t.id} className="flex flex-col md:flex-row md:items-center md:space-x-4">
                              <span className="font-semibold">{t.name}</span>
                              <span className="text-blue-700">${t.price}</span>
                              {t.description && <span className="text-sm text-gray-600">{t.description}</span>}
                              {t.quantity && <span className="text-xs text-gray-500">({t.quantity} available)</span>}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
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
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">
                              {ticket.registrationData?.firstName}{" "}
                              {ticket.registrationData?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ticket.registrationData?.email}
                            </p>
                          </div>
                          {ticket.registrationData?.liveStreamUrl && (
                            <a href={ticket.registrationData.liveStreamUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Watch Live</a>
                          )}
                        </div>
                        {event.type === 'marathon' && (
                          <div className="flex flex-col text-xs text-blue-800 mt-1">
                            <span>Bib: {ticket.registrationData?.bibNumber || 'N/A'}</span>
                            <span>Category: {event.raceCategories?.find((c: RaceCategory) => c.id === ticket.registrationData?.selectedCategoryId)?.name || 'N/A'}</span>
                            <span>T-Shirt: {ticket.registrationData?.tShirtSize || 'N/A'}</span>
                          </div>
                        )}
                        {event.type === 'marathon' && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-semibold text-blue-900">Kit Pickup:</span>
                            {ticket.registrationData?.kitPickedUp ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Kit Picked Up</span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Kit Not Picked Up</span>
                            )}
                            <Button
                              size="sm"
                              variant={ticket.registrationData?.kitPickedUp ? 'outline' : 'default'}
                              onClick={async () => {
                                const ticketRef = firestoreDoc(db, 'tickets', ticket.id);
                                await updateDoc(ticketRef, {
                                  'registrationData.kitPickedUp': !ticket.registrationData?.kitPickedUp,
                                });
                                toast({
                                  title: 'Kit Pickup Updated',
                                  description: `Kit marked as ${!ticket.registrationData?.kitPickedUp ? 'picked up' : 'not picked up'}.`,
                                });
                              }}
                              className="ml-2"
                            >
                              {ticket.registrationData?.kitPickedUp ? 'Undo' : 'Mark as Picked Up'}
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={ticket.checkedIn ? "default" : "secondary"}
                        >
                          {ticket.checkedIn ? "Checked In" : "Registered"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(ticket.createdAt, "MMM dd")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No attendees registered yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin">
            <QRScanner eventId={eventId} />
          </TabsContent>

          <TabsContent value="organizer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Organizer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organizerInfo ? (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {organizerInfo.displayName}
                        </h3>
                        {organizerInfo.organizationType && (
                          <p className="text-gray-600 capitalize">
                            {organizerInfo.organizationType} Organization
                          </p>
                        )}
                        {organizerInfo.industry && (
                          <p className="text-gray-500">
                            Industry: {organizerInfo.industry}
                          </p>
                        )}
                        {organizerInfo.website && (
                          <a
                            href={organizerInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {organizerInfo.website}
                          </a>
                        )}
                      </div>
                    </div>

                    {organizerInfo.experience && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Event Management Experience
                        </h4>
                        <p className="text-gray-700">
                          {organizerInfo.experience}
                        </p>
                      </div>
                    )}

                    {organizerInfo.specializations &&
                      organizerInfo.specializations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Specializations
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {organizerInfo.specializations.map(
                              (spec, index) => (
                                <Badge key={index} variant="outline">
                                  {spec}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Organizer information not available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {event.isVirtual && (
            <TabsContent value="stream">
              <LiveStreamViewer event={event} hasAccess={true} />
            </TabsContent>
          )}

          {/* Gala Management Tab Content */}
          {event.type === 'gala' && isOrganizer && (
            <TabsContent value="gala-admin">
              <GalaAdminPanel event={event} isOrganizer={isOrganizer} onEventUpdate={setEvent} />
            </TabsContent>
          )}

          {event.type === 'marathon' && (
            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  {event.timingResults && event.timingResults.length > 0 ? (
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-left">Pos</th>
                          <th className="px-2 py-1 text-left">Bib</th>
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-left">Category</th>
                          <th className="px-2 py-1 text-left">Finish Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {event.timingResults
                          .sort((a, b) => a.finishTime.localeCompare(b.finishTime))
                          .map((result, idx) => (
                            <tr key={result.bibNumber} className="border-b">
                              <td className="px-2 py-1">{idx + 1}</td>
                              <td className="px-2 py-1">{result.bibNumber}</td>
                              <td className="px-2 py-1">
                                {/* Find runner name from tickets or registrationData if available */}N/A
                                {bibToLiveStreamUrl[result.bibNumber] && (
                                  <a href={bibToLiveStreamUrl[result.bibNumber]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Watch Live</a>
                                )}
                              </td>
                              <td className="px-2 py-1">{event.raceCategories?.find((c: RaceCategory) => c.id === result.categoryId)?.name || 'N/A'}</td>
                              <td className="px-2 py-1">{result.finishTime}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-gray-500">No results yet.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
