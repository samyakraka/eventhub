"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, CustomForm } from "@/types";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Share2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Switch } from "@/components/ui/switch";
import { CustomFormRenderer } from "./CustomFormRenderer";

interface EventRegistrationDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistrationComplete: () => void;
}

export function EventRegistrationDialog({
  event,
  open,
  onOpenChange,
  onRegistrationComplete,
}: EventRegistrationDialogProps) {
  const { user, updateUserProfile, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(event.ticketPrice);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    specialRequests: "",
    discountCode: "",
  });
  const [donationAmount, setDonationAmount] = useState(0);
  const [useAutofill, setUseAutofill] = useState(false);
  const [organizerInfo, setOrganizerInfo] = useState<{
    displayName: string;
    email: string;
  } | null>(null);

  // Fetch custom form for this event
  useEffect(() => {
    const fetchCustomForm = async () => {
      if (!event.id) return;

      try {
        const q = query(
          collection(db, "customForms"),
          where("eventId", "==", event.id)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const formDoc = querySnapshot.docs[0];
          const formData = {
            id: formDoc.id,
            ...formDoc.data(),
            createdAt: formDoc.data().createdAt.toDate(),
            updatedAt: formDoc.data().updatedAt.toDate(),
          } as CustomForm;
          setCustomForm(formData);
        }
      } catch (error) {
        console.error("Error fetching custom form:", error);
      }
    };

    if (open && event.id) {
      fetchCustomForm();
    }
  }, [open, event.id]);

  // Fetch organizer info when dialog opens
  useEffect(() => {
    const fetchOrganizerInfo = async () => {
      if (!event.organizerUid || !open) return;

      try {
        const userDoc = await getDoc(doc(db, "users", event.organizerUid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOrganizerInfo({
            displayName:
              userData.displayName ||
              (userData.firstName && userData.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : "Event Organizer"),
            email: userData.email || "",
          });
        }
      } catch (error) {
        console.error("Error fetching organizer info:", error);
      }
    };

    if (open && event.organizerUid) {
      fetchOrganizerInfo();
    }
  }, [open, event.organizerUid]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomFormSubmit = (formData: Record<string, any>) => {
    setCustomFormData(formData);
    // Continue with registration process
    handleRegistrationSubmit(formData);
  };

  const generateQRCode = () => {
    // In a real app, you'd generate a proper QR code
    // For now, we'll use a UUID as the QR code data
    return uuidv4();
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim() || !event.discountEnabled) {
      setDiscountAmount(0);
      setCalculatedPrice(event.ticketPrice);
      return;
    }

    try {
      // Check if discount code exists and is valid
      const q = query(
        collection(db, "discountCodes"),
        where("eventId", "==", event.id),
        where("code", "==", discountCode.trim().toUpperCase()),
        where("isActive", "==", true)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const discountDoc = querySnapshot.docs[0];
        const discountData = discountDoc.data();

        if (discountData.usedCount < discountData.usageLimit) {
          const discount = (event.ticketPrice * discountData.discount) / 100;
          setDiscountAmount(discount);
          setCalculatedPrice(event.ticketPrice - discount);
          toast({
            title: "Discount Applied!",
            description: `${discountData.discount}% discount applied`,
          });
        } else {
          setDiscountAmount(0);
          setCalculatedPrice(event.ticketPrice);
          toast({
            title: "Discount Code Expired",
            description: "This discount code has reached its usage limit",
            variant: "destructive",
          });
        }
      } else {
        setDiscountAmount(0);
        setCalculatedPrice(event.ticketPrice);
        toast({
          title: "Invalid Discount Code",
          description: "The discount code you entered is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating discount code:", error);
      setDiscountAmount(0);
      setCalculatedPrice(event.ticketPrice);
    }
  };

  useEffect(() => {
    if (discountCode.trim()) {
      const timeoutId = setTimeout(validateDiscountCode, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setDiscountAmount(0);
      setCalculatedPrice(event.ticketPrice);
    }
  }, [discountCode, event.ticketPrice, event.discountEnabled]);

  useEffect(() => {
    if (open && user) {
      const profile = getUserProfile();
      if (profile && profile.autoFillEnabled) {
        setUseAutofill(true);
        setFormData((prev) => ({
          ...prev,
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: user.email || "",
          phone: profile.phone || "",
          specialRequests:
            profile.dietaryRestrictions || profile.accessibilityNeeds || "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
        }));
      }
    }
  }, [open, user, getUserProfile]);

  const handleRegistrationSubmit = async (
    registrationData: Record<string, any>
  ) => {
    if (!user) return;
    setLoading(true);
    try {
      // Prevent duplicate registration: check if ticket already exists
      const existingTicketQuery = query(
        collection(db, "tickets"),
        where("eventId", "==", event.id),
        where("attendeeUid", "==", user.uid)
      );
      const existingTicketSnapshot = await getDocs(existingTicketQuery);
      if (!existingTicketSnapshot.empty) {
        toast({
          title: "Already Registered",
          description: "You have already registered for this event.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Save user profile if they want autofill enabled (only for default form)
      if (!customForm && useAutofill) {
        const profileData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          autoFillEnabled: true,
        };
        await updateUserProfile(profileData);
      }

      // Create ticket with appropriate registration data
      const ticketData = {
        eventId: event.id,
        attendeeUid: user.uid,
        qrCode: generateQRCode(),
        checkedIn: false,
        registrationData: customForm ? registrationData : { ...formData },
        discountCode: discountCode.trim() || null,
        originalPrice: event.ticketPrice,
        finalPrice: calculatedPrice,
        discountAmount: discountAmount,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "tickets"), ticketData);

      // Update discount code usage if used
      if (discountCode.trim() && event.discountEnabled) {
        const q = query(
          collection(db, "discountCodes"),
          where("eventId", "==", event.id),
          where("code", "==", discountCode.trim().toUpperCase())
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const discountDoc = querySnapshot.docs[0];
          // Note: In a real app, you'd update the usage count here
        }
      }

      // Send WhatsApp notification if phone number is provided
      if (registrationData.phone || formData.phone) {
        const phoneNumber = registrationData.phone || formData.phone;
        const ticketId = ticketData.qrCode; // Use QR code as ticketId for now (since addDoc returns nothing)
        const ticketLink = `${window.location.origin}/my-tickets/${ticketId}`;
        const whatsappMessage = `📢 Greetings from EventHub!\n\nYou're all set for *${
          event.title
        }* 🎉\n\n📅 *Date:* ${format(
          event.startDate,
          "MMM dd, yyyy"
        )}\n🕒 *Time:* ${event.time}\n📍 *Venue:* ${
          event.isVirtual ? "Virtual Event" : event.location
        }\n\n🎟️ *Ticket ID:* ${ticketId}\n🔳 *QR Code Data:* ${ticketId}\n\n🔗 *View your ticket:* ${ticketLink}\n\nNeed Help? Contact us at support@eventhub.com\n\nThanks for registering with EventHub — we'll see you at the event! 🎶`;
        try {
          await fetch("/api/send-whatsapp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: `whatsapp:${phoneNumber}`,
              body: whatsappMessage,
            }),
          });
        } catch (error) {
          console.error("Error sending WhatsApp notification:", error);
        }
      }

      // Send Email confirmation if email is provided
      if (registrationData.email || formData.email) {
        const email = registrationData.email || formData.email;
        const ticketId = ticketData.qrCode; // Use QR code as ticketId for now
        const ticketLink = `${window.location.origin}/my-tickets/${ticketId}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color:#3B82F6;">📢 Greetings from <span style='background: #FFEB3B; color: #222; padding: 2px 6px; border-radius: 4px;'>EventHub</span>!</h2>
            <p>You're all set for <b>${event.title}</b> 🎉</p>
            <ul style="list-style:none; padding:0;">
              <li>📅 <b>Date:</b> ${format(
                event.startDate,
                "MMM dd, yyyy"
              )}</li>
              <li>🕒 <b>Time:</b> ${event.time}</li>
              <li>📍 <b>Venue:</b> ${
                event.isVirtual ? "Virtual Event" : event.location
              }</li>
            </ul>
            <p>🎟️ <b>Ticket ID:</b> ${ticketId}<br/>
            🔳 <b>QR Code Data:</b> ${ticketId}</p>
            <p>🔗 <b>View your ticket:</b> <a href="${ticketLink}">${ticketLink}</a></p>
            <p>Need Help? Contact us at <a href="mailto:support@eventhub.com">support@eventhub.com</a></p>
            <p style="color: #22c55e;">Thanks for registering with <span style='background: #FFEB3B; color: #222; padding: 2px 6px; border-radius: 4px;'>EventHub</span> — we'll see you at the event! 🎶</p>
          </div>
        `;
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: email,
              subject: `Your Ticket for ${event.title}`,
              html: emailHtml,
              text: `Greetings from EventHub!\n\nYou're all set for ${
                event.title
              } 🎉\n\nDate: ${format(event.startDate, "MMM dd, yyyy")}\nTime: ${
                event.time
              }\nVenue: ${
                event.isVirtual ? "Virtual Event" : event.location
              }\n\nTicket ID: ${ticketId}\nQR Code Data: ${ticketId}\n\nView your ticket: ${ticketLink}\n\nNeed Help? Contact us at support@eventhub.com\n\nThanks for registering with EventHub — we'll see you at the event! 🎶`,
            }),
          });
        } catch (error) {
          console.error("Error sending email confirmation:", error);
        }
      }

      // Create donation if amount > 0
      if (donationAmount > 0) {
        const donationData = {
          eventId: event.id,
          userId: user.uid,
          amount: donationAmount,
          message: `Donation for ${event.title}`,
          createdAt: new Date(),
        };
        await addDoc(collection(db, "donations"), donationData);
        // Send thank you email for donation
        if (
          (registrationData.email || formData.email) &&
          (registrationData.email || formData.email).length > 0
        ) {
          const email = registrationData.email || formData.email;
          const subject = `Thank You for Your Donation to ${event.title}`;
          const emailText = `\n🙏 Thank you for your generous donation!\n\nEvent: ${
            event.title
          }\nAmount: $${donationAmount.toFixed(
            2
          )}\n\nYour support helps us make this event even better.\n\nIf you have any questions, contact us at support@eventhub.com.\n\nWith gratitude,\nThe EventHub Team`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #222;">
              <h2 style="color:#16A34A;">🙏 Thank You for Your Donation!</h2>
              <p>We appreciate your support for <b>${event.title}</b>.</p>
              <p><b>Amount:</b> $${donationAmount.toFixed(2)}</p>
              <p>Your contribution helps us make this event even better for everyone.</p>
              <p>If you have any questions, contact us at <a href="mailto:support@eventhub.com">support@eventhub.com</a>.</p>
              <p style="color:#4F46E5;">With gratitude,<br/>The EventHub Team</p>
            </div>
          `;
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: email,
                subject,
                text: emailText,
                html: emailHtml,
              }),
            });
          } catch (err) {
            console.error("Donation thank you email failed:", err);
          }
        }
      }

      setShowThankYou(true);
      onRegistrationComplete();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleRegistrationSubmit(formData);
  };

  const shareEvent = async () => {
    const shareData = {
      title: event.title,
      text: `Check out this amazing event: ${event.title}`,
      url: `${window.location.origin}/events/${event.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyEventLink();
      }
    } else {
      copyEventLink();
    }
  };

  const copyEventLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/events/${event.id}`)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "Event link copied to clipboard",
        });
      });
  };

  const handleClose = () => {
    setShowThankYou(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: user?.email || "",
      phone: "",
      specialRequests: "",
      discountCode: "",
    });
    setCustomFormData({});
    setDiscountCode("");
    setCalculatedPrice(event.ticketPrice);
    setDiscountAmount(0);
    setDonationAmount(0);
    setUseAutofill(false);
    onOpenChange(false);
  };

  const loadAutofillData = () => {
    const profile = getUserProfile();
    if (profile) {
      setUseAutofill(true);
      setFormData((prev) => ({
        ...prev,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: user?.email || "",
        phone: profile.phone || "",
        specialRequests:
          profile.dietaryRestrictions || profile.accessibilityNeeds || "",
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showThankYou ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You're all set for{" "}
              <span className="font-semibold text-gray-900">{event.title}</span>
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">
                  What's Next?
                </h3>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Check your email for confirmation details</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Your QR code ticket is ready in "My Tickets"</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Add the event to your calendar</span>
                </div>
                {(customFormData.phone || formData.phone) && (
                  <div className="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-green-800 font-medium">
                      Ticket details have been sent to your WhatsApp number:{" "}
                      <span className="font-mono">
                        {customFormData.phone || formData.phone}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-gray-900 mb-3">
                Event Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {format(event.startDate, "MMM dd, yyyy")}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  {event.isVirtual ? "Virtual Event" : event.location}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  {calculatedPrice === 0
                    ? "Free"
                    : `$${calculatedPrice.toFixed(2)}`}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={shareEvent}
                variant="outline"
                className="flex items-center space-x-2 border-blue-200 hover:bg-blue-50"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Event</span>
              </Button>
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Back to Events
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Need help? Contact {organizerInfo?.displayName || "the event organizer"} or check our support center.
            </p>
          </div>
        ) : (
          // Registration Form
          <>
            <DialogHeader>
              <div className="flex flex-col">
                <DialogTitle>Register for {event.title}</DialogTitle>
                <DialogDescription>
                  Complete your registration for this event
                  {organizerInfo && (
                    <span className="block mt-1 text-sm text-gray-500">
                      Organized by {organizerInfo.displayName}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Event Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {format(event.startDate, "MMM dd, yyyy")}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  {event.isVirtual ? "Virtual Event" : event.location}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                </div>
              </div>
            </div>

            {/* Custom Form or Default Form */}
            {customForm ? (
              <CustomFormRenderer
                form={customForm}
                onSubmit={handleCustomFormSubmit}
                loading={loading}
              />
            ) : (
              <>
                {/* Autofill Option */}
                {getUserProfile() && !useAutofill && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">
                          Use Saved Information
                        </h4>
                        <p className="text-sm text-blue-700">
                          Fill in your details from your profile
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAutofillData}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Autofill
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) =>
                        handleInputChange("specialRequests", e.target.value)
                      }
                      placeholder="Any dietary restrictions, accessibility needs, or special requests..."
                      rows={3}
                    />
                  </div>

                  {/* Discount Code Section */}
                  {event.discountEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="discountCode">
                        Discount Code (Optional)
                      </Label>
                      <Input
                        id="discountCode"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="Enter discount code"
                      />
                    </div>
                  )}

                  {/* Donation Section */}
                  <div className="border-t pt-4">
                    <Label htmlFor="donation">Optional Donation ($)</Label>
                    <Input
                      id="donation"
                      type="number"
                      min="0"
                      step="0.01"
                      value={donationAmount}
                      onChange={(e) =>
                        setDonationAmount(Number(e.target.value))
                      }
                      placeholder="0.00"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Support this event with an optional donation
                    </p>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Ticket Price:</span>
                      <span className="font-medium">
                        ${event.ticketPrice.toFixed(2)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center mb-2 text-green-600">
                        <span>Discount:</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">
                        ${calculatedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Autofill Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useAutofill"
                      checked={useAutofill}
                      onCheckedChange={setUseAutofill}
                    />
                    <Label htmlFor="useAutofill" className="text-sm">
                      Save my information for future registrations
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : "Complete Registration"}
                  </Button>
                </form>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
