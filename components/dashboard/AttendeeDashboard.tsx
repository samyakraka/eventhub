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
  Copy,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { EventRegistrationDialog } from "./EventRegistrationDialog";
import { VirtualEventPage } from "../events/VirtualEventPage";
import { MyTicketsDialog } from "./MyTicketsDialog";
import { UserProfileDialog } from "./UserProfileDialog";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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

  const today = startOfDay(new Date());

  useEffect(() => {
    fetchEvents();
    fetchMyTickets();
    // Listen for custom event to open My Tickets modal
    const handler = () => setShowMyTickets(true);
    window.addEventListener("openMyTickets", handler);
    return () => window.removeEventListener("openMyTickets", handler);
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

  const upcomingEvents = filteredEvents.filter(event => !isBefore(event.date, today));
  const pastEvents = filteredEvents.filter(event => isBefore(event.date, today));

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
    <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#181F36] to-[#181F36] pb-12">
      {/* Enhanced Header */}
      <header className="bg-[#181F36] shadow-sm border-b border-[#232A45] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">EventHub</h1>
                <p className="text-sm text-gray-400 hidden sm:block">
                  Welcome back, {user?.displayName}
                </p>
              </div>
            </div>
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowMyTickets(true)}
                className="flex items-center space-x-2 bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white"
              >
                <TicketIcon className="w-4 h-4" />
                <span>My Tickets</span>
                <Badge variant="secondary" className="ml-1 bg-blue-700 text-white">
                  {myTickets.length}
                </Badge>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUserProfile(true)}
                className="flex items-center space-x-2 bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center space-x-2 bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white"
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
                className="p-2 text-white"
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
            <div className="md:hidden border-t border-[#232A45] py-4 space-y-3 bg-[#181F36]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowMyTickets(true);
                  setShowMobileMenu(false);
                }}
                className="w-full justify-between text-white"
              >
                <div className="flex items-center space-x-2">
                  <TicketIcon className="w-4 h-4" />
                  <span>My Tickets</span>
                </div>
                <Badge variant="secondary" className="bg-blue-700 text-white">{myTickets.length}</Badge>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUserProfile(true);
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start text-white"
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
                className="w-full justify-start text-white"
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
          <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl text-white">
                <TicketIcon className="w-5 h-5 mr-2 text-blue-400" />
                My Tickets
                <Badge variant="secondary" className="ml-2 bg-blue-700 text-white">
                  {myTickets.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">Your registered events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTickets.slice(0, 6).map((ticket) => {
                  const ticketEvent = events.find(
                    (e) => e.id === ticket.eventId
                  );

                  // Copy to clipboard handler
                  const copyToClipboard = (text: string, label: string) => {
                    navigator.clipboard.writeText(text).then(() => {
                      toast({
                        title: "Copied!",
                        description: `${label} copied to clipboard`,
                      });
                    });
                  };

                  return (
                    <div
                      key={ticket.id}
                      className="border-none rounded-xl p-4 bg-[#22305A]/80 hover:bg-gradient-to-br hover:from-blue-900 hover:to-purple-900 transition-colors shadow-md text-white"
                    >
                      {/* Event Name Heading */}
                      {ticketEvent && (
                        <h3 className="font-semibold text-base text-blue-300 mb-1 line-clamp-1">
                          {ticketEvent.title}
                        </h3>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs bg-green-700/80 text-white">
                          Registered
                        </Badge>
                        {ticket.checkedIn && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Checked In
                          </Badge>
                        )}
                      </div>
                      {/* Ticket ID with copy and tooltip */}
                      <div className="flex items-center mb-1 gap-2">
                        <span className="text-xs font-medium text-blue-200 min-w-[70px]">Ticket ID:</span>
                        <span className="text-xs font-mono text-blue-100 break-all">{ticket.id.slice(0, 12)}...</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="ml-1 text-blue-200 hover:text-white"
                                onClick={() => copyToClipboard(ticket.id, 'Ticket ID')}
                                tabIndex={0}
                                aria-label="Copy Ticket ID"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-[#232A45] text-white rounded-md px-3 py-2 text-xs shadow-lg">
                              Click to copy Ticket ID
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {/* QR Code with copy and tooltip */}
                      <div className="flex items-center mb-3 gap-2">
                        <span className="text-xs font-medium text-blue-200 min-w-[70px]">QR:</span>
                        <span className="text-xs font-mono text-blue-100 break-all">{ticket.qrCode.slice(0, 12)}...</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="ml-1 text-blue-200 hover:text-white"
                                onClick={() => copyToClipboard(ticket.qrCode, 'QR Code')}
                                tabIndex={0}
                                aria-label="Copy QR Code"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-[#232A45] text-white rounded-md px-3 py-2 text-xs shadow-lg">
                              Click to copy QR
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {ticketEvent && ticketEvent.isVirtual && (
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-700 to-purple-700 text-white font-bold mt-2 hover:from-blue-800 hover:to-purple-800"
                          onClick={() => setSelectedVirtualEventId(ticket.eventId)}
                          variant={ticketEvent.status === "live" ? "default" : "outline"}
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
                    className="bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white"
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
        <Card className="mb-6 sm:mb-8 bg-[#232A45] border-none shadow-lg rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <h3 className="font-semibold text-white">Find Events</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>

            <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4">
              {/* Search - Always Visible */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-12 bg-[#181F36] text-white border border-[#2D365A] placeholder:text-blue-200 focus:ring-2 focus:ring-blue-700"
                />
              </div>

              {/* Filters */}
              <div
                className={`${
                  showFilters || window.innerWidth >= 640 ? "block" : "hidden"
                } sm:block`}
              >
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48 h-10 sm:h-12 bg-[#181F36] text-white border border-[#2D365A]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#232A45] text-white border border-[#2D365A]">
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

        {/* Upcoming Events Section */}
        <h2 className="text-2xl font-bold text-white mb-4">Upcoming Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {upcomingEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No upcoming events</h3>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none rounded-2xl shadow-md h-full flex flex-col"
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {event.bannerBase64 && (
                    <img
                      src={event.bannerBase64 || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-40 sm:h-48 object-cover rounded-t-2xl"
                    />
                  )}
                  <div className="p-4 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs bg-blue-700/80 text-white border-none">
                        {event.type}
                      </Badge>
                      <Badge
                        className={`text-xs ${event.ticketPrice === 0 ? "bg-green-700/80 text-white" : "bg-blue-700/80 text-white"}`}
                      >
                        {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 text-white">{event.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center text-blue-200 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(event.date, "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center text-blue-200 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-blue-200 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.isVirtual ? "Virtual Event" : event.location}
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-700 to-purple-700 text-white font-bold mt-auto hover:from-blue-800 hover:to-purple-800"
                      onClick={() => setSelectedEvent(event)}
                    >
                      Register Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {/* Past Events Section */}
        <h2 className="text-2xl font-bold text-white mb-4">Past Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {pastEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No past events</h3>
            </div>
          ) : (
            pastEvents.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none rounded-2xl shadow-md h-full flex flex-col opacity-80"
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {event.bannerBase64 && (
                    <img
                      src={event.bannerBase64 || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-40 sm:h-48 object-cover rounded-t-2xl"
                    />
                  )}
                  <div className="p-4 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs bg-blue-700/80 text-white border-none">
                        {event.type}
                      </Badge>
                      <Badge
                        className={`text-xs ${event.ticketPrice === 0 ? "bg-green-700/80 text-white" : "bg-blue-700/80 text-white"}`}
                      >
                        {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 text-white">{event.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center text-blue-200 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(event.date, "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center text-blue-200 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-blue-200 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.isVirtual ? "Virtual Event" : event.location}
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gray-400 text-white font-bold mt-auto cursor-not-allowed"
                      disabled
                    >
                      Event Ended
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
