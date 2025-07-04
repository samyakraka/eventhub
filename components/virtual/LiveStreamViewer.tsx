"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  getDocs,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, LiveChat, Ticket } from "@/types"
import { Send, Trash2, ExternalLink, MessageCircle, Users, Play, Pause, Shield, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface LiveStreamViewerProps {
  event: Event
  hasAccess: boolean
}

interface VideoState {
  isPlaying: boolean
  currentTime: number
  lastUpdated: number
  duration?: number
}

// YouTube URL utilities
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be")
}

// Emoji options for reactions
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"]

export function LiveStreamViewer({ event, hasAccess }: LiveStreamViewerProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<LiveChat[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: true,
    currentTime: 0,
    lastUpdated: Date.now(),
  })
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncTimeRef = useRef<number>(0)
  const [onlineCheckedIn, setOnlineCheckedIn] = useState(false)
  const [onlineCheckInTime, setOnlineCheckInTime] = useState<Date | null>(null)

  const isOrganizer = user?.uid === event.organizerUid
  const isYouTube = event.virtualLink && isYouTubeUrl(event.virtualLink)
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(event.virtualLink!) : null

  // Real-time chat listener
  useEffect(() => {
    if (!hasAccess || event.status !== "live") return

    const chatQuery = query(collection(db, "liveChats"), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const chatMessages: LiveChat[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.eventId === event.id) {
          chatMessages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as LiveChat)
        }
      })
      setMessages(chatMessages)
    })

    return () => unsubscribe()
  }, [event.id, hasAccess, event.status])

  // Real-time video state synchronization
  useEffect(() => {
    if (!hasAccess || event.status !== "live" || !isYouTube) return

    const videoStateDoc = doc(db, "videoStates", event.id)

    const unsubscribe = onSnapshot(videoStateDoc, (doc) => {
      if (doc.exists()) {
        const state = doc.data() as VideoState
        setVideoState(state)

        // For attendees, immediately sync with host's state
        if (!isOrganizer && iframeRef.current) {
          syncWithHost(state)
        }
      } else if (isOrganizer) {
        // Initialize video state for organizer
        const initialState: VideoState = {
          isPlaying: true,
          currentTime: 0,
          lastUpdated: Date.now(),
        }
        setDoc(videoStateDoc, initialState)
        setVideoState(initialState)
      }
    })

    return () => unsubscribe()
  }, [event.id, hasAccess, event.status, isYouTube, isOrganizer])

  // Continuous sync for attendees
  useEffect(() => {
    if (isOrganizer || !hasAccess || event.status !== "live" || !isYouTube) return

    // Sync every 2 seconds to maintain timeline accuracy
    syncIntervalRef.current = setInterval(() => {
      if (videoState.lastUpdated > lastSyncTimeRef.current) {
        syncWithHost(videoState)
        lastSyncTimeRef.current = videoState.lastUpdated
      }
    }, 2000)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [isOrganizer, hasAccess, event.status, isYouTube, videoState])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const syncWithHost = (hostState: VideoState) => {
    if (!iframeRef.current || isOrganizer) return

    setSyncStatus("syncing")

    try {
      const iframe = iframeRef.current
      const now = Date.now()
      const timeDiff = (now - hostState.lastUpdated) / 1000

      // Calculate the current time based on host's state and time elapsed
      let targetTime = hostState.currentTime
      if (hostState.isPlaying) {
        targetTime += timeDiff
      }

      // Seek to the correct time
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [targetTime, true],
        }),
        "*",
      )

      // Set play/pause state
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: hostState.isPlaying ? "playVideo" : "pauseVideo",
          args: "",
        }),
        "*",
      )

      setSyncStatus("synced")
    } catch (error) {
      console.error("Sync error:", error)
      setSyncStatus("error")
    }
  }

  const updateVideoState = async (newState: Partial<VideoState>) => {
    if (!isOrganizer) return

    const updatedState: VideoState = {
      ...videoState,
      ...newState,
      lastUpdated: Date.now(),
    }

    try {
      await setDoc(doc(db, "videoStates", event.id), updatedState)
      setVideoState(updatedState)
    } catch (error) {
      console.error("Failed to update video state:", error)
      toast({
        title: "Error",
        description: "Failed to sync video state",
        variant: "destructive",
      })
    }
  }

  const handleOrganizerPlayPause = async () => {
    if (!isOrganizer || !iframeRef.current) return

    const newPlayingState = !videoState.isPlaying

    // Update local state immediately
    const newState = {
      ...videoState,
      isPlaying: newPlayingState,
      lastUpdated: Date.now(),
    }
    setVideoState(newState)

    // Control the organizer's video
    const iframe = iframeRef.current
    iframe.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: newPlayingState ? "playVideo" : "pauseVideo",
        args: "",
      }),
      "*",
    )

    // Update Firestore to sync with attendees
    await updateVideoState({
      isPlaying: newPlayingState,
      currentTime: videoState.currentTime,
    })

    toast({
      title: newPlayingState ? "Video Resumed" : "Video Paused",
      description: "All attendees are now synchronized",
    })
  }

  // Listen for YouTube player events (organizer only)
  useEffect(() => {
    if (!isOrganizer || !isYouTube) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return

      try {
        const data = JSON.parse(event.data)
        if (data.event === "video-progress") {
          // Update current time periodically
          updateVideoState({
            currentTime: data.info.currentTime,
            isPlaying: videoState.isPlaying,
          })
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [isOrganizer, isYouTube, videoState.isPlaying])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !hasAccess) return

    setLoading(true)
    try {
      await addDoc(collection(db, "liveChats"), {
        eventId: event.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        reactions: {},
      })
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!isOrganizer) return

    try {
      await deleteDoc(doc(db, "liveChats", messageId))
      toast({
        title: "Message deleted",
        description: "The message has been removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user || !hasAccess) return

    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    const reactions = message.reactions || {}
    const emojiReactions = reactions[emoji] || []

    let updatedReactions
    if (emojiReactions.includes(user.uid)) {
      updatedReactions = {
        ...reactions,
        [emoji]: emojiReactions.filter((uid) => uid !== user.uid),
      }
    } else {
      updatedReactions = {
        ...reactions,
        [emoji]: [...emojiReactions, user.uid],
      }
    }

    try {
      await updateDoc(doc(db, "liveChats", messageId), {
        reactions: updatedReactions,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const renderYouTubeEmbed = () => {
    if (!youtubeVideoId) return null

    // Organizer gets full controls, attendees get no controls at all
    const embedParams = isOrganizer
      ? "enablejsapi=1&autoplay=1&controls=1&rel=0&modestbranding=1&origin=" + window.location.origin
      : "enablejsapi=1&autoplay=1&controls=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&origin=" +
        window.location.origin

    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          ref={iframeRef}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?${embedParams}`}
          title="YouTube Live Stream"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={isOrganizer}
        />

        {/* Organizer controls overlay */}
        {isOrganizer && (
          <div className="absolute bottom-4 left-4 flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleOrganizerPlayPause}
              className="bg-black/70 text-white hover:bg-black/90"
            >
              {videoState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(event.virtualLink, "_blank")}
              className="bg-black/70 text-white hover:bg-black/90"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Shield className="w-3 h-3 mr-1" />
              Host Controls
            </Badge>
          </div>
        )}

        {/* Attendee sync status */}
        {!isOrganizer && (
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <Badge
              variant="secondary"
              className={`${
                syncStatus === "synced"
                  ? "bg-green-100 text-green-800"
                  : syncStatus === "syncing"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {syncStatus === "synced" ? "Synced with Host" : syncStatus === "syncing" ? "Syncing..." : "Sync Error"}
            </Badge>
            {videoState.currentTime > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {formatTime(videoState.currentTime)}
              </Badge>
            )}
          </div>
        )}

        {/* Invisible overlay to prevent attendee interaction */}
        {!isOrganizer && (
          <div
            className="absolute inset-0 bg-transparent cursor-default"
            style={{ pointerEvents: "auto" }}
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={(e) => e.preventDefault()}
            onClick={(e) => e.preventDefault()}
          />
        )}
      </div>
    )
  }

  const renderGenericEmbed = () => {
    if (!event.virtualLink || isYouTube) return null

    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={event.virtualLink}
          title="Live Stream"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={isOrganizer}
        />

        {!isOrganizer && (
          <div className="absolute bottom-4 right-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Live Stream
            </Badge>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    // Fetch if user has already checked in online for this event
    const fetchOnlineCheckIn = async () => {
      if (!user || !event.id) return;
      const q = query(collection(db, "tickets"), where("eventId", "==", event.id), where("attendeeUid", "==", user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const ticket = snapshot.docs[0].data() as Ticket;
        if (ticket.checkedInOnline) {
          setOnlineCheckedIn(true);
          setOnlineCheckInTime(ticket.onlineCheckInTime ? new Date(ticket.onlineCheckInTime) : null);
        }
      }
    };
    fetchOnlineCheckIn();
  }, [user, event.id]);

  const handleOnlineCheckIn = async () => {
    if (!user || !event.id) return;
    setLoading(true);
    try {
      const q = query(collection(db, "tickets"), where("eventId", "==", event.id), where("attendeeUid", "==", user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const ticketRef = doc(db, "tickets", snapshot.docs[0].id);
        await updateDoc(ticketRef, {
          checkedInOnline: true,
          onlineCheckInTime: new Date(),
        });
        setOnlineCheckedIn(true);
        setOnlineCheckInTime(new Date());
        toast({
          title: "Checked In Online!",
          description: "Your attendance has been recorded.",
        });
      } else {
        toast({
          title: "No Ticket Found",
          description: "You must have a ticket to check in online.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Access Required</h3>
          <p className="text-gray-600 mb-4">You need to register for this event to access the live stream and chat.</p>
        </CardContent>
      </Card>
    )
  }

  if (event.status !== "live") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {event.status === "upcoming" ? "Event Not Started" : "Event Ended"}
          </h3>
          <p className="text-gray-600">
            {event.status === "upcoming"
              ? "The live stream will begin when the organizer starts the event."
              : "This event has concluded. Thank you for participating!"}
          </p>
        </CardContent>
      </Card>
    )
  }

  // For meeting type events, show join button
  if (event.virtualType === "meeting") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Join Virtual Meeting</h3>
            <p className="text-gray-600 mb-6">Click the button below to join the live meeting session.</p>
          </div>
          <Button
            size="lg"
            onClick={() => window.open(event.virtualLink, "_blank")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Join Meeting
          </Button>
        </CardContent>
      </Card>
    )
  }

  // For broadcast type events, show stream with chat
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        {/* Online Check-in for Virtual Concerts */}
        {event.type === 'concert' && event.isVirtual && event.status === 'live' && user && hasAccess && !onlineCheckedIn && (
          <div className="mb-4">
            <Button onClick={handleOnlineCheckIn} disabled={loading}>
              {loading ? "Checking In..." : "Check In Online"}
            </Button>
          </div>
        )}
        {event.type === 'concert' && event.isVirtual && event.status === 'live' && user && hasAccess && onlineCheckedIn && (
          <div className="mb-4">
            <Badge className="bg-green-100 text-green-800">Checked In Online{onlineCheckInTime && ` at ${onlineCheckInTime.toLocaleTimeString()}`}</Badge>
          </div>
        )}
        {/* Video Embed */}
        {event.virtualLink && isYouTube && youtubeVideoId && (
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden mb-4">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1`}
              title="Live Stream"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}
        {/* Add other video providers as needed */}
      </div>
      {/* In-app Live Chat */}
      <div className="w-full md:w-96">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Live Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="h-64 mb-2">
              <div>
                {messages.map((msg) => (
                  <div key={msg.id} className="mb-2 flex items-start gap-2">
                    <span className="font-semibold text-blue-700">{msg.userName}</span>
                    <span className="text-gray-700">{msg.message}</span>
                    <span className="text-xs text-gray-400">{msg.timestamp.toLocaleTimeString()}</span>
                    {/* Emoji reactions */}
                    {msg.reactions && (
                      <span className="ml-2 flex gap-1">
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <Button key={emoji} size="icon" variant="ghost" onClick={() => addReaction(msg.id, emoji)}>
                            {emoji} {users.length}
                          </Button>
                        ))}
                      </span>
                    )}
                    {/* Organizer moderation */}
                    {isOrganizer && (
                      <Button size="icon" variant="ghost" onClick={() => deleteMessage(msg.id)}><Trash2 className="w-4 h-4" /></Button>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="flex gap-2 mb-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <Button key={emoji} size="icon" variant="ghost" onClick={() => { addReaction(messages[messages.length-1]?.id, emoji); setShowEmojiPicker(null); }}>{emoji}</Button>
                ))}
              </div>
            )}
            {/* Message Input */}
            <div className="flex gap-2 mt-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>Send</Button>
              <Button variant="ghost" onClick={() => setShowEmojiPicker(showEmojiPicker ? null : 'picker')}><MessageCircle /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
