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
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event } from "@/types";
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
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Save user profile if they want autofill enabled
      if (useAutofill) {
        const profileData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          autoFillEnabled: true,
        };
        await updateUserProfile(profileData);
      }

      // Create ticket - remove idProofUrl from registrationData
      const ticketData = {
        eventId: event.id,
        attendeeUid: user.uid,
        qrCode: generateQRCode(),
        checkedIn: false,
        registrationData: { ...formData }, // Remove idProofUrl from here
        discountCode: discountCode.trim() || null,
        originalPrice: event.ticketPrice,
        finalPrice: calculatedPrice,
        discountAmount: discountAmount,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "tickets"), ticketData);

      // Send WhatsApp ticket details if phone number is provided
      if (formData.phone && formData.phone.length > 0) {
        const to = formData.phone.startsWith('whatsapp:') ? formData.phone : `whatsapp:${formData.phone}`;
        const ticketId = ticketData.qrCode;
        const ticketLink = `${window.location.origin}/my-tickets/${ticketId}`;
        const message = `\n📣 Greetings from EventHub!\nYou're all set for ${event.title} 🎉\n\n🗓️ Date: ${format(event.date, "MMM dd, yyyy")}\n🕒 Time: ${event.time}\n📍 Venue: ${event.isVirtual ? "Virtual Event" : event.location}\n\n🎟️ Ticket ID: ${ticketId}\n🔳 QR Code: ${ticketId}\n\n🔗 View your ticket: ${ticketLink}\n\n🧾 Need Help? Contact us at support@eventhub.com\n\nThanks for registering with EventHub — we'll see you at the event! 🎶\n`;
        try {
          await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, body: message })
          });
        } catch (err) {
          console.error('WhatsApp notification failed:', err);
        }
      }

      // Send email confirmation if email is provided
      if (formData.email && formData.email.length > 0) {
        const ticketId = ticketData.qrCode;
        const ticketLink = `${window.location.origin}/my-tickets/${ticketId}`;
        const subject = `Your Ticket for ${event.title}`;
        const emailText = `\n📣 Greetings from EventHub!\nYou're all set for ${event.title} 🎉\n\n🗓️ Date: ${format(event.date, "MMM dd, yyyy")}\n🕒 Time: ${event.time}\n📍 Venue: ${event.isVirtual ? "Virtual Event" : event.location}\n\n🎟️ Ticket ID: ${ticketId}\n🔳 QR Code: ${ticketId}\n\n🔗 View your ticket: ${ticketLink}\n\n🧾 Need Help? Contact us at support@eventhub.com\n\nThanks for registering with EventHub — we'll see you at the event! 🎶\n`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #222;">
            <h2 style="color:#4F46E5;">📣 Greetings from EventHub!</h2>
            <p>You're all set for <b>${event.title}</b> 🎉</p>
            <p>
              <b>🗓️ Date:</b> ${format(event.date, "MMM dd, yyyy")}<br>
              <b>🕒 Time:</b> ${event.time}<br>
              <b>📍 Venue:</b> ${event.isVirtual ? "Virtual Event" : event.location}
            </p>
            <p>
              <b>🎟️ Ticket ID:</b> ${ticketId}<br>
              <b>🔳 QR Code Data:</b> ${ticketId}
            </p>
            <p>
              <b>🔗 View your ticket:</b> <a href="${ticketLink}">${ticketLink}</a>
            </p>
            <p>
              🧾 Need Help? Contact us at <a href="mailto:support@eventhub.com">support@eventhub.com</a>
            </p>
            <p style="color:#16A34A;">Thanks for registering with EventHub — we'll see you at the event! 🎶</p>
          </div>
        `;
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: formData.email, subject, text: emailText, html: emailHtml })
          });
        } catch (err) {
          console.error('Email notification failed:', err);
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
        if (formData.email && formData.email.length > 0) {
          const subject = `Thank You for Your Donation to ${event.title}`;
          const emailText = `\n🙏 Thank you for your generous donation!\n\nEvent: ${event.title}\nAmount: $${donationAmount.toFixed(2)}\n\nYour support helps us make this event even better.\n\nIf you have any questions, contact us at support@eventhub.com.\n\nWith gratitude,\nThe EventHub Team`;
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
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: formData.email, subject, text: emailText, html: emailHtml })
            });
          } catch (err) {
            console.error('Donation thank you email failed:', err);
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
        // Fallback to copying URL
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
    onOpenChange(false);
    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      email: user?.email || "",
      phone: "",
      specialRequests: "",
      discountCode: "",
    });
    setDiscountCode("");
    setDonationAmount(0);
  };

  const loadAutofillData = () => {
    const profile = getUserProfile();
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        specialRequests: `${profile.dietaryRestrictions || ""} ${
          profile.accessibilityNeeds || ""
        }`.trim(),
      }));
      setUseAutofill(true);
      toast({
        title: "Profile Loaded",
        description: "Your saved information has been filled in",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showThankYou ? (
          // Thank You Screen
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Registration Successful! 🎉
            </h2>
            <p className="text-lg text-gray-600 mb-6">
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
                {formData.phone && (
                  <div className="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800 font-medium">
                      Ticket details have been sent to your WhatsApp number: <span className="font-mono">{formData.phone}</span>
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
                  {format(event.date, "MMM dd, yyyy")}
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
              Need help? Contact the event organizer or check our support
              center.
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
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Event Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {format(event.date, "MMM dd, yyyy")}
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
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              {/* Remove the ID Proof upload section */}

              {/* Save Information Option */}
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <Switch
                  id="useAutofill"
                  checked={useAutofill}
                  onCheckedChange={setUseAutofill}
                />
                <Label htmlFor="useAutofill" className="text-sm">
                  Save my information for future event registrations
                </Label>
              </div>

              {event.discountEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="discountCode">Discount Code (optional)</Label>
                  <Input
                    id="discountCode"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        discountCode: e.target.value,
                      }));
                    }}
                    placeholder="Enter discount code"
                  />
                  {discountAmount > 0 && (
                    <p className="text-sm text-green-600">
                      Discount applied: -${discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) =>
                    handleInputChange("specialRequests", e.target.value)
                  }
                  placeholder="Any dietary restrictions, accessibility needs, etc."
                  rows={3}
                />
              </div>

              {/* Donation Section */}
              <div className="border-t pt-4">
                <Label htmlFor="donation">Optional Donation ($)</Label>
                <Input
                  id="donation"
                  type="number"
                  min="0"
                  step="0.01"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Support this event with an optional donation
                </p>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareEvent}
                  className="flex items-center space-x-2"
                  type="button"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Registering..."
                      : `Register ${calculatedPrice > 0 ? `($${calculatedPrice.toFixed(2)})` : "(Free)"}`}
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
