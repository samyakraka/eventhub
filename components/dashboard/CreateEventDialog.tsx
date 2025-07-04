"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Percent,
  Shield,
} from "lucide-react";
import { FormBuilder } from "./FormBuilder";
import type { CustomForm, GalaTable, GalaAuctionItem, GalaInvitee, GalaPerformer, GalaProgramItem, RaceCategory, ConcertPerformer, ConcertTicketType, Section, StandingSection, Seat } from "@/types";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onEventCreated,
}: CreateEventDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    location: "",
    virtualLink: "",
    virtualType: "meeting",
    startDate: "",
    endDate: "",
    time: "",
    endTime: "",
    themeColor: "#3B82F6",
    ticketPrice: 0,
    maxAttendees: "",
    isVirtual: false,
    requiresCheckIn: true, // Default to true for all events
    logoBase64: "",
    bannerBase64: "",
    discountEnabled: false,
    discountPercentage: 10,
  });
  const [galaTables, setGalaTables] = useState<GalaTable[]>([]);
  const [galaAuctionItems, setGalaAuctionItems] = useState<GalaAuctionItem[]>([]);
  const [galaDonationGoal, setGalaDonationGoal] = useState('');
  const [galaInvitees, setGalaInvitees] = useState<GalaInvitee[]>([]);
  const [galaPerformers, setGalaPerformers] = useState<GalaPerformer[]>([]);
  const [galaProgram, setGalaProgram] = useState<GalaProgramItem[]>([]);
  const [raceCategories, setRaceCategories] = useState<RaceCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDistance, setNewCategoryDistance] = useState('');
  const [newCategoryStartTime, setNewCategoryStartTime] = useState('');
  const [routeMapUrl, setRouteMapUrl] = useState('');
  const [marathonSchedule, setMarathonSchedule] = useState<{ time: string; title: string; description?: string }[]>([]);
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleDesc, setNewScheduleDesc] = useState('');

  // Gala table form state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableHost, setNewTableHost] = useState('');
  const [newTableGuests, setNewTableGuests] = useState('');

  // Gala auction item form state
  const [newAuctionName, setNewAuctionName] = useState('');
  const [newAuctionDesc, setNewAuctionDesc] = useState('');
  const [newAuctionStartBid, setNewAuctionStartBid] = useState('');

  // Invitee form state
  const [newInviteeName, setNewInviteeName] = useState('');
  const [newInviteeEmail, setNewInviteeEmail] = useState('');
  const [newInviteeVIP, setNewInviteeVIP] = useState(false);

  // Performer form state
  const [newPerformerName, setNewPerformerName] = useState('');
  const [newPerformerRole, setNewPerformerRole] = useState('');
  const [newPerformerBio, setNewPerformerBio] = useState('');
  const [newPerformerPhoto, setNewPerformerPhoto] = useState('');

  // Program form state
  const [newProgramTime, setNewProgramTime] = useState('');
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDesc, setNewProgramDesc] = useState('');

  // Concert-specific state
  const [performerLineup, setPerformerLineup] = useState<ConcertPerformer[]>([]);
  const [newPerformer, setNewPerformer] = useState({ name: '', bio: '', photoUrl: '', setTime: '', socialLinks: [{ platform: '', url: '' }] });
  const [concertSchedule, setConcertSchedule] = useState<{ time: string; title: string; description?: string }[]>([]);
  const [ticketTypes, setTicketTypes] = useState<ConcertTicketType[]>([]);
  const [newTicketType, setNewTicketType] = useState({ name: '', price: '', description: '', quantity: '' });
  const [seatMap, setSeatMap] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSeatLabel, setNewSeatLabel] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [standingSections, setStandingSections] = useState<StandingSection[]>([]);
  const [newStandingName, setNewStandingName] = useState('');
  const [newStandingCapacity, setNewStandingCapacity] = useState('');

  const steps = [
    { id: 1, title: "Basic Info", icon: Calendar },
    { id: 2, title: "Location & Time", icon: MapPin },
    { id: 3, title: "Images", icon: Upload },
    { id: 4, title: "Pricing & Access", icon: DollarSign },
    { id: 5, title: "Registration Form", icon: Users },
    { id: 6, title: "Preview", icon: Users },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (
    field: "logoBase64" | "bannerBase64",
    file: File
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        [field]: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (field: "logoBase64" | "bannerBase64") => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFormSave = (form: CustomForm) => {
    setCustomForm(form);
    toast({
      title: "Form Saved",
      description: "Your custom registration form has been saved.",
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const eventData: any = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        ticketPrice: Number(formData.ticketPrice),
        maxAttendees: formData.maxAttendees
          ? Number(formData.maxAttendees)
          : null,
        discountPercentage: formData.discountEnabled
          ? Number(formData.discountPercentage)
          : null,
        organizerUid: user.uid,
        status: "upcoming",
        createdAt: new Date(),
      };
      // Add Marathon fields if type is marathon
      if (formData.type === 'marathon') {
        eventData.raceCategories = raceCategories;
        eventData.routeMapUrl = routeMapUrl;
        eventData.schedule = marathonSchedule;
      }
      // Add Gala fields if type is gala
      if (formData.type === 'gala') {
        eventData.tables = galaTables;
        eventData.auctionItems = galaAuctionItems;
        eventData.donationGoal = galaDonationGoal ? Number(galaDonationGoal) : undefined;
        eventData.invitees = galaInvitees;
        eventData.performers = galaPerformers;
        eventData.programSchedule = galaProgram;
      }
      // Add Concert fields if type is concert
      if (formData.type === 'concert') {
        eventData.performerLineup = performerLineup;
        eventData.concertSchedule = concertSchedule;
        eventData.ticketTypes = ticketTypes.map(t => ({ ...t, price: Number(t.price), quantity: t.quantity ? Number(t.quantity) : undefined }));
        eventData.seatMap = seatMap;
        eventData.standingSections = standingSections;
      }

      const eventRef = await addDoc(collection(db, "events"), eventData);

      // Save custom form if created
      if (customForm) {
        const formToSave = {
          ...customForm,
          eventId: eventRef.id,
          updatedAt: new Date(),
        };
        await addDoc(collection(db, "customForms"), formToSave);
      }

      toast({
        title: "Event Created Successfully!",
        description: "Your event has been created and is now live.",
      });

      onEventCreated();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setCustomForm(null);
    setFormData({
      title: "",
      description: "",
      type: "",
      location: "",
      virtualLink: "",
      virtualType: "meeting",
      startDate: "",
      endDate: "",
      time: "",
      endTime: "",
      themeColor: "#3B82F6",
      ticketPrice: 0,
      maxAttendees: "",
      isVirtual: false,
      requiresCheckIn: true,
      logoBase64: "",
      bannerBase64: "",
      discountEnabled: false,
      discountPercentage: 10,
    });
    setGalaTables([]);
    setGalaAuctionItems([]);
    setGalaDonationGoal('');
    setGalaInvitees([]);
    setGalaPerformers([]);
    setGalaProgram([]);
    setNewTableNumber('');
    setNewTableHost('');
    setNewTableGuests('');
    setNewAuctionName('');
    setNewAuctionDesc('');
    setNewAuctionStartBid('');
    setNewInviteeName('');
    setNewInviteeEmail('');
    setNewInviteeVIP(false);
    setNewPerformerName('');
    setNewPerformerRole('');
    setNewPerformerBio('');
    setNewPerformerPhoto('');
    setNewProgramTime('');
    setNewProgramTitle('');
    setNewProgramDesc('');
    setRaceCategories([]);
    setNewCategoryName('');
    setNewCategoryDistance('');
    setNewCategoryStartTime('');
    setRouteMapUrl('');
    setMarathonSchedule([]);
    setNewScheduleTime('');
    setNewScheduleTitle('');
    setNewScheduleDesc('');
    setPerformerLineup([]);
    setNewPerformer({ name: '', bio: '', photoUrl: '', setTime: '', socialLinks: [{ platform: '', url: '' }] });
    setConcertSchedule([]);
    setTicketTypes([]);
    setNewTicketType({ name: '', price: '', description: '', quantity: '' });
    setSeatMap([]);
    setNewSectionName('');
    setNewSeatLabel('');
    setSelectedSectionId('');
    setStandingSections([]);
    setNewStandingName('');
    setNewStandingCapacity('');
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.type;
      case 2:
        return (
          formData.startDate &&
          formData.endDate &&
          formData.time &&
          formData.endTime &&
          (formData.isVirtual || formData.location)
        );
      case 3:
        return true; // Images are optional
      case 4:
        return true; // Pricing is optional
      case 5:
        return true; // Registration form is optional
      default:
        return true;
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Gala table handlers
  const addTable = () => {
    if (!newTableNumber) return;
    const table: GalaTable = {
      tableNumber: parseInt(newTableNumber, 10),
      host: newTableHost,
      guests: newTableGuests.split(',').map((g) => g.trim()).filter(Boolean),
    };
    setGalaTables((prev) => [...prev, table]);
    setNewTableNumber('');
    setNewTableHost('');
    setNewTableGuests('');
  };
  const removeTable = (tableNumber: number) => {
    setGalaTables((prev) => prev.filter((t) => t.tableNumber !== tableNumber));
  };

  // Gala auction item handlers
  const addAuctionItem = () => {
    if (!newAuctionName || !newAuctionStartBid) return;
    const item: GalaAuctionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAuctionName,
      description: newAuctionDesc,
      startingBid: parseFloat(newAuctionStartBid),
      currentBid: parseFloat(newAuctionStartBid),
      highestBidder: '',
    };
    setGalaAuctionItems((prev) => [...prev, item]);
    setNewAuctionName('');
    setNewAuctionDesc('');
    setNewAuctionStartBid('');
  };
  const removeAuctionItem = (id: string) => {
    setGalaAuctionItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Invitee handlers
  const addInvitee = () => {
    if (!newInviteeName || !newInviteeEmail) return;
    setGalaInvitees((prev) => [...prev, { name: newInviteeName, email: newInviteeEmail, isVIP: newInviteeVIP }]);
    setNewInviteeName('');
    setNewInviteeEmail('');
    setNewInviteeVIP(false);
  };
  const removeInvitee = (email: string) => {
    setGalaInvitees((prev) => prev.filter((i) => i.email !== email));
  };

  // Performer handlers
  const addPerformer = () => {
    if (!newPerformer.name) return;
    setPerformerLineup(prev => [...prev, { ...newPerformer, id: `${Date.now()}-${Math.random()}` }]);
    setNewPerformer({ name: '', bio: '', photoUrl: '', setTime: '', socialLinks: [{ platform: '', url: '' }] });
  };
  const removePerformer = (id: string) => {
    setPerformerLineup(prev => prev.filter(p => p.id !== id));
  };
  const updatePerformerSocialLink = (idx: number, field: 'platform' | 'url', value: string) => {
    setNewPerformer(prev => {
      const links = [...prev.socialLinks];
      const link = { ...links[idx] } as { platform: string; url: string };
      link[field] = value;
      links[idx] = link;
      return { ...prev, socialLinks: links };
    });
  };
  const addPerformerSocialLink = () => {
    setNewPerformer(prev => ({ ...prev, socialLinks: [...prev.socialLinks, { platform: '', url: '' }] }));
  };
  const removePerformerSocialLink = (idx: number) => {
    setNewPerformer(prev => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== idx) }));
  };

  // Program handlers
  const addProgramItem = () => {
    if (!newProgramTime || !newProgramTitle) return;
    setGalaProgram((prev) => [...prev, { time: newProgramTime, title: newProgramTitle, description: newProgramDesc }]);
    setNewProgramTime('');
    setNewProgramTitle('');
    setNewProgramDesc('');
  };
  const removeProgramItem = (title: string) => {
    setGalaProgram((prev) => prev.filter((p) => p.title !== title));
  };

  // Race category handlers
  const addRaceCategory = () => {
    if (!newCategoryName || !newCategoryDistance || !newCategoryStartTime) return;
    setRaceCategories((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        name: newCategoryName,
        distanceKm: Number(newCategoryDistance),
        startTime: newCategoryStartTime,
      },
    ]);
    setNewCategoryName('');
    setNewCategoryDistance('');
    setNewCategoryStartTime('');
  };
  const removeRaceCategory = (id: string) => {
    setRaceCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  // Schedule handlers
  const addScheduleItem = () => {
    if (!newScheduleTime || !newScheduleTitle) return;
    setConcertSchedule(prev => [...prev, { time: newScheduleTime, title: newScheduleTitle, description: newScheduleDesc }]);
    setNewScheduleTime('');
    setNewScheduleTitle('');
    setNewScheduleDesc('');
  };
  const removeScheduleItem = (title: string) => {
    setConcertSchedule(prev => prev.filter(item => item.title !== title));
  };

  // Ticket type handlers
  const addTicketType = () => {
    if (!newTicketType.name || !newTicketType.price) return;
    const ticket: ConcertTicketType = {
      id: `${Date.now()}-${Math.random()}`,
      name: newTicketType.name,
      price: Number(newTicketType.price),
      description: newTicketType.description,
      quantity: newTicketType.quantity ? Number(newTicketType.quantity) : undefined,
    };
    setTicketTypes(prev => [...prev, ticket]);
    setNewTicketType({ name: '', price: '', description: '', quantity: '' });
  };
  const removeTicketType = (id: string) => {
    setTicketTypes(prev => prev.filter(t => t.id !== id));
  };

  // Section/Seat handlers
  const addSection = () => {
    if (!newSectionName) return;
    setSeatMap(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, name: newSectionName, seats: [] }]);
    setNewSectionName('');
  };
  const removeSection = (id: string) => {
    setSeatMap(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId('');
  };
  const addSeat = () => {
    if (!selectedSectionId || !newSeatLabel) return;
    setSeatMap(prev => prev.map(s => s.id === selectedSectionId ? { ...s, seats: [...s.seats, { id: `${Date.now()}-${Math.random()}`, label: newSeatLabel, sectionId: s.id, isAvailable: true }] } : s));
    setNewSeatLabel('');
  };
  const removeSeat = (sectionId: string, seatId: string) => {
    setSeatMap(prev => prev.map(s => s.id === sectionId ? { ...s, seats: s.seats.filter(seat => seat.id !== seatId) } : s));
  };

  // Standing section handlers
  const addStandingSection = () => {
    if (!newStandingName || !newStandingCapacity) return;
    setStandingSections(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, name: newStandingName, capacity: Number(newStandingCapacity), ticketsSold: 0 }]);
    setNewStandingName('');
    setNewStandingCapacity('');
  };
  const removeStandingSection = (id: string) => {
    setStandingSections(prev => prev.filter(s => s.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Event</DialogTitle>
          <DialogDescription>
            Follow the steps to create your amazing event
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.id ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-semibold">
                  Event Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter your event title"
                  className="mt-2 h-12"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-base font-semibold"
                >
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe your event..."
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-base font-semibold">
                  Event Type *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger className="mt-2 h-12">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gala">Gala</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="marathon">Marathon</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="themeColor" className="text-base font-semibold">
                  Theme Color
                </Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Input
                    id="themeColor"
                    type="color"
                    value={formData.themeColor}
                    onChange={(e) =>
                      handleInputChange("themeColor", e.target.value)
                    }
                    className="w-20 h-12"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.themeColor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Switch
                  id="isVirtual"
                  checked={formData.isVirtual}
                  onCheckedChange={(checked) =>
                    handleInputChange("isVirtual", checked)
                  }
                />
                <Label htmlFor="isVirtual" className="text-base font-semibold">
                  Virtual Event
                </Label>
              </div>

              {formData.isVirtual ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">
                      Virtual Event Type
                    </Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.virtualType === "meeting"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() =>
                          handleInputChange("virtualType", "meeting")
                        }
                      >
                        <h4 className="font-medium">Meeting Link</h4>
                        <p className="text-sm text-gray-600">
                          Zoom, Teams, or other meeting platform
                        </p>
                      </div>
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.virtualType === "broadcast"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() =>
                          handleInputChange("virtualType", "broadcast")
                        }
                      >
                        <h4 className="font-medium">Live Broadcast</h4>
                        <p className="text-sm text-gray-600">
                          YouTube, website, or streaming platform
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="virtualLink"
                      className="text-base font-semibold"
                    >
                      {formData.virtualType === "meeting"
                        ? "Meeting Link"
                        : "Broadcast URL"}
                    </Label>
                    <Input
                      id="virtualLink"
                      type="url"
                      value={formData.virtualLink}
                      onChange={(e) =>
                        handleInputChange("virtualLink", e.target.value)
                      }
                      placeholder={
                        formData.virtualType === "meeting"
                          ? "https://zoom.us/j/..."
                          : "https://youtube.com/watch?v=..."
                      }
                      className="mt-2 h-12"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="location" className="text-base font-semibold">
                    Location *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="Enter event location"
                    className="mt-2 h-12"
                    required={!formData.isVirtual}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label
                    htmlFor="startDate"
                    className="text-base font-semibold"
                  >
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    className="mt-2 h-12"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" className="text-base font-semibold">
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    className="mt-2 h-12"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time" className="text-base font-semibold">
                    Start Time *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className="mt-2 h-12"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endTime" className="text-base font-semibold">
                    End Time *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      handleInputChange("endTime", e.target.value)
                    }
                    className="mt-2 h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="maxAttendees"
                  className="text-base font-semibold"
                >
                  Maximum Attendees (optional)
                </Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={(e) =>
                    handleInputChange("maxAttendees", e.target.value)
                  }
                  placeholder="Leave empty for unlimited"
                  className="mt-2 h-12"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Event Logo</Label>
                <div className="mt-2">
                  {formData.logoBase64 ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.logoBase64 || "/placeholder.svg"}
                        alt="Event logo"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => removeImage("logoBase64")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Upload event logo</p>
                      <p className="text-sm text-gray-500 mb-4">
                        PNG, JPG up to 5MB
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload("logoBase64", file);
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>Choose File</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Event Banner</Label>
                <div className="mt-2">
                  {formData.bannerBase64 ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.bannerBase64 || "/placeholder.svg"}
                        alt="Event banner"
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => removeImage("bannerBase64")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Upload event banner</p>
                      <p className="text-sm text-gray-500 mb-4">
                        PNG, JPG up to 5MB (recommended: 1200x600)
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload("bannerBase64", file);
                        }}
                        className="hidden"
                        id="banner-upload"
                      />
                      <Label htmlFor="banner-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>Choose File</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="ticketPrice"
                  className="text-base font-semibold"
                >
                  Ticket Price ($)
                </Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.ticketPrice}
                  onChange={(e) =>
                    handleInputChange("ticketPrice", e.target.value)
                  }
                  placeholder="0.00"
                  className="mt-2 h-12"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set to 0 for free events
                </p>
              </div>

              {/* Check-in Requirement */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="requiresCheckIn"
                    checked={formData.requiresCheckIn}
                    onCheckedChange={(checked) =>
                      handleInputChange("requiresCheckIn", checked)
                    }
                  />
                  <Label
                    htmlFor="requiresCheckIn"
                    className="text-base font-semibold flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Require Check-in for Access
                  </Label>
                </div>
                <p className="text-sm text-orange-700 mb-2">
                  {formData.requiresCheckIn
                    ? formData.isVirtual
                      ? "Attendees must be checked in by an organizer before accessing the virtual event content."
                      : "Attendees must be checked in at the venue before accessing event content."
                    : "Attendees can access event content immediately after registration."}
                </p>
                {formData.requiresCheckIn && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-orange-800">
                      Security Benefits:
                    </p>
                    <ul className="text-sm text-orange-700 mt-1 list-disc list-inside">
                      <li>Prevents unauthorized access</li>
                      <li>Ensures only verified attendees participate</li>
                      <li>Provides accurate attendance tracking</li>
                      <li>Enables better event management</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Discount Codes */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="discountEnabled"
                    checked={formData.discountEnabled}
                    onCheckedChange={(checked) =>
                      handleInputChange("discountEnabled", checked)
                    }
                  />
                  <Label
                    htmlFor="discountEnabled"
                    className="text-base font-semibold"
                  >
                    Enable Discount Codes
                  </Label>
                </div>

                {formData.discountEnabled && (
                  <div>
                    <Label
                      htmlFor="discountPercentage"
                      className="text-base font-semibold"
                    >
                      Discount Percentage
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.discountPercentage}
                        onChange={(e) =>
                          handleInputChange(
                            "discountPercentage",
                            e.target.value
                          )
                        }
                        className="h-12"
                      />
                      <Percent className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      You can create discount codes that give{" "}
                      {formData.discountPercentage}% off the ticket price
                    </p>
                    {formData.ticketPrice > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm">
                          <strong>Original Price:</strong> $
                          {formData.ticketPrice}
                        </p>
                        <p className="text-sm">
                          <strong>Discounted Price:</strong> $
                          {(
                            formData.ticketPrice *
                            (1 - formData.discountPercentage / 100)
                          ).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Custom Registration Form
                </h3>
                <p className="text-gray-600">
                  Create a custom registration form for your event. This is
                  optional – if you don't create one, attendees will use the
                  default form.
                </p>
              </div>
              {customForm ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">
                          Custom Form Created
                        </h4>
                        <p className="text-sm text-green-700">
                          "{customForm.title}" with {customForm.fields.length}{" "}
                          field{customForm.fields.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomForm(null)}
                      >
                        Remove Form
                      </Button>
                    </div>
                  </div>
                  <div className="text-center">
                    <Button variant="outline" onClick={nextStep}>
                      Continue to Preview
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(5.5)}
                    >
                      Edit Custom Form
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-center">
                      <h4 className="font-medium text-blue-900 mb-2">
                        No Custom Form
                      </h4>
                      <p className="text-sm text-blue-700 mb-4">
                        Attendees will use the default registration form with
                        basic fields.
                      </p>
                      <Button
                        onClick={() => setCurrentStep(5.5)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create Custom Form
                      </Button>
                    </div>
                  </div>
                  <div className="text-center">
                    <Button variant="outline" onClick={nextStep}>
                      Skip & Continue to Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 5.5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Form Builder
                </h3>
                <p className="text-gray-600">
                  Drag and drop fields to create your custom registration form.
                </p>
              </div>
              <FormBuilder
                eventId="temp"
                onSave={handleFormSave}
                initialForm={customForm}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(5)}>
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(6)}
                  disabled={!customForm}
                >
                  Continue to Preview
                </Button>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {formData.logoBase64 && (
                      <img
                        src={formData.logoBase64 || "/placeholder.svg"}
                        alt="Logo"
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <span>{formData.title}</span>
                    <Badge variant="outline">{formData.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.bannerBase64 && (
                    <img
                      src={formData.bannerBase64 || "/placeholder.svg"}
                      alt="Banner"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <p className="text-gray-600 mb-4">{formData.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>
                        {formData.startDate} - {formData.endDate}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>
                        {formData.time} - {formData.endTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>
                        {formData.isVirtual
                          ? "Virtual Event"
                          : formData.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>
                        {formData.ticketPrice === 0
                          ? "Free"
                          : `$${formData.ticketPrice}`}
                      </span>
                    </div>
                  </div>
                  {/* Access Requirements */}
                  <div className="mt-4 space-y-2">
                    {formData.requiresCheckIn && (
                      <div className="p-3 bg-orange-50 rounded">
                        <p className="text-sm font-medium text-orange-800 flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Check-in Required for Access
                        </p>
                      </div>
                    )}
                    {formData.discountEnabled && (
                      <div className="p-3 bg-purple-50 rounded">
                        <p className="text-sm font-medium text-purple-800">
                          Discount Codes Enabled: {formData.discountPercentage}%
                          off
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Custom Form Summary */}
                  <div className="mt-6">
                    <Label className="text-sm font-medium text-gray-600">
                      Registration Form
                    </Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      {customForm ? (
                        <>
                          <p className="font-medium">{customForm.title}</p>
                          <p className="text-sm text-gray-600">
                            {customForm.fields.length} field
                            {customForm.fields.length !== 1 ? "s" : ""}{" "}
                            configured
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Default registration form will be used.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gala-specific fields */}
          {formData.type === 'gala' && (
            <div className="space-y-6 mt-6">
              <h3 className="text-lg font-bold">Gala Event Setup</h3>
              {/* Tables */}
              <div>
                <h4 className="font-semibold mb-2">Tables</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Table Number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    type="number"
                    min={1}
                  />
                  <Input
                    placeholder="Host Name"
                    value={newTableHost}
                    onChange={(e) => setNewTableHost(e.target.value)}
                  />
                  <Input
                    placeholder="Guests (comma separated)"
                    value={newTableGuests}
                    onChange={(e) => setNewTableGuests(e.target.value)}
                  />
                  <Button onClick={addTable}>Add Table</Button>
                </div>
                <ul>
                  {galaTables.map((table) => (
                    <li key={table.tableNumber} className="mb-1 flex items-center gap-2">
                      <span>Table {table.tableNumber} (Host: {table.host || 'N/A'}) - Guests: {table.guests.join(', ')}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeTable(table.tableNumber)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Auction Items */}
              <div>
                <h4 className="font-semibold mb-2">Auction Items</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Item Name"
                    value={newAuctionName}
                    onChange={(e) => setNewAuctionName(e.target.value)}
                  />
                  <Input
                    placeholder="Description"
                    value={newAuctionDesc}
                    onChange={(e) => setNewAuctionDesc(e.target.value)}
                  />
                  <Input
                    placeholder="Starting Bid"
                    value={newAuctionStartBid}
                    onChange={(e) => setNewAuctionStartBid(e.target.value)}
                    type="number"
                    min={0}
                  />
                  <Button onClick={addAuctionItem}>Add Item</Button>
                </div>
                <ul>
                  {galaAuctionItems.map((item) => (
                    <li key={item.id} className="mb-1 flex items-center gap-2">
                      <span>{item.name} (${item.startingBid}) - {item.description}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeAuctionItem(item.id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Donation Goal */}
              <div>
                <h4 className="font-semibold mb-2">Donation Goal</h4>
                <Input
                  placeholder="Donation Goal"
                  value={galaDonationGoal}
                  onChange={(e) => setGalaDonationGoal(e.target.value)}
                  type="number"
                  min={0}
                />
              </div>
              {/* Invitees */}
              <div>
                <h4 className="font-semibold mb-2">Invitees</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Name"
                    value={newInviteeName}
                    onChange={(e) => setNewInviteeName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={newInviteeEmail}
                    onChange={(e) => setNewInviteeEmail(e.target.value)}
                  />
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={newInviteeVIP} onChange={(e) => setNewInviteeVIP(e.target.checked)} /> VIP
                  </label>
                  <Button onClick={addInvitee}>Add Invitee</Button>
                </div>
                <ul>
                  {galaInvitees.map((invitee) => (
                    <li key={invitee.email} className="mb-1 flex items-center gap-2">
                      <span>{invitee.name} ({invitee.email}) {invitee.isVIP && <span className="text-yellow-600 font-bold">VIP</span>}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeInvitee(invitee.email)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Performers/Speakers */}
              <div>
                <h4 className="font-semibold mb-2">Performers / Speakers</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Name"
                    value={newPerformerName}
                    onChange={(e) => setNewPerformerName(e.target.value)}
                  />
                  <Input
                    placeholder="Role (e.g., Speaker, Musician)"
                    value={newPerformerRole}
                    onChange={(e) => setNewPerformerRole(e.target.value)}
                  />
                  <Input
                    placeholder="Bio"
                    value={newPerformerBio}
                    onChange={(e) => setNewPerformerBio(e.target.value)}
                  />
                  <Input
                    placeholder="Photo URL"
                    value={newPerformerPhoto}
                    onChange={(e) => setNewPerformerPhoto(e.target.value)}
                  />
                  <Button onClick={addPerformer}>Add Performer</Button>
                </div>
                <ul>
                  {galaPerformers.map((p) => (
                    <li key={p.name} className="mb-1 flex items-center gap-2">
                      <span>{p.name} ({p.role})</span>
                      <Button size="sm" variant="destructive" onClick={() => removePerformer(p.name)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Program Schedule */}
              <div>
                <h4 className="font-semibold mb-2">Program Schedule</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Time (e.g., 19:00)"
                    value={newProgramTime}
                    onChange={(e) => setNewProgramTime(e.target.value)}
                  />
                  <Input
                    placeholder="Title"
                    value={newProgramTitle}
                    onChange={(e) => setNewProgramTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Description"
                    value={newProgramDesc}
                    onChange={(e) => setNewProgramDesc(e.target.value)}
                  />
                  <Button onClick={addProgramItem}>Add Item</Button>
                </div>
                <ul>
                  {galaProgram.map((item) => (
                    <li key={item.title} className="mb-1 flex items-center gap-2">
                      <span>{item.time} - {item.title}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeProgramItem(item.title)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Marathon-specific fields */}
          {formData.type === 'marathon' && (
            <div className="space-y-6 mt-6">
              {/* Race Categories */}
              <div>
                <h4 className="font-semibold mb-2">Race Categories</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Category Name (e.g., Full Marathon)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Input
                    placeholder="Distance (km)"
                    type="number"
                    value={newCategoryDistance}
                    onChange={(e) => setNewCategoryDistance(e.target.value)}
                  />
                  <Input
                    placeholder="Start Time (e.g., 06:00)"
                    value={newCategoryStartTime}
                    onChange={(e) => setNewCategoryStartTime(e.target.value)}
                  />
                  <Button onClick={addRaceCategory}>Add Category</Button>
                </div>
                <ul>
                  {raceCategories.map((cat) => (
                    <li key={cat.id} className="mb-1 flex items-center gap-2">
                      <span>{cat.name} - {cat.distanceKm}km (Start: {cat.startTime})</span>
                      <Button size="sm" variant="destructive" onClick={() => removeRaceCategory(cat.id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Route Map */}
              <div>
                <h4 className="font-semibold mb-2">Route Map</h4>
                <Input
                  placeholder="Route Map Image URL or Google Maps Link"
                  value={routeMapUrl}
                  onChange={(e) => setRouteMapUrl(e.target.value)}
                />
                {routeMapUrl && (
                  <div className="mt-2">
                    <img src={routeMapUrl} alt="Route Map" className="max-w-xs rounded border" />
                  </div>
                )}
              </div>
              {/* Event Schedule */}
              <div>
                <h4 className="font-semibold mb-2">Event Schedule</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Time (e.g., 05:30)"
                    value={newScheduleTime}
                    onChange={(e) => setNewScheduleTime(e.target.value)}
                  />
                  <Input
                    placeholder="Title"
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Description"
                    value={newScheduleDesc}
                    onChange={(e) => setNewScheduleDesc(e.target.value)}
                  />
                  <Button onClick={addScheduleItem}>Add Item</Button>
                </div>
                <ul>
                  {marathonSchedule.map((item) => (
                    <li key={item.title} className="mb-1 flex items-center gap-2">
                      <span>{item.time} - {item.title}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeScheduleItem(item.title)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Concert-specific fields */}
          {formData.type === 'concert' && (
            <div className="space-y-6 mt-6">
              {/* Performer Lineup */}
              <div>
                <h4 className="font-semibold mb-2">Performer Lineup</h4>
                <div className="flex flex-col gap-2 mb-2">
                  <Input placeholder="Name" value={newPerformer.name} onChange={e => setNewPerformer(prev => ({ ...prev, name: e.target.value }))} />
                  <Input placeholder="Bio" value={newPerformer.bio} onChange={e => setNewPerformer(prev => ({ ...prev, bio: e.target.value }))} />
                  <Input placeholder="Photo URL" value={newPerformer.photoUrl} onChange={e => setNewPerformer(prev => ({ ...prev, photoUrl: e.target.value }))} />
                  <Input placeholder="Set Time (e.g., 20:00)" value={newPerformer.setTime} onChange={e => setNewPerformer(prev => ({ ...prev, setTime: e.target.value }))} />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium">Social Links</span>
                    {newPerformer.socialLinks.map((link, idx) => (
                      <div key={idx} className="flex gap-2 mb-1">
                        <Input placeholder="Platform" value={link.platform} onChange={e => updatePerformerSocialLink(idx, 'platform', e.target.value)} />
                        <Input placeholder="URL" value={link.url} onChange={e => updatePerformerSocialLink(idx, 'url', e.target.value)} />
                        <Button size="sm" variant="destructive" onClick={() => removePerformerSocialLink(idx)}>Remove</Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={addPerformerSocialLink}>Add Social Link</Button>
                  </div>
                  <Button onClick={addPerformer}>Add Performer</Button>
                </div>
                <ul>
                  {performerLineup.map(p => (
                    <li key={p.id} className="mb-1 flex items-center gap-2">
                      <span>{p.name} {p.setTime && <span className="text-xs text-gray-500">({p.setTime})</span>}</span>
                      <Button size="sm" variant="destructive" onClick={() => removePerformer(p.id)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Concert Schedule */}
              <div>
                <h4 className="font-semibold mb-2">Concert Schedule</h4>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Time (e.g., 19:00)" value={newScheduleTime} onChange={e => setNewScheduleTime(e.target.value)} />
                  <Input placeholder="Title" value={newScheduleTitle} onChange={e => setNewScheduleTitle(e.target.value)} />
                  <Input placeholder="Description" value={newScheduleDesc} onChange={e => setNewScheduleDesc(e.target.value)} />
                  <Button onClick={addScheduleItem}>Add Item</Button>
                </div>
                <ul>
                  {concertSchedule.map(item => (
                    <li key={item.title} className="mb-1 flex items-center gap-2">
                      <span>{item.time} - {item.title}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeScheduleItem(item.title)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Ticket Types */}
              <div>
                <h4 className="font-semibold mb-2">Ticket Types</h4>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Type Name (e.g., VIP)" value={newTicketType.name} onChange={e => setNewTicketType(prev => ({ ...prev, name: e.target.value }))} />
                  <Input placeholder="Price" type="number" value={newTicketType.price} onChange={e => setNewTicketType(prev => ({ ...prev, price: e.target.value }))} />
                  <Input placeholder="Description" value={newTicketType.description} onChange={e => setNewTicketType(prev => ({ ...prev, description: e.target.value }))} />
                  <Input placeholder="Quantity" type="number" value={newTicketType.quantity} onChange={e => setNewTicketType(prev => ({ ...prev, quantity: e.target.value }))} />
                  <Button onClick={addTicketType}>Add Ticket Type</Button>
                </div>
                <ul>
                  {ticketTypes.map(t => (
                    <li key={t.id} className="mb-1 flex items-center gap-2">
                      <span>{t.name} - ${t.price} {t.quantity && <span className="text-xs text-gray-500">({t.quantity} available)</span>}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeTicketType(t.id)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Seat Map (Sitting Sections) */}
              <div className="space-y-2">
                <h4 className="font-semibold mb-2">Seat Map (Sitting Sections)</h4>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Section Name (e.g., Orchestra)" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} />
                  <Button onClick={addSection}>Add Section</Button>
                </div>
                <ul>
                  {seatMap.map(section => (
                    <li key={section.id} className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{section.name}</span>
                        <Button size="sm" variant="destructive" onClick={() => removeSection(section.id)}>Remove</Button>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Input placeholder="Seat Label (e.g., A1)" value={selectedSectionId === section.id ? newSeatLabel : ''} onChange={e => { setSelectedSectionId(section.id); setNewSeatLabel(e.target.value); }} />
                        <Button size="sm" onClick={() => { setSelectedSectionId(section.id); addSeat(); }}>Add Seat</Button>
                      </div>
                      <ul className="flex flex-wrap gap-2 mt-1">
                        {section.seats.map(seat => (
                          <li key={seat.id} className="border rounded px-2 py-1 text-xs flex items-center gap-1">
                            {seat.label}
                            <Button size="sm" variant="destructive" onClick={() => removeSeat(section.id, seat.id)}>x</Button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Standing Sections */}
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold mb-2">Standing Sections</h4>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Standing Area Name" value={newStandingName} onChange={e => setNewStandingName(e.target.value)} />
                  <Input placeholder="Capacity" type="number" value={newStandingCapacity} onChange={e => setNewStandingCapacity(e.target.value)} />
                  <Button onClick={addStandingSection}>Add Standing Section</Button>
                </div>
                <ul>
                  {standingSections.map(s => (
                    <li key={s.id} className="mb-1 flex items-center gap-2">
                      <span>{s.name} (Capacity: {s.capacity}, Sold: {s.ticketsSold})</span>
                      <Button size="sm" variant="destructive" onClick={() => removeStandingSection(s.id)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep === 5 ? (
          <div className="flex pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep <= 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
          </div>
        ) : (
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep <= 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {currentStep === 6 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Create Event</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
