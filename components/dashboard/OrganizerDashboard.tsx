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
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event } from "@/types";
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Menu,
  X,
  User,
  MoreVertical,
  Play,
  Square,
  Trash2,
  Edit,
} from "lucide-react";
import { CreateEventDialog } from "./CreateEventDialog";
import { format } from "date-fns";
import { EventDetailsPage } from "../events/EventDetailsPage";
import { EditEventDialog } from "./EditEventDialog";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchRevenueData();
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "events"),
        where("organizerUid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        registrationCount: 0, // Default value for consistency
      })) as unknown as Event[];

      eventsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    if (!user) return;

    try {
      const eventsQuery = query(
        collection(db, "events"),
        where("organizerUid", "==", user.uid)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventIds = eventsSnapshot.docs.map((doc) => doc.id);

      if (eventIds.length === 0) {
        setTotalRevenue(0);
        setTotalTickets(0);
        return;
      }

      let revenue = 0;
      let ticketCount = 0;

      for (const eventId of eventIds) {
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);

        ticketsSnapshot.docs.forEach((doc) => {
          const ticket = doc.data();
          revenue += ticket.finalPrice || ticket.originalPrice || 0;
          ticketCount++;
        });
      }

      setTotalRevenue(revenue);
      setTotalTickets(ticketCount);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    }
  };

  const deleteEvent = async (eventId: string, eventTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "events", eventId));

      toast({
        title: "Event Deleted",
        description: `"${eventTitle}" has been deleted successfully.`,
      });

      fetchEvents();
      fetchRevenueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEvent = async (eventId: string, eventTitle: string) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        status: "live",
      });

      toast({
        title: "Event Started!",
        description: `"${eventTitle}" is now live.`,
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const endEvent = async (eventId: string, eventTitle: string) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        status: "completed",
      });

      toast({
        title: "Event Ended",
        description: `"${eventTitle}" has been marked as completed.`,
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "live":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#101624] via-[#181F36] to-[#181F36]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (selectedEventId) {
    return (
      <EventDetailsPage
        eventId={selectedEventId}
        onBack={() => setSelectedEventId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#181F36] to-[#181F36]">
      {/* Enhanced Header */}
      <header className="bg-[#181F36] shadow-sm border-b border-[#232A45] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  EventHub
                </h1>
                <p className="text-sm text-gray-400 hidden sm:block">
                  Welcome back, {user?.displayName}
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                onClick={() => setShowCreateEvent(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
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
                onClick={() => {
                  setShowCreateEvent(true);
                  setShowMobileMenu(false);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
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
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-400">
                    Total Events
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {events.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-400">
                    Active Events
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {
                      events.filter(
                        (e) => e.status === "upcoming" || e.status === "live"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-400">
                    Total Attendees
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {totalTickets}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Events List */}
        <Card className="bg-gradient-to-br from-[#232A45] via-[#232A45]/80 to-[#181F36] border-none shadow-lg rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <CardTitle className="text-lg sm:text-xl text-white">
                  Your Events
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage and monitor your events
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowCreateEvent(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No events yet
                </h3>
                <p className="text-gray-400 mb-4">
                  Get started by creating your first event
                </p>
                <Button
                  onClick={() => setShowCreateEvent(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-[#2D365A] rounded-lg p-4 hover:shadow-md transition-shadow bg-[#22305A]/80 hover:bg-gradient-to-br hover:from-blue-900/50 hover:to-purple-900/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold truncate text-white">
                            {event.title}
                          </h3>
                          <Badge
                            className={`${getStatusColor(
                              event.status
                            )} border-none`}
                          >
                            {event.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-blue-700/80 text-white border-none"
                          >
                            {event.type}
                          </Badge>
                          {event.isVirtual && (
                            <Badge
                              variant="outline"
                              className="bg-purple-700/80 text-white border-none"
                            >
                              Virtual
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-300 mb-2 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(event.date, "MMM dd, yyyy")}
                          </span>
                          <span>{event.time}</span>
                          <span className="truncate">
                            {event.isVirtual ? "Virtual" : event.location}
                          </span>
                          <span>
                            $
                            {event.ticketPrice === 0
                              ? "Free"
                              : event.ticketPrice}
                          </span>
                        </div>
                      </div>

                      {/* Desktop Actions */}
                      <div className="hidden sm:flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEventId(event.id)}
                          className="bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white"
                        >
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEditEvent(true);
                          }}
                          className="bg-[#232A45] border-[#2D365A] text-white hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {event.status === "upcoming" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => startEvent(event.id, event.title)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {event.status === "live" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => endEvent(event.id, event.title)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteEvent(event.id, event.title)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Mobile Actions */}
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-[#232A45] border-[#2D365A] text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-[#232A45] border-[#2D365A] text-white"
                          >
                            <DropdownMenuItem
                              onClick={() => setSelectedEventId(event.id)}
                              className="hover:bg-[#2D365A]"
                            >
                              Manage Event
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowEditEvent(true);
                              }}
                              className="hover:bg-[#2D365A]"
                            >
                              Edit Event
                            </DropdownMenuItem>
                            {event.status === "upcoming" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  startEvent(event.id, event.title)
                                }
                                className="hover:bg-[#2D365A]"
                              >
                                Start Event
                              </DropdownMenuItem>
                            )}
                            {event.status === "live" && (
                              <DropdownMenuItem
                                onClick={() => endEvent(event.id, event.title)}
                                className="hover:bg-[#2D365A]"
                              >
                                End Event
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteEvent(event.id, event.title)}
                              className="text-red-400 hover:bg-[#2D365A]"
                            >
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        onEventCreated={() => {
          fetchEvents();
          fetchRevenueData();
        }}
      />
      <EditEventDialog
        event={selectedEvent}
        open={showEditEvent}
        onOpenChange={setShowEditEvent}
        onEventUpdated={() => {
          fetchEvents();
          fetchRevenueData();
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
