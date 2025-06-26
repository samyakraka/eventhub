"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event } from "@/types";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Sparkles,
  Menu,
  X,
  Filter,
  ArrowRight,
  Play,
  Globe,
  Zap,
  Heart,
  TrendingUp,
  ChevronDown,
  Share2,
  CalendarCheck,
  MonitorPlay,
  Quote,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  TicketIcon,
} from "lucide-react";
import { format } from "date-fns";
import { AuthPage } from "../auth/AuthPage";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

interface HomePageProps {
  onAuthSuccess: () => void;
  currentUser?: User | null;
  onDashboardClick?: () => void;
}

export function HomePage({
  onAuthSuccess,
  currentUser,
  onDashboardClick,
}: HomePageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showAuth, setShowAuth] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState<"login" | "signup">(
    "login"
  );

  const router = useRouter();

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  const fetchPublicEvents = async () => {
    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "upcoming"),
        limit(12)
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

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesLocation =
      locationFilter === "all" ||
      (locationFilter === "virtual" && event.isVirtual) ||
      (locationFilter === "physical" && !event.isVirtual);

    return matchesSearch && matchesType && matchesLocation;
  });

  const featuredEvents = filteredEvents.slice(0, 3);
  const regularEvents = filteredEvents.slice(3);

  const shareEvent = async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const shareData = {
      title: event.title,
      text: `Check out this amazing event: ${event.title}`,
      url: `${window.location.origin}/events/${event.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyEventLink(event.id);
      }
    } else {
      copyEventLink(event.id);
    }
  };

  const copyEventLink = (eventId: string) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/events/${eventId}`)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "Event link copied to clipboard",
        });
      });
  };

  // Function to handle smooth scrolling to sections
  const handleScrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    console.log(`Attempting to scroll to section: ${sectionId}`);
    console.log("Section element found:", section);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-hidden relative">
      {/* Subtle background effect - Adjusted for dark theme */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none will-change-transform">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob will-change-transform"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-2000 will-change-transform"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-4000 will-change-transform"></div>
      </div>

      {/* Modern Header */}
      <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-white">EventHub</h1>
                <p className="text-sm text-gray-400 hidden md:block">
                  Where memories begin
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex items-center space-x-6">
                <a
                  href="#events"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Events
                </a>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Features
                </a>
                <button
                  onClick={() => router.push("/about")}
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  About
                </button>
              </nav>
              <div className="flex items-center space-x-3">
                {currentUser ? (
                  <>
                    <Button
                      onClick={onDashboardClick}
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Dialog open={showAuth} onOpenChange={setShowAuth}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-gray-300 hover:text-white hover:bg-gray-800 font-medium"
                          onClick={() => setActiveAuthTab("login")}
                        >
                          Sign In
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh] p-0 flex flex-col backdrop-blur-xl bg-gray-900/80 rounded-xl shadow-2xl border border-white/10 overflow-y-auto">
                        <AuthPage
                          onSuccess={() => {
                            setShowAuth(false);
                            onAuthSuccess();
                          }}
                          defaultTab={activeAuthTab}
                        />
                      </DialogContent>
                    </Dialog>
                    {/* Get Started Button - Desktop */}
                    <Button
                      onClick={() => {
                        setActiveAuthTab("signup");
                        setShowAuth(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-300 hover:text-white"
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
            <div className="md:hidden border-t border-gray-800 py-4 space-y-4">
              <nav className="space-y-3">
                <a
                  href="#events"
                  className="block text-gray-300 hover:text-white font-medium"
                >
                  Events
                </a>
                <a
                  href="#features"
                  className="block text-gray-300 hover:text-white font-medium"
                >
                  Features
                </a>
                <a
                  href="#about"
                  className="block text-gray-300 hover:text-white font-medium"
                >
                  About
                </a>
              </nav>
              <div className="space-y-3 pt-3 border-t border-gray-800">
                {currentUser ? (
                  <Button
                    onClick={onDashboardClick}
                    className="w-full text-left justify-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 shadow-lg transition-all duration-300 font-medium"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Dialog open={showAuth} onOpenChange={setShowAuth}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-300 hover:text-white"
                          onClick={() => setActiveAuthTab("login")}
                        >
                          Sign In
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh] p-0 flex flex-col bg-gray-900 border-gray-800 overflow-y-auto">
                        <AuthPage
                          onSuccess={() => {
                            setShowAuth(false);
                            setShowMobileMenu(false);
                          }}
                          defaultTab={activeAuthTab}
                        />
                      </DialogContent>
                    </Dialog>
                    {/* Get Started Button - Mobile */}
                    <Button
                      onClick={() => {
                        setActiveAuthTab("signup");
                        setShowAuth(true);
                      }}
                      className="w-full text-left justify-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 shadow-lg transition-all duration-300 font-medium"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modern Hero Section */}
      <section
        className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg')`,
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Optional Sub-heading */}
          <p className="text-lg font-medium text-gray-300 mb-4 tracking-tight drop-shadow">
            Your Event Companion
          </p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
            Create Unforgettable
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent block leading-tight">
              Events That Connect
            </span>
            People
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed tracking-tight drop-shadow">
            The complete platform for event organizers to create, manage, and
            host both physical and virtual events.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center sm:space-x-4 space-y-4 sm:space-y-0 mb-16">
            <Button
              onClick={() => {
                setActiveAuthTab("signup");
                setShowAuth(true);
              }}
              className="h-14 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium px-8 text-lg"
            >
              Start Creating Events <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button className="h-14 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 transition-all shadow-lg hover:shadow-xl px-8 text-lg flex items-center hover:scale-105 transition-transform duration-300 ease-in-out">
              <Play className="w-5 h-5 mr-2" /> Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Revamped Stats Section - visually blended with hero, just below hero */}
      <section className="relative z-10 mt-20 mb-8 flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="backdrop-blur-md bg-gradient-to-br from-white/10 via-blue-900/40 to-purple-900/60 rounded-3xl shadow-2xl border border-white/10 py-8 px-2 sm:px-8 flex flex-col items-center">
            {/* Moved heading and subtitle inside the stats block */}
            <div className="text-center w-full pt-8 pb-6">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow">
                Trusted by Thousands of Organizers
              </h3>
              <p className="text-lg text-blue-100/90 max-w-2xl mx-auto">
                Here's what we've achieved with our growing community
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
              {/* Stat 1 */}
              <div className="flex flex-col items-center group transition-all duration-500 ease-in-out">
                <div className="bg-blue-600/20 rounded-full p-3 mb-2 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-blue-400" />
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white group-hover:scale-110 group-hover:text-blue-300 transition-transform duration-300">
                  5,000+
                </span>
                <span className="text-gray-200 text-base mt-1">
                  Events Hosted
                </span>
              </div>
              {/* Stat 2 */}
              <div className="flex flex-col items-center group transition-all duration-500 ease-in-out">
                <div className="bg-purple-600/20 rounded-full p-3 mb-2 flex items-center justify-center">
                  <Users className="w-7 h-7 text-purple-400" />
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white group-hover:scale-110 group-hover:text-purple-300 transition-transform duration-300">
                  1M+
                </span>
                <span className="text-gray-200 text-base mt-1">
                  Attendees Served
                </span>
              </div>
              {/* Stat 3 - New: Tickets Sold */}
              <div className="flex flex-col items-center group transition-all duration-500 ease-in-out">
                <div className="bg-pink-600/20 rounded-full p-3 mb-2 flex items-center justify-center">
                  <TicketIcon className="w-7 h-7 text-pink-400" />
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white group-hover:scale-110 group-hover:text-pink-300 transition-transform duration-300">
                  500K+
                </span>
                <span className="text-gray-200 text-base mt-1">
                  Tickets Sold
                </span>
              </div>
              {/* Stat 4 - New: Partners & Sponsors */}
              <div className="flex flex-col items-center group transition-all duration-500 ease-in-out">
                <div className="bg-green-600/20 rounded-full p-3 mb-2 flex items-center justify-center">
                  <Star className="w-7 h-7 text-green-400" />
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white group-hover:scale-110 group-hover:text-green-300 transition-transform duration-300">
                  200+
                </span>
                <span className="text-gray-200 text-base mt-1">
                  Partners & Sponsors
                </span>
              </div>
              {/* Stat 5 */}
              <div className="flex flex-col items-center group transition-all duration-500 ease-in-out">
                <div className="bg-yellow-500/20 rounded-full p-3 mb-2 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-yellow-400" />
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white group-hover:scale-110 group-hover:text-yellow-300 transition-transform duration-300">
                  98%
                </span>
                <span className="text-gray-200 text-base mt-1">
                  Satisfaction Rate
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section
        id="features"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need for Successful Events
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our platform provides all the tools you need to create, manage,
              and host events of any size or format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-800 rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Event Creation
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Create beautiful event pages for any type of event with
                  customizable details, branding, and ticketing options.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-800 rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarCheck className="w-8 h-8 text-green-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Ticketing System
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Manage free and paid tickets with custom prices, discount
                  codes, and unique QR codes for each attendee.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-800 rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-orange-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Check-in Management
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Easily check in attendees on-site using QR code scanning or
                  manual lookup and track attendance in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-800 rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MonitorPlay className="w-8 h-8 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Live Broadcasting
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Stream your events to virtual attendees with integrated chat
                  and recording capabilities for post-event access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Host Any Type of Event Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800 text-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Host Any Type of Event
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            From intimate gatherings to massive conferences, our platform scales
            to fit your needs.
          </p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Event Type Card 1: Conferences & Seminars */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img
              src="https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg"
              alt="Conferences & Seminars"
              className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">
                Conferences & Seminars
              </h3>
              <p className="text-gray-300 text-sm">
                Professional gatherings with speakers, sessions, and networking
                opportunities.
              </p>
            </div>
          </Card>

          {/* Event Type Card 2: Concerts & Performances */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img
              src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg"
              alt="Concerts & Performances"
              className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">
                Concerts & Performances
              </h3>
              <p className="text-gray-300 text-sm">
                Music events, theater shows, and live performances of all
                genres.
              </p>
            </div>
          </Card>

          {/* Event Type Card 3: Marathons & Sports */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img
              src="https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg"
              alt="Marathons & Sports"
              className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">Marathons & Sports</h3>
              <p className="text-gray-300 text-sm">
                Running events, races, tournaments, and other sporting
                activities.
              </p>
            </div>
          </Card>

          {/* Event Type Card 4: Virtual Experiences */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img
              src="https://images.pexels.com/photos/6937870/pexels-photo-6937870.jpeg"
              alt="Virtual Experiences"
              className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">
                Virtual Experiences
              </h3>
              <p className="text-gray-300 text-sm">
                Online webinars, workshops, and digital events accessible from
                anywhere.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Enhanced Search and Filters - Discover Amazing Events (MOVED HERE) */}
      <section
        id="events"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Discover Amazing Events
            </h2>
            <p className="text-xl text-gray-400">
              Find your next unforgettable experience
            </p>
          </div>

          {/* Modern Search Bar */}
          <div className="bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-8 max-w-5xl mx-auto mb-16 border border-gray-700">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3 className="font-semibold text-white text-lg">Find Events</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 rounded-full border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Search Bar - Always Visible */}
            <div className="relative mb-10">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for concerts, galas, workshops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 border-gray-700 bg-gray-900 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl shadow-sm"
              />
            </div>

            {/* Filters - Desktop Always Visible, Mobile Collapsible */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${
                showFilters || window.innerWidth >= 1024
                  ? "block"
                  : "hidden lg:grid"
              }`}
            >
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-12 border-gray-700 bg-gray-900 text-white rounded-xl">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 text-white border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gala">Gala</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="marathon">Marathon</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-12 border-gray-700 bg-gray-900 text-white rounded-xl">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 text-white border-gray-700">
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="physical">In-Person</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-12 border-gray-700 bg-gray-900 text-white rounded-xl">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 text-white border-gray-700">
                  <SelectItem value="all">Any Date</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleScrollToSection("events")}
                className="h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 rounded-xl font-semibold"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mr-3" />
                  Featured Events
                </h3>
                <p className="text-gray-400 hidden sm:block">
                  Handpicked amazing experiences you won't want to miss
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group hover:shadow-2xl transition-all duration-500 border border-gray-700 shadow-lg overflow-hidden bg-gray-800 transform hover:-translate-y-2 cursor-pointer flex flex-col justify-between min-h-[420px] relative"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="relative">
                    {event.bannerBase64 ? (
                      <img
                        src={event.bannerBase64 || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
                        <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-sm font-semibold shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant="outline"
                        className="bg-gray-700 backdrop-blur-sm text-sm font-medium text-white border-gray-600"
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <CardContent className="flex flex-col justify-between h-full p-6 sm:p-8">
                    <div>
                      <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {event.title}
                      </h4>
                      <p className="text-gray-400 text-sm sm:text-base mb-6 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm sm:text-base text-gray-400">
                          <Calendar className="w-4 h-4 mr-3 flex-shrink-0 text-blue-400" />
                          <span className="truncate font-medium">
                            {format(event.date, "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center text-sm sm:text-base text-gray-400">
                          <Clock className="w-4 h-4 mr-3 flex-shrink-0 text-purple-400" />
                          <span className="truncate font-medium">
                            {event.time}
                          </span>
                        </div>
                        <div className="flex items-center text-sm sm:text-base text-gray-400">
                          <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-pink-400" />
                          <span className="truncate font-medium">
                            {event.isVirtual ? "Virtual Event" : event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between w-full">
                      <Badge
                        className={`text-sm font-semibold px-3 py-1 ${
                          event.ticketPrice === 0
                            ? "bg-green-700 text-white"
                            : "bg-blue-700 text-white"
                        }`}
                      >
                        {event.ticketPrice === 0
                          ? "Free Event"
                          : `$${event.ticketPrice}`}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => shareEvent(event, e)}
                          className="bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-700/50 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAuth(true);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          size="sm"
                        >
                          Register Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enhanced All Events */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                All Events
              </h3>
              <p className="text-gray-400 hidden sm:block">
                Explore all upcoming experiences
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-400 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
              <Users className="w-4 h-4 mr-2" />
              {filteredEvents.length} events available
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <Card
                  key={i}
                  className="overflow-hidden border border-gray-700 shadow-lg bg-gray-800"
                >
                  <div className="w-full h-48 sm:h-56 bg-gray-700 animate-pulse" />
                  <CardContent className="p-6 sm:p-8">
                    <div className="h-6 bg-gray-700 rounded animate-pulse mb-3" />
                    <div className="h-4 bg-gray-700 rounded animate-pulse mb-6" />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 bg-gray-700 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regularEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {regularEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group hover:shadow-xl transition-all duration-300 border border-gray-700 shadow-md overflow-hidden bg-gray-800 hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[420px] relative"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="relative">
                    {event.bannerBase64 ? (
                      <img
                        src={event.bannerBase64 || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant="outline"
                        className="bg-gray-700 backdrop-blur-sm text-sm font-medium text-white border-gray-600"
                      >
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="flex flex-col justify-between h-full p-6 sm:p-8">
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {event.title}
                      </h4>
                      <p className="text-gray-400 text-sm sm:text-base mb-6 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm sm:text-base text-gray-400">
                          <Calendar className="w-4 h-4 mr-3 flex-shrink-0 text-blue-400" />
                          <span className="truncate font-medium">
                            {format(event.date, "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center text-sm sm:text-base text-gray-400">
                          <Clock className="w-4 h-4 mr-3 flex-shrink-0 text-purple-400" />
                          <span className="truncate font-medium">
                            {event.time}
                          </span>
                        </div>
                        <div className="flex items-center text-sm sm:text-base text-gray-400">
                          <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-pink-400" />
                          <span className="truncate font-medium">
                            {event.isVirtual ? "Virtual Event" : event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between w-full">
                      <Badge
                        className={`text-sm font-semibold px-3 py-1 ${
                          event.ticketPrice === 0
                            ? "bg-green-700 text-white"
                            : "bg-blue-700 text-white"
                        }`}
                      >
                        {event.ticketPrice === 0
                          ? "Free Event"
                          : `$${event.ticketPrice}`}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => shareEvent(event, e)}
                          className="bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-700/50 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAuth(true);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          size="sm"
                        >
                          Register Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 bg-gray-800 border border-gray-700 rounded-lg p-8">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                No events found
              </h3>
              <p className="text-gray-400 text-lg mb-8">
                Try adjusting your search criteria or check back later
              </p>
              <Button
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Create Your Own Event
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* What Our Users Say Section */}
      <section className="pt-12 pb-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-400">
            Join thousands of event organizers who trust our platform
          </p>
        </div>
        <div className="flex justify-center">
          {/* Animate card entry with framer-motion (if available) or Tailwind transition */}
          <div className="max-w-5xl w-full transition-all duration-500 ease-in-out">
            <div className="bg-gray-800 border border-gray-700 shadow-xl rounded-2xl px-8 py-10 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
              {/* Decorative quotation mark */}
              <div className="absolute left-8 top-4 text-5xl text-white opacity-10 select-none hidden sm:block">
                ❝
              </div>
              {/* Profile image */}
              <div className="flex-shrink-0 mb-4 sm:mb-0">
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="User profile"
                  className="w-20 h-20 rounded-full shadow-md object-cover"
                />
              </div>
              {/* Testimonial content */}
              <div className="flex-1 text-center sm:text-left relative">
                {/* Decorative quotation mark right (for symmetry, optional) */}
                <div className="absolute right-8 top-4 text-5xl text-white opacity-10 select-none hidden sm:block">
                  ❞
                </div>
                <p className="text-lg sm:text-xl text-white font-medium mb-6 leading-relaxed">
                  "EventsHub transformed how we run our annual conference. The
                  platform is intuitive, powerful, and our attendees love the
                  experience."
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-bold text-xl">
                    S J
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-lg leading-tight">
                      Sarah Johnson
                    </p>
                    <p className="text-sm text-gray-400 leading-tight">
                      Event Director, TechCorp
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Carousel navigation and dots remain unchanged */}
        <div className="flex justify-center mt-8 space-x-2">
          <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
          <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
          <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
        </div>
      </section>

      {/* Ready to Host Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 to-purple-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight drop-shadow-md">
            Ready to Host Your Next Amazing Event?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed opacity-90">
            Join thousands of event organizers who trust our platform for
            everything from small meetups to global conferences.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => {
                setActiveAuthTab("signup");
                setShowAuth(true);
              }}
              size="lg"
              className="h-14 rounded-xl bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg px-8"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-xl border-2 border-white text-white bg-transparent hover:bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg px-8"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
            <div className="col-span-full md:col-span-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-white">EventHub</h3>
              </div>
              <p className="text-gray-400 mb-6">
                The complete platform for event organizers to create, manage,
                and host both physical and virtual events with powerful
                ticketing, check-in, and live streaming features.
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <a
                  href="https://www.facebook.com/eventhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href="https://twitter.com/eventhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                </a>
                <a
                  href="https://www.instagram.com/eventhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a
                  href="https://www.linkedin.com/company/eventhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-white mb-4">
                Platform
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleScrollToSection("events")}
                    className="hover:text-white transition-colors"
                  >
                    Find Events
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (currentUser) {
                        router.push("/create-event");
                      } else {
                        setActiveAuthTab("signup");
                        setShowAuth(true);
                      }
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Create an Event
                  </button>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollToSection("features")}
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <Link
                    href="/virtual-events"
                    className="hover:text-white transition-colors"
                  >
                    Virtual Events
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 mt-8 text-center text-sm">
            <p className="mb-2">&copy; 2025 EventHub. All rights reserved.</p>
            <a
              href="mailto:support@eventshub.com"
              className="flex items-center justify-center hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              <span>support@eventshub.com</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
