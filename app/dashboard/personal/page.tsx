"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  Ticket,
  MapPin,
  Users,
  Loader2,
  ExternalLink,
  Plus,
  Calendar, // Add this import
} from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initFirebase } from "@/lib/firebase";

export default function PersonalDashboardPage() {
  const [userData, setUserData] = useState({
    upcomingEvents: [],
    tickets: [],
    savedEvents: [],
    displayName: "",
    email: "",
    photoURL: "",
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Initialize Firebase and get current user
  useEffect(() => {
    const app = initFirebase();
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserData((prevState) => ({
          ...prevState,
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
        }));
      } else {
        // Handle not logged in state
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user data when userId changes
  useEffect(() => {
    async function fetchUserData() {
      if (!userId) return;

      setLoading(true);
      try {
        // Here you would fetch actual data from your API
        // For now, we'll use mock data

        // Mock data - replace with actual API call
        const mockUpcomingEvents = [
          {
            id: "evt-1",
            title: "Tech Conference 2025",
            date: new Date("2025-06-15T09:00:00"),
            location: "San Francisco Convention Center",
            ticketType: "VIP",
            image: "/placeholder.svg",
          },
          {
            id: "evt-2",
            title: "Music Festival",
            date: new Date("2025-07-22T16:00:00"),
            location: "Golden Gate Park",
            ticketType: "Standard",
            image: "/placeholder.svg",
          },
        ];

        const mockTickets = [
          {
            id: "tkt-001",
            eventId: "evt-1",
            eventName: "Tech Conference 2025",
            eventDate: new Date("2025-06-15T09:00:00"),
            ticketType: "VIP",
            price: 599,
          },
          {
            id: "tkt-002",
            eventId: "evt-2",
            eventName: "Music Festival",
            eventDate: new Date("2025-07-22T16:00:00"),
            ticketType: "Standard",
            price: 199,
          },
        ];

        const mockSavedEvents = [
          {
            id: "evt-3",
            title: "Business Summit",
            date: new Date("2025-04-10T08:30:00"),
            location: "Virtual Event",
            image: "/placeholder.svg",
          },
        ];

        setUserData((prevState) => ({
          ...prevState,
          upcomingEvents: mockUpcomingEvents,
          tickets: mockTickets,
          savedEvents: mockSavedEvents,
        }));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching personal dashboard data:", error);
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2">Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Personal Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {userData.displayName || "there"}! Here's what's
          happening with your events.
        </p>
      </div>

      {/* User Profile Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={userData.photoURL || "/placeholder.svg"}
                alt="Profile"
              />
              <AvatarFallback>
                {userData.displayName?.[0] || userData.email?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-xl font-bold">
                {userData.displayName || "User"}
              </h2>
              <p className="text-muted-foreground">{userData.email}</p>
            </div>
            <div className="md:ml-auto flex flex-col md:flex-row gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/my-account">Manage Account</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            <Calendar className="h-4 w-4 mr-2" />
            Upcoming Events
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-4 w-4 mr-2" />
            My Tickets
          </TabsTrigger>
          <TabsTrigger value="saved">
            <CalendarDays className="h-4 w-4 mr-2" />
            Saved Events
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming">
          {userData.upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Upcoming
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {format(event.date, "PPP 'at' p")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Ticket className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.ticketType}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Upcoming Events</CardTitle>
                <CardDescription>
                  You don't have any upcoming events. Browse events to find
                  something interesting!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/events">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Events
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          {userData.tickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.tickets.map((ticket) => (
                <Card key={ticket.id} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{ticket.eventName}</CardTitle>
                        <CardDescription>
                          {format(ticket.eventDate, "PPP 'at' p")}
                        </CardDescription>
                      </div>
                      <Badge>{ticket.ticketType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{format(ticket.eventDate, "p")}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>${ticket.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Tickets</CardTitle>
                <CardDescription>
                  You haven't purchased any tickets yet. Browse events to buy
                  tickets!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/events">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Events
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Saved Events Tab */}
        <TabsContent value="saved">
          {userData.savedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.savedEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {format(event.date, "PPP 'at' p")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex justify-between">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm">Register</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Saved Events</CardTitle>
                <CardDescription>
                  You haven't saved any events yet. Browse events and save ones
                  you're interested in!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/events">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Events
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Recommendations Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Recommended For You
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                We'll display personalized event recommendations here based on
                your interests and past attendance.
              </p>
              <Button asChild>
                <Link href="/events">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Explore Event Categories
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
