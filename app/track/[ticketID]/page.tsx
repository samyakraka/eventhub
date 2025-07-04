"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Ticket, Event, RaceCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TrackRunnerPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const [ticket, setTicket] = useState<Ticket & { event?: Event } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      setLoading(true);
      const ticketDoc = await getDoc(doc(db, "tickets", ticketId));
      if (!ticketDoc.exists()) {
        setTicket(null);
        setLoading(false);
        return;
      }
      const ticketData = ticketDoc.data() as Ticket;
      let event: Event | undefined = undefined;
      if (ticketData.eventId) {
        const eventDoc = await getDoc(doc(db, "events", ticketData.eventId));
        if (eventDoc.exists()) {
          event = { id: eventDoc.id, ...eventDoc.data() } as Event;
        }
      }
      setTicket({ ...ticketData, event });
      setLoading(false);
    };
    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!ticket || !ticket.event) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Runner not found.</div>;
  }
  const { registrationData } = ticket;
  const event = ticket.event;
  const category = event.raceCategories?.find((c: RaceCategory) => c.id === registrationData?.selectedCategoryId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-2 sm:px-0 flex flex-col items-center">
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Tracking: {registrationData?.firstName} {registrationData?.lastName}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">Bib: {registrationData?.bibNumber || 'N/A'}</Badge>
            <Badge variant="outline">Category: {category?.name || 'N/A'}</Badge>
            <Badge variant="outline">Event: {event.title}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <span className="font-semibold">Event Date:</span> {event.startDate?.toLocaleDateString?.() || 'N/A'}
          </div>
          {/* Live Map Placeholder */}
          <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center text-gray-500 mb-4">
            Live Map Coming Soon
          </div>
          {/* Live Stream */}
          {registrationData?.liveStreamUrl && (
            <div className="mb-4">
              <a href={registrationData.liveStreamUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">Watch Live Stream</a>
            </div>
          )}
          {/* Recent Milestones/Selfies Placeholder */}
          <div className="mb-4">
            <div className="font-semibold mb-1">Recent Milestones & Selfies</div>
            <div className="text-gray-500">(Coming soon: runner's shared updates will appear here)</div>
          </div>
          {/* Cheer/Message Box Placeholder */}
          <div className="mb-2">
            <div className="font-semibold mb-1">Send a Cheer</div>
            <input className="w-full border rounded px-3 py-2 mb-2" placeholder="Type your cheer message... (Coming soon)" disabled />
            <Button disabled>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
