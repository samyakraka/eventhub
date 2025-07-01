"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Save, Settings, Camera, Trash2, AlertCircle, User as UserIcon } from "lucide-react";
import type { User, UserProfile } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const { user, updateUserProfile, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    emergencyContact: "",
    dietaryRestrictions: "",
    accessibilityNeeds: "",
    company: "",
    jobTitle: "",
    autoFillEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    if (open && user) {
      const profile = getUserProfile();
      if (profile) {
        setFormData(profile);
      }
      setProfileImage(user.profileImageBase64 || null);
    }
  }, [open, user, getUserProfile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: Partial<UserProfile>) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 1MB",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setProfileImage(base64String);
      setProfileImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create updated profile data including the profile image
      const updatedData: Partial<User> = {
        ...formData,
      };

      // If we have a new profile image, include it in the update
      if (profileImage !== user?.profileImageBase64) {
        updatedData.profileImageBase64 = profileImage;
      }

      await updateUserProfile(updatedData);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserIcon className="w-5 h-5 mr-2" />
            My Profile
          </DialogTitle>
          <DialogDescription>
            Manage your personal information and preferences for faster event
            registration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-2 border-gray-200">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : (
                    <AvatarFallback className="text-3xl bg-blue-100">
                      {user?.displayName?.charAt(0) || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>

                {profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remove profile image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="font-medium">Profile Picture</h3>
                  <p className="text-sm text-gray-500">
                    Upload a photo to personalize your profile
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={triggerFileInput}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </Button>

                  {profileImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleRemoveImage}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>

                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Maximum file size: 1MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ""}
                  onChange={(e) =>
                    handleInputChange("emergencyContact", e.target.value)
                  }
                  placeholder="Name and phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ""}
                    onChange={(e) =>
                      handleInputChange("zipCode", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || ""}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Professional Information (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company || ""}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle || ""}
                    onChange={(e) =>
                      handleInputChange("jobTitle", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility & Dietary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Accessibility & Dietary Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dietaryRestrictions">
                  Dietary Restrictions
                </Label>
                <Textarea
                  id="dietaryRestrictions"
                  value={formData.dietaryRestrictions || ""}
                  onChange={(e) =>
                    handleInputChange("dietaryRestrictions", e.target.value)
                  }
                  placeholder="Vegetarian, vegan, allergies, etc."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessibilityNeeds">Accessibility Needs</Label>
                <Textarea
                  id="accessibilityNeeds"
                  value={formData.accessibilityNeeds || ""}
                  onChange={(e) =>
                    handleInputChange("accessibilityNeeds", e.target.value)
                  }
                  placeholder="Wheelchair access, hearing assistance, etc."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <Label htmlFor="autoFillEnabled" className="font-medium">
                    Enable Auto-fill
                  </Label>
                  <p className="text-sm text-gray-600">
                    Automatically fill registration forms with your saved
                    information
                  </p>
                </div>
                <Switch
                  id="autoFillEnabled"
                  checked={formData.autoFillEnabled || false}
                  onCheckedChange={(checked) =>
                    handleInputChange("autoFillEnabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <Label htmlFor="emailNotifications" className="font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive event updates and reminders via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={formData.emailNotifications || false}
                  onCheckedChange={(checked) =>
                    handleInputChange("emailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <Label htmlFor="smsNotifications" className="font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive event updates and reminders via text message
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={formData.smsNotifications || false}
                  onCheckedChange={(checked) =>
                    handleInputChange("smsNotifications", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
