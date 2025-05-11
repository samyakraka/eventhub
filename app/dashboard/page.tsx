"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, Users, DollarSign, Loader2 } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initFirebase } from "@/lib/firebase"; // Adjust the import path as needed

export default function DashboardPage() {
  const [userData, setUserData] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
    revenue: 0,
    nextEventDays: 0,
    events: [],
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
      } else {
        // Handle not logged in state
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user data when userId changes
  useEffect(() => {
    async function fetchUserDashboard() {
      if (!userId) return;

      setLoading(true);
      try {
        // Fetch dashboard data
        const response = await fetch(`/api/dashboard?userId=${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();

        setUserData({
          totalEvents: data.totalEvents || 0,
          upcomingEvents: data.upcomingEvents || 0,
          totalAttendees: data.totalAttendees || 0,
          revenue: data.revenue || 0,
          nextEventDays: data.nextEventDays || 0,
          events: data.events || [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // You could set an error state here
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserDashboard();
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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your events and performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {userData.totalEvents > 0
                ? `${userData.upcomingEvents} upcoming events`
                : "Create your first event"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">
              {userData.upcomingEvents > 0
                ? `Next event in ${userData.nextEventDays} days`
                : "No upcoming events"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attendees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">
              {userData.totalAttendees > 0
                ? `Across ${userData.totalEvents} events`
                : "No attendees yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userData.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {userData.revenue > 0
                ? `From ticket sales & registrations`
                : "No revenue yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="live">Live Now</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          {userData.events.filter((event) => event.status === "upcoming")
            .length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userData.events
                .filter((event) => event.status === "upcoming")
                .map((event, i) => (
                  <Card key={event.id || i}>
                    <CardHeader>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>{event.date}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
                            {event.type}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" /> {event.attendees || 0}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-primary">
                          Manage
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
                  You don't have any upcoming events scheduled.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="live">
          {userData.events.filter((event) => event.status === "live").length >
          0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userData.events
                .filter((event) => event.status === "live")
                .map((event, i) => (
                  <Card key={event.id || i}>
                    <CardHeader>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>Live now</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span className="text-xs font-medium">LIVE</span>
                          </div>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" /> {event.watching || 0}{" "}
                            watching
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Live Events</CardTitle>
                <CardDescription>
                  You don't have any events that are currently live.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="past">
          {userData.events.filter((event) => event.status === "completed")
            .length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Past Events</CardTitle>
                <CardDescription>
                  You have{" "}
                  {
                    userData.events.filter(
                      (event) => event.status === "completed"
                    ).length
                  }{" "}
                  completed events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userData.events
                    .filter((event) => event.status === "completed")
                    .map((event, i) => (
                      <div
                        key={event.id || i}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.date}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Past Events</CardTitle>
                <CardDescription>
                  You don't have any completed events yet.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
