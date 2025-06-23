"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"
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
} from "lucide-react"
import type { Event } from "@/types"
import { format } from "date-fns"

interface EditEventDialogProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventUpdated: () => void
}

export function EditEventDialog({ event, open, onOpenChange, onEventUpdated }: EditEventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    location: "",
    virtualLink: "",
    date: "",
    time: "",
    endTime: "",
    themeColor: "#3B82F6",
    ticketPrice: 0,
    maxAttendees: "",
    isVirtual: false,
    logoBase64: "",
    bannerBase64: "",
    discountEnabled: false,
    discountPercentage: 10,
    status: "upcoming",
    virtualType: "meeting",
    requiresCheckIn: true,
  })

  const steps = [
    { id: 1, title: "Basic Info", icon: Calendar },
    { id: 2, title: "Location & Time", icon: MapPin },
    { id: 3, title: "Images", icon: Upload },
    { id: 4, title: "Pricing & Discounts", icon: DollarSign },
    { id: 5, title: "Preview", icon: Users },
  ]

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        type: event.type,
        location: event.location || "",
        virtualLink: event.virtualLink || "",
        date: format(event.date, "yyyy-MM-dd"),
        time: event.time,
        endTime: event.endTime,
        themeColor: event.themeColor,
        ticketPrice: event.ticketPrice,
        maxAttendees: event.maxAttendees?.toString() || "",
        isVirtual: event.isVirtual,
        logoBase64: event.logoBase64 || "",
        bannerBase64: event.bannerBase64 || "",
        discountEnabled: event.discountEnabled,
        discountPercentage: event.discountPercentage || 10,
        status: event.status,
        virtualType: event.virtualType || "meeting",
        requiresCheckIn: event.requiresCheckIn || true,
      })
    }
  }, [event])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (field: "logoBase64" | "bannerBase64", file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setFormData((prev) => ({
        ...prev,
        [field]: base64,
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (field: "logoBase64" | "bannerBase64") => {
    setFormData((prev) => ({ ...prev, [field]: "" }))
  }

  const handleSubmit = async () => {
    if (!event) return

    setLoading(true)
    try {
      const updateData = {
        ...formData,
        date: new Date(formData.date),
        ticketPrice: Number(formData.ticketPrice),
        maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : null,
        discountPercentage: formData.discountEnabled ? Number(formData.discountPercentage) : null,
      }

      await updateDoc(doc(db, "events", event.id), updateData)

      toast({
        title: "Event Updated Successfully!",
        description: "Your event has been updated.",
      })

      onEventUpdated()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.type
      case 2:
        return formData.date && formData.time && formData.endTime && (formData.isVirtual || formData.location)
      case 3:
        return true
      case 4:
        return true
      default:
        return true
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Event</DialogTitle>
          <DialogDescription>Update your event details</DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-400"
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-400"}`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-300"}`} />
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
                <Label htmlFor="description" className="text-base font-semibold">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
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
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
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
                <Label htmlFor="status" className="text-base font-semibold">
                  Event Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="mt-2 h-12">
                    <SelectValue placeholder="Select event status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
                    onChange={(e) => handleInputChange("themeColor", e.target.value)}
                    className="w-20 h-12"
                  />
                  <span className="text-sm text-gray-600">{formData.themeColor}</span>
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
                  onCheckedChange={(checked) => handleInputChange("isVirtual", checked)}
                />
                <Label htmlFor="isVirtual" className="text-base font-semibold">
                  Virtual Event
                </Label>
              </div>

              {formData.isVirtual ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Virtual Event Type</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.virtualType === "meeting" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                        onClick={() => handleInputChange("virtualType", "meeting")}
                      >
                        <h4 className="font-medium">Meeting Link</h4>
                        <p className="text-sm text-gray-600">Zoom, Teams, or other meeting platform</p>
                      </div>
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.virtualType === "broadcast" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                        onClick={() => handleInputChange("virtualType", "broadcast")}
                      >
                        <h4 className="font-medium">Live Broadcast</h4>
                        <p className="text-sm text-gray-600">YouTube, website, or streaming platform</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="virtualLink" className="text-base font-semibold">
                      {formData.virtualType === "meeting" ? "Meeting Link" : "Broadcast URL"}
                    </Label>
                    <Input
                      id="virtualLink"
                      type="url"
                      value={formData.virtualLink}
                      onChange={(e) => handleInputChange("virtualLink", e.target.value)}
                      placeholder={
                        formData.virtualType === "meeting" ? "https://zoom.us/j/..." : "https://youtube.com/watch?v=..."
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
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter event location"
                    className="mt-2 h-12"
                    required={!formData.isVirtual}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date" className="text-base font-semibold">
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
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
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    className="mt-2 h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxAttendees" className="text-base font-semibold">
                  Maximum Attendees (optional)
                </Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={(e) => handleInputChange("maxAttendees", e.target.value)}
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
                      <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 5MB</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload("logoBase64", file)
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
                      <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 5MB (recommended: 1200x600)</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload("bannerBase64", file)
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
                <Label htmlFor="ticketPrice" className="text-base font-semibold">
                  Ticket Price ($)
                </Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.ticketPrice}
                  onChange={(e) => handleInputChange("ticketPrice", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 h-12"
                />
                <p className="text-sm text-gray-500 mt-1">Set to 0 for free events</p>
              </div>

              {/* Check-in Requirement */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="requiresCheckIn"
                    checked={formData.requiresCheckIn}
                    onCheckedChange={(checked) => handleInputChange("requiresCheckIn", checked)}
                  />
                  <Label htmlFor="requiresCheckIn" className="text-base font-semibold flex items-center">
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
                    <p className="text-sm font-medium text-orange-800">Security Benefits:</p>
                    <ul className="text-sm text-orange-700 mt-1 list-disc list-inside">
                      <li>Prevents unauthorized access</li>
                      <li>Ensures only verified attendees participate</li>
                      <li>Provides accurate attendance tracking</li>
                      <li>Enables better event management</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="discountEnabled"
                    checked={formData.discountEnabled}
                    onCheckedChange={(checked) => handleInputChange("discountEnabled", checked)}
                  />
                  <Label htmlFor="discountEnabled" className="text-base font-semibold">
                    Enable Discount Codes
                  </Label>
                </div>

                {formData.discountEnabled && (
                  <div>
                    <Label htmlFor="discountPercentage" className="text-base font-semibold">
                      Discount Percentage
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.discountPercentage}
                        onChange={(e) => handleInputChange("discountPercentage", e.target.value)}
                        className="h-12"
                      />
                      <Percent className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      You can create discount codes that give {formData.discountPercentage}% off the ticket price
                    </p>
                    {formData.ticketPrice > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm">
                          <strong>Original Price:</strong> ${formData.ticketPrice}
                        </p>
                        <p className="text-sm">
                          <strong>Discounted Price:</strong> $
                          {(formData.ticketPrice * (1 - formData.discountPercentage / 100)).toFixed(2)}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {formData.logoBase64 && (
                      <img src={formData.logoBase64 || "/placeholder.svg"} alt="Logo" className="w-8 h-8 rounded" />
                    )}
                    <span>{formData.title}</span>
                    <Badge variant="outline">{formData.type}</Badge>
                    <Badge
                      className={
                        formData.status === "live"
                          ? "bg-green-100 text-green-800"
                          : formData.status === "upcoming"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {formData.status}
                    </Badge>
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
                      <span>{formData.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>
                        {formData.time} - {formData.endTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{formData.isVirtual ? "Virtual Event" : formData.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>{formData.ticketPrice === 0 ? "Free" : `$${formData.ticketPrice}`}</span>
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
                          Discount Codes Enabled: {formData.discountPercentage}% off
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep === 5 ? (
              <Button onClick={handleSubmit} disabled={loading} className="flex items-center space-x-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Update Event</span>
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()} className="flex items-center space-x-2">
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
