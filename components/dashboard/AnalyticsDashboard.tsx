import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, Ticket } from "@/types";
import { toast } from "@/hooks/use-toast";

interface AnalyticsDashboardProps {
  event: Event;
  onBack: () => void;
}

export function AnalyticsDashboard({ event, onBack }: AnalyticsDashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [shareCount, setShareCount] = useState(0); // Placeholder, implement if tracked
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [event.id]);

  const fetchAnalytics = async () => {
    setLoading(true);
    // Fetch tickets
    const ticketsQ = query(collection(db, "tickets"), where("eventId", "==", event.id));
    const ticketsSnap = await getDocs(ticketsQ);
    const ticketsData = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[];
    setTickets(ticketsData);
    // Fetch feedback
    const feedbackQ = query(collection(db, "feedback"), where("eventId", "==", event.id));
    const feedbackSnap = await getDocs(feedbackQ);
    setFeedbacks(feedbackSnap.docs.map(doc => doc.data()));
    // Fetch chat messages
    const chatQ = query(collection(db, "liveChats"), where("eventId", "==", event.id));
    const chatSnap = await getDocs(chatQ);
    setChatCount(chatSnap.size);
    // TODO: Fetch share count if tracked
    setLoading(false);
  };

  const totalTickets = tickets.length;
  const physicalCheckIns = tickets.filter(t => t.checkedIn).length;
  const onlineCheckIns = tickets.filter(t => t.checkedInOnline).length;
  const revenue = tickets.reduce((sum, t) => sum + (t.finalPrice || t.originalPrice || 0), 0);
  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(2) : 'N/A';

  const sendReminders = async () => {
    if (!tickets.length) return;
    try {
      for (const ticket of tickets) {
        // Email
        if (ticket.registrationData?.email) {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: ticket.registrationData.email,
              subject: `Reminder: ${event.title} is starting soon!`,
              text: `Hi ${ticket.registrationData.firstName || ''},\n\nThis is a reminder that your concert event '${event.title}' is starting soon!\n\nDate: ${event.startDate.toLocaleDateString()}\nTime: ${event.time}\nLocation: ${event.isVirtual ? 'Virtual Event' : event.location}\n\nSee you there!`,
              html: `<p>Hi ${ticket.registrationData.firstName || ''},</p><p>This is a reminder that your concert event <b>${event.title}</b> is starting soon!</p><ul><li><b>Date:</b> ${event.startDate.toLocaleDateString()}</li><li><b>Time:</b> ${event.time}</li><li><b>Location:</b> ${event.isVirtual ? 'Virtual Event' : event.location}</li></ul><p>See you there!</p>`
            })
          });
        }
        // WhatsApp
        if (ticket.registrationData?.phone) {
          await fetch("/api/send-whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: `whatsapp:${ticket.registrationData.phone}`,
              body: `🎵 Reminder: ${event.title} is starting soon!\nDate: ${event.startDate.toLocaleDateString()}\nTime: ${event.time}\nLocation: ${event.isVirtual ? 'Virtual Event' : event.location}`
            })
          });
        }
      }
      toast({ title: "Reminders Sent!", description: "All attendees have been notified." });
    } catch (error: any) {
      toast({ title: "Failed to send reminders", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Button variant="outline" onClick={onBack} className="mb-6">Back to Dashboard</Button>
      <Button onClick={sendReminders} className="mb-6 ml-4">Send Reminder to All Attendees</Button>
      <h1 className="text-2xl font-bold mb-6">Analytics for: {event.title}</h1>
      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <CardTitle>Total Tickets Sold</CardTitle>
              <div className="text-3xl font-bold mt-2">{totalTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>Physical Check-ins</CardTitle>
              <div className="text-3xl font-bold mt-2">{physicalCheckIns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>Online Check-ins</CardTitle>
              <div className="text-3xl font-bold mt-2">{onlineCheckIns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>Revenue</CardTitle>
              <div className="text-3xl font-bold mt-2">${revenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>Average Feedback Rating</CardTitle>
              <div className="text-3xl font-bold mt-2">{avgRating}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>Chat Messages</CardTitle>
              <div className="text-3xl font-bold mt-2">{chatCount}</div>
            </CardContent>
          </Card>
          {/* Add more cards/charts as needed, e.g., shares, engagement, etc. */}
        </div>
      )}
    </div>
  );
} 
