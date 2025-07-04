"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, Ticket, RaceCategory, KitInfo } from "@/types";
import {
  QrCode,
  Calendar,
  MapPin,
  Clock,
  Copy,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EventRecommendations } from "@/components/ai/EventRecommendations";

interface MyTicketsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyTicketsDialog({ open, onOpenChange }: MyTicketsDialogProps) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<(Ticket & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoLiveMap, setShowGoLiveMap] = useState<{ [ticketId: string]: boolean }>({});
  const [liveStreamUrlMap, setLiveStreamUrlMap] = useState<{ [ticketId: string]: string }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [recommendations, setRecommendations] = useState<Event[]>([]);

  useEffect(() => {
    if (open && user) {
      fetchMyTickets();
    }
  }, [open, user]);

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

      const ticketsWithEvents = await Promise.all(
        ticketsData.map(async (ticket) => {
          try {
            const eventDoc = await getDoc(doc(db, "events", ticket.eventId));
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
              } as Event;
              return { ...ticket, event: eventData };
            }
            return ticket;
          } catch (error) {
            console.error("Error fetching event for ticket:", error);
            return ticket;
          }
        })
      );

      ticketsWithEvents.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      setTickets(ticketsWithEvents);

      const initialLiveStreamUrls: { [ticketId: string]: string } = {};
      ticketsWithEvents.forEach((ticket) => {
        initialLiveStreamUrls[ticket.id] = ticket.registrationData?.liveStreamUrl || '';
      });
      setLiveStreamUrlMap(initialLiveStreamUrls);
      setShowGoLiveMap({});
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!tickets[0]?.event) return;
    await addDoc(collection(db, "feedback"), {
      eventId: tickets[0].event.id,
      ticketId: tickets[0].id,
      userId: user?.uid,
      rating,
      comments,
      createdAt: new Date(),
    });
    setFeedbackSubmitted(true);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Tickets</DialogTitle>
            <DialogDescription>
              Your event tickets and QR codes
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            My Tickets ({tickets.length})
          </DialogTitle>
          <DialogDescription>
            Your event tickets and QR codes for check-in
          </DialogDescription>
        </DialogHeader>

        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tickets yet
            </h3>
            <p className="text-gray-600">
              Register for events to see your tickets here
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {tickets.map((ticket) => {
              const [showShareMilestone, setShowShareMilestone] = useState(false);
              const [showShareSelfie, setShowShareSelfie] = useState(false);
              const [showShareTracking, setShowShareTracking] = useState(false);
              const [showFeedback, setShowFeedback] = useState(false);
              const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
              const [rating, setRating] = useState(5);
              const [comments, setComments] = useState("");
              const [recommendations, setRecommendations] = useState<Event[]>([]);
              const handleFeedbackSubmit = async () => {
                if (!ticket.event) return;
                await addDoc(collection(db, "feedback"), {
                  eventId: ticket.event.id,
                  ticketId: ticket.id,
                  userId: user?.uid,
                  rating,
                  comments,
                  createdAt: new Date(),
                });
                setFeedbackSubmitted(true);
              };
              return (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2">
                        {ticket.event?.title || "Event Details Loading..."}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {ticket.checkedIn && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Checked In
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {ticket.event?.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Event Details */}
                      <div className="lg:col-span-2 space-y-4">
                        {ticket.event && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                              <span className="truncate">
                                {format(ticket.event.startDate, "MMM dd, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                              <span className="truncate">
                                {ticket.event.time}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                              <span className="truncate">
                                {ticket.event.isVirtual
                                  ? "Virtual Event"
                                  : ticket.event.location}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">Price:</span>
                              {ticket.finalPrice === 0 ? (
                                "Free"
                              ) : (
                                <span>
                                  ${ticket.finalPrice.toFixed(2)}
                                  {ticket.discountAmount &&
                                    ticket.discountAmount > 0 && (
                                      <span className="text-green-600 ml-1">
                                        (${ticket.discountAmount.toFixed(2)} off)
                                      </span>
                                    )}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Ticket ID:
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-mono break-all flex-1">
                                {ticket.id}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyToClipboard(ticket.id, "Ticket ID")
                                }
                                className="flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              QR Code Data:
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-mono break-all flex-1">
                                {ticket.qrCode}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyToClipboard(ticket.qrCode, "QR Code")
                                }
                                className="flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            Registered on{" "}
                            {format(ticket.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                          </div>
                        </div>

                        {ticket.event?.type === 'marathon' && (
                          <div className="mt-4 space-y-2 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-900">Bib Number:</span>
                              <span className="text-blue-800">{ticket.registrationData?.bibNumber || 'Assigned at kit pickup'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-900">Category:</span>
                              <span className="text-blue-800">
                                {ticket.event.raceCategories?.find((c: RaceCategory) => c.id === ticket.registrationData?.selectedCategoryId)?.name || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-900">T-Shirt Size:</span>
                              <span className="text-blue-800">{ticket.registrationData?.tShirtSize || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-900">Timing Chip:</span>
                              <span className="text-blue-800">{ticket.registrationData?.hasTimingChip ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-900">Kit Pickup:</span>
                              {ticket.registrationData?.kitPickedUp ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Kit Picked Up</span>
                              ) : (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Kit Not Picked Up</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Button size="sm" variant="outline" onClick={() => setShowGoLiveMap((prev) => ({ ...prev, [ticket.id]: true }))}>
                                Go Live
                              </Button>
                              {liveStreamUrlMap[ticket.id] && (
                                <a href={liveStreamUrlMap[ticket.id]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">View My Live Stream</a>
                              )}
                              <GoLiveDialog
                                open={!!showGoLiveMap[ticket.id]}
                                onOpenChange={(open) => setShowGoLiveMap((prev) => ({ ...prev, [ticket.id]: open }))}
                                onSave={async (url) => {
                                  const ticketRef = doc(db, 'tickets', ticket.id);
                                  await updateDoc(ticketRef, { 'registrationData.liveStreamUrl': url });
                                  setLiveStreamUrlMap((prev) => ({ ...prev, [ticket.id]: url }));
                                  toast({ title: 'Live Stream Shared!', description: 'Your live stream link is now visible to spectators.' });
                                }}
                              />
                              <Button size="sm" variant="outline" onClick={() => setShowShareMilestone(true)}>
                                Share Milestone
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowShareSelfie(true)}>
                                Share Selfie
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowShareTracking(true)}>
                                Share Live Tracking
                              </Button>
                              <SocialShareDialog open={showShareMilestone} onOpenChange={setShowShareMilestone} type="milestone" event={ticket.event!} bibNumber={ticket.registrationData?.bibNumber || ''} />
                              <SocialShareDialog open={showShareSelfie} onOpenChange={setShowShareSelfie} type="selfie" event={ticket.event!} bibNumber={ticket.registrationData?.bibNumber || ''} />
                              <LiveTrackingShareDialog open={showShareTracking} onOpenChange={setShowShareTracking} ticketId={ticket.id} />
                            </div>
                          </div>
                        )}

                        {/* Concert-specific fields for attendee */}
                        {ticket.event?.type === 'concert' && ticket.event.status === 'completed' && ticket.checkedIn && (
                          <div className="mt-6 space-y-4">
                            {/* Feedback Form */}
                            {!feedbackSubmitted && (
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold mb-2">We value your feedback!</h4>
                                <div className="flex items-center gap-2 mb-2">
                                  <Label>Rating:</Label>
                                  <select value={rating} onChange={e => setRating(Number(e.target.value))} className="border rounded px-2 py-1">
                                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                                  </select>
                                </div>
                                <Textarea
                                  placeholder="Comments (optional)"
                                  value={comments}
                                  onChange={e => setComments(e.target.value)}
                                  rows={2}
                                  className="mb-2"
                                />
                                <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
                              </div>
                            )}
                            {feedbackSubmitted && (
                              <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-semibold mb-2">Thank you for your feedback!</h4>
                                <p className="text-sm">We appreciate your input and hope you enjoyed the concert.</p>
                              </div>
                            )}
                            {/* Upsell: Event Recommendations */}
                            <div className="mt-4">
                              <EventRecommendations events={recommendations} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center space-y-3">
                        <div className="text-sm font-medium text-gray-600 text-center">
                          QR Code for Check-in
                        </div>
                        <div className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                          <QRCode
                            value={ticket.qrCode}
                            size={120}
                            style={{
                              height: "auto",
                              maxWidth: "100%",
                              width: "100%",
                            }}
                            viewBox={`0 0 256 256`}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center max-w-[150px]">
                          Show this QR code at the event for check-in
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GoLiveDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (url: string) => void }) {
  const [streamUrl, setStreamUrl] = useState('');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Go Live During Your Run</DialogTitle>
          <DialogDescription>
            Start a live stream on your favorite platform and share the link with your friends and spectators!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <a href="https://www.youtube.com/live_dashboard" target="_blank" rel="noopener noreferrer">Go Live on YouTube</a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://www.facebook.com/live/producer" target="_blank" rel="noopener noreferrer">Go Live on Facebook</a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Go Live on Instagram</a>
            </Button>
          </div>
          <div>
            <Label htmlFor="streamUrl">Paste Your Live Stream Link</Label>
            <Input
              id="streamUrl"
              placeholder="https://..."
              value={streamUrl}
              onChange={e => setStreamUrl(e.target.value)}
            />
            <Button className="mt-2 w-full" onClick={() => { onSave(streamUrl); onOpenChange(false); }} disabled={!streamUrl}>
              Share My Live Stream
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SocialShareDialog({ open, onOpenChange, type, event, bibNumber }: { open: boolean; onOpenChange: (open: boolean) => void; type: 'milestone' | 'selfie'; event: Event; bibNumber: string }) {
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleShare = async () => {
    let shareText = '';
    if (type === 'milestone') {
      shareText = `🏃‍♂️ I just hit a milestone in the ${event.title} (Bib: ${bibNumber})! ${message}`;
    } else {
      shareText = `📸 Selfie from the ${event.title} (Bib: ${bibNumber})! ${message}`;
    }
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        toast({ title: 'Shared!', description: 'Your update was shared.' });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: 'Copied!', description: 'Message copied to clipboard. Paste it on your favorite social app!' });
    }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'milestone' ? 'Share Milestone' : 'Share Selfie'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label htmlFor="message">Message</Label>
          <Input id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder={type === 'milestone' ? 'E.g. Just crossed 10K!' : 'E.g. Feeling great!'} />
          {type === 'selfie' && (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} className="mb-2" />
              {photo && <img src={URL.createObjectURL(photo)} alt="Selfie preview" className="max-w-xs rounded border" />}
            </div>
          )}
          <Button className="w-full" onClick={handleShare}>
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LiveTrackingShareDialog({ open, onOpenChange, ticketId }: { open: boolean; onOpenChange: (open: boolean) => void; ticketId: string }) {
  const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${ticketId}`;
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: trackingUrl, text: `Follow my live progress: ${trackingUrl}` });
        toast({ title: 'Shared!', description: 'Live tracking link shared.' });
      } catch {}
    } else {
      navigator.clipboard.writeText(trackingUrl);
      toast({ title: 'Copied!', description: 'Live tracking link copied to clipboard.' });
    }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Live Tracking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm">Share this link with friends and family so they can follow your progress in real time:</div>
          <Input value={trackingUrl} readOnly className="mb-2" />
          <Button className="w-full" onClick={handleShare}>Share Link</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
