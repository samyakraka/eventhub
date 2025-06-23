"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, Ticket } from "@/types";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  TicketIcon,
  Menu,
  X,
  Filter,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { EventRegistrationDialog } from "./EventRegistrationDialog";
import { VirtualEventPage } from "../events/VirtualEventPage";
import { MyTicketsDialog } from "./MyTicketsDialog";
import { UserProfileDialog } from "./UserProfileDialog";

export function AttendeeDashboard() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedVirtualEventId, setSelectedVirtualEventId] = useState<
    string | null
  >(null);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchMyTickets();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "upcoming"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Event[];

      eventsData.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "tickets"),
        where("attendeeUid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const ticketsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[];

      ticketsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setMyTickets(ticketsData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || event.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (selectedVirtualEventId) {
    return (
      <VirtualEventPage
        eventId={selectedVirtualEventId}
        onBack={() => setSelectedVirtualEventId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  EventHub
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Welcome back, {user?.displayName}
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowMyTickets(true)}
                className="flex items-center space-x-2"
              >
                <TicketIcon className="w-4 h-4" />
                <span>My Tickets</span>
                <Badge variant="secondary" className="ml-1">
                  {myTickets.length}
                </Badge>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUserProfile(true)}
                className="flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowMyTickets(true);
                  setShowMobileMenu(false);
                }}
                className="w-full justify-between"
              >
                <div className="flex items-center space-x-2">
                  <TicketIcon className="w-4 h-4" />
                  <span>My Tickets</span>
                </div>
                <Badge variant="secondary">{myTickets.length}</Badge>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUserProfile(true);
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Live Events Section */}
        {events.filter((e) => e.status === "live" && e.isVirtual).length >
          0 && (
          <Card className="mb-6 sm:mb-8 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-red-800 text-lg sm:text-xl">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                Live Events Now
              </CardTitle>
              <CardDescription className="text-red-700">
                Join these events happening right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                  .filter((e) => e.status === "live" && e.isVirtual)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 bg-white shadow-sm"
                    >
                      <h4 className="font-semibold text-red-800 mb-2 line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {event.description.slice(0, 100)}...
                      </p>
                      <Button
                        onClick={() => setSelectedVirtualEventId(event.id)}
                        className="w-full bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                          Join Now
                        </div>
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Tickets Section */}
        {myTickets.length > 0 && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <TicketIcon className="w-5 h-5 mr-2" />
                My Tickets
                <Badge variant="secondary" className="ml-2">
                  {myTickets.length}
                </Badge>
              </CardTitle>
              <CardDescription>Your registered events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTickets.slice(0, 6).map((ticket) => {
                  const ticketEvent = events.find(
                    (e) => e.id === ticket.eventId
                  );

                  return (
                    <div
                      key={ticket.id}
                      className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          Registered
                        </Badge>
                        {ticket.checkedIn && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Checked In
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm mb-1">
                        Ticket ID: {ticket.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        QR: {ticket.qrCode.slice(0, 12)}...
                      </p>

                      {ticketEvent && ticketEvent.isVirtual && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            setSelectedVirtualEventId(ticket.eventId)
                          }
                          variant={
                            ticketEvent.status === "live"
                              ? "default"
                              : "outline"
                          }
                        >
                          {ticketEvent.status === "live" ? (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                              Join Live
                            </div>
                          ) : (
                            "Access Event"
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              {myTickets.length > 6 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowMyTickets(true)}
                  >
                    View All Tickets
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <h3 className="font-semibold text-gray-900">Find Events</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>

            <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4">
              {/* Search - Always Visible */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-12"
                />
              </div>

              {/* Filters */}
              <div
                className={`${
                  showFilters || window.innerWidth >= 640 ? "block" : "hidden"
                } sm:block`}
              >
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48 h-10 sm:h-12">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="gala">Gala</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="marathon">Marathon</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              <CardContent className="p-0">
                {event.bannerBase64 && (
                  <img
                    src={event.bannerBase64 || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                )}
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        event.ticketPrice === 0
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {event.ticketPrice === 0
                        ? "Free"
                        : `$${event.ticketPrice}`}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {format(event.date, "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{event.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {event.isVirtual ? "Virtual Event" : event.location}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      const userTicket = myTickets.find(
                        (ticket) => ticket.eventId === event.id
                      );

                      if (event.isVirtual && userTicket) {
                        setSelectedVirtualEventId(event.id);
                      } else {
                        setSelectedEvent(event);
                      }
                    }}
                    variant={
                      event.status === "live" && event.isVirtual
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                  >
                    {event.isVirtual &&
                    myTickets.find((ticket) => ticket.eventId === event.id) ? (
                      event.status === "live" ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                          Join Live Event
                        </div>
                      ) : (
                        "Join Virtual Event"
                      )
                    ) : (
                      "Register Now"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventRegistrationDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={() => setSelectedEvent(null)}
          onRegistrationComplete={fetchMyTickets}
        />
      )}

      <MyTicketsDialog open={showMyTickets} onOpenChange={setShowMyTickets} />
      <UserProfileDialog
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
      />
    </div>
  );
}
