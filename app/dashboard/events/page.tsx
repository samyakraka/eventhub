"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Users,
  MoreHorizontal,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseISO,
  isAfter,
  isBefore,
  isWithinInterval,
  format,
} from "date-fns";
// Import Firebase auth
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initFirebase } from "@/lib/firebase"; // Adjust this import based on your Firebase setup
import { initializeApp, getApps } from "firebase/app";
import ManageEventModal from "@/components/ManageEventModal";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const initFirebase = () => {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
};

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  useEffect(() => {
    // Initialize Firebase and get current user
    const app = initFirebase();
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      if (!currentUserId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/events?userId=${currentUserId}`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch {
        setEvents([]);
      }
      setLoading(false);
    }

    if (currentUserId) {
      fetchEvents();
    }
  }, [currentUserId]);

  // Helper to determine event status based on time
  function getEventStatus(event: any) {
    const now = new Date();
    const start = event.date ? parseISO(event.date) : null;
    const end = event.endDate ? parseISO(event.endDate) : null;

    if (start && end) {
      if (isWithinInterval(now, { start, end })) return "live";
      if (isBefore(now, start)) return "upcoming";
      if (isAfter(now, end)) return "completed";
    } else if (start) {
      // If no end, treat as live for the day of start
      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(start);
      endDay.setHours(23, 59, 59, 999);
      if (isWithinInterval(now, { start: startDay, end: endDay }))
        return "live";
      if (isBefore(now, startDay)) return "upcoming";
      if (isAfter(now, endDay)) return "completed";
    }
    return "upcoming";
  }

  // Helper function to format dates nicely
  const formatEventDate = (event) => {
    if (!event.date) return "No date specified";

    const startDate = parseISO(event.date);
    const formattedStart = format(startDate, "PPP' at 'p"); // e.g., "March 14, 2023 at 2:30 PM"

    if (event.endDate) {
      const endDate = parseISO(event.endDate);
      // If same day, only show end time
      if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
        return `${format(startDate, "PPP")} from ${format(
          startDate,
          "p"
        )} to ${format(endDate, "p")}`;
      } else {
        // Different days, show full date and time for both
        return `${format(startDate, "PPP' at 'p")} to ${format(
          endDate,
          "PPP' at 'p"
        )}`;
      }
    }

    return formattedStart;
  };

  const formatTimeRemaining = (event) => {
    const now = new Date();
    const startDate = parseISO(event.date);

    if (event.computedStatus === "upcoming") {
      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (startDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
      );
      if (daysRemaining === 0) return "Starting today";
      if (daysRemaining === 1) return "Starting tomorrow";
      return `Starting in ${daysRemaining} days`;
    }

    return "";
  };

  // Helper function to handle opening the manage modal
  const handleManageEvent = (event: any) => {
    setSelectedEvent(event);
    setIsManageModalOpen(true);
  };

  // Add this function to refresh events after updating
  const refreshEvents = async () => {
    if (!currentUserId) return;

    try {
      const res = await fetch(`/api/events?userId=${currentUserId}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      console.error("Error refreshing events");
    }
  };

  // Filter events based on search query, status, and user ID
  const filteredEvents = events
    .map((event) => ({
      ...event,
      computedStatus: getEventStatus(event),
    }))
    .filter((event) => {
      // Check if event belongs to current user
      const belongsToUser = event.userId === currentUserId;

      const matchesSearch =
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || event.computedStatus === statusFilter;

      return belongsToUser && matchesSearch && matchesStatus;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground">
          Manage and track all your events in one place.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Events
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("upcoming")}>
                Upcoming Events
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("live")}>
                Live Events
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                Past Events
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Sort by Date</DropdownMenuItem>
              <DropdownMenuItem>Sort by Name</DropdownMenuItem>
              <DropdownMenuItem>Sort by Attendees</DropdownMenuItem>
              <DropdownMenuItem>Sort by Revenue</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
          <Link href="/dashboard/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Create Event
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live Now</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div>Loading events...</div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card key={event._id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={event.banner || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 rounded-full"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        className={
                          event.computedStatus === "live"
                            ? "bg-red-500 hover:bg-red-600"
                            : event.computedStatus === "upcoming"
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {event.computedStatus === "live"
                          ? "LIVE"
                          : event.computedStatus === "upcoming"
                          ? "Upcoming"
                          : "Completed"}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {formatEventDate(event)}
                      {event.computedStatus === "upcoming" && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatTimeRemaining(event)}
                        </p>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.attendees || 0} attendees</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="font-normal">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button size="sm" onClick={() => handleManageEvent(event)}>
                      Manage
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell className="font-medium">
                          {event.title}
                        </TableCell>
                        <TableCell>{formatEventDate(event)}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.type}</Badge>
                        </TableCell>
                        <TableCell>{event.attendees || 0}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              event.computedStatus === "live"
                                ? "bg-red-500 hover:bg-red-600"
                                : event.computedStatus === "upcoming"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-500 hover:bg-gray-600"
                            }
                          >
                            {event.computedStatus === "live"
                              ? "LIVE"
                              : event.computedStatus === "upcoming"
                              ? "Upcoming"
                              : "Completed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${event.sales?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="h-4 w-4 mr-2" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents
              .filter((event) => event.computedStatus === "upcoming")
              .map((event) => (
                <Card key={event._id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={event.banner || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 rounded-full"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {formatEventDate(event)}
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatTimeRemaining(event)}
                      </p>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.attendees || 0} attendees</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="font-normal">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button size="sm">Manage</Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents
              .filter((event) => event.computedStatus === "live")
              .map((event) => (
                <Card key={event._id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={event.banner || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 rounded-full"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-red-500 hover:bg-red-600">
                        LIVE
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {formatEventDate(event)}
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="text-red-500 font-medium">
                          Happening now
                        </span>
                      </p>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.attendees || 0} attendees</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="font-normal">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button size="sm">Manage Stream</Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents
              .filter((event) => event.computedStatus === "completed")
              .map((event) => (
                <Card key={event._id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={event.banner || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 rounded-full"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-gray-500 hover:bg-gray-600">
                        Completed
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {formatEventDate(event)}
                      <p className="text-sm text-muted-foreground mt-1">
                        Event completed
                      </p>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.attendees || 0} attendees</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="font-normal">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button size="sm">Analytics</Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add the manage event modal */}
      {selectedEvent && (
        <ManageEventModal
          event={selectedEvent}
          isOpen={isManageModalOpen}
          onClose={() => {
            setIsManageModalOpen(false);
            refreshEvents(); // Refresh events after closing modal
          }}
        />
      )}
    </div>
  );
}
