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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Settings,
  Camera,
  Trash2,
  AlertCircle,
  User as UserIcon,
  Building2,
  Award,
  Shield,
} from "lucide-react";
import type { User, UserProfile, Ticket, Event, RaceCategory } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    // Personal fields
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
    // Organization-specific fields
    organizationName: "",
    organizationType: undefined,
    taxId: "",
    businessLicense: "",
    establishedYear: undefined,
    employeeCount: undefined,
    industry: "",
    businessDescription: "",
    website: "",
    socialMediaLinks: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
      youtube: "",
    },
    bankingDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      swiftCode: "",
      sortCode: "",
      iban: "",
      ifscCode: "",
      branchName: "",
      branchAddress: "",
      accountType: undefined,
      upiId: "",
      bankingRegion: undefined,
    },
    contactPerson: {
      name: "",
      title: "",
      email: "",
      phone: "",
    },
    eventManagementExperience: "",
    specializations: [],
    certifications: [],
    insuranceInfo: {
      provider: "",
      policyNumber: "",
      expiryDate: "",
    },
  });

  const isOrganizer = user?.role === "organizer";

  useEffect(() => {
    if (open && user) {
      const profile = getUserProfile();
      if (profile) {
        setFormData({
          ...profile,
          socialMediaLinks: profile.socialMediaLinks || {
            facebook: "",
            twitter: "",
            linkedin: "",
            instagram: "",
            youtube: "",
          },
          bankingDetails: profile.bankingDetails || {
            accountHolderName: "",
            bankName: "",
            accountNumber: "",
            routingNumber: "",
            swiftCode: "",
            sortCode: "",
            iban: "",
            ifscCode: "",
            branchName: "",
            branchAddress: "",
            accountType: undefined,
            upiId: "",
            bankingRegion: undefined,
          },
          contactPerson: profile.contactPerson || {
            name: "",
            title: "",
            email: "",
            phone: "",
          },
          insuranceInfo: profile.insuranceInfo || {
            provider: "",
            policyNumber: "",
            expiryDate: "",
          },
          specializations: profile.specializations || [],
          certifications: profile.certifications || [],
        });
      }
      setProfileImage(user.profileImageBase64 || null);
    }
  }, [open, user, getUserProfile]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev: Partial<UserProfile>) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev: Partial<UserProfile>) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setFormData((prev: Partial<UserProfile>) => ({ ...prev, [field]: items }));
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isOrganizer ? (
              <Building2 className="w-5 h-5 mr-2" />
            ) : (
              <UserIcon className="w-5 h-5 mr-2" />
            )}
            {isOrganizer ? "Organization Profile" : "My Profile"}
          </DialogTitle>
          <DialogDescription>
            {isOrganizer
              ? "Manage your organization information and event management details"
              : "Manage your personal information and preferences for faster event registration"}
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

          {isOrganizer ? (
            <>
              {/* Organization Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organization Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input
                        id="organizationName"
                        value={formData.organizationName || ""}
                        onChange={(e) =>
                          handleInputChange("organizationName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationType">Organization Type</Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("organizationType", value)
                        }
                        defaultValue={formData.organizationType || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Corporation">Corporation</SelectItem>
                          <SelectItem value="LLC">LLC</SelectItem>
                          <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                          <SelectItem value="Government">Government</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={formData.taxId || ""}
                        onChange={(e) =>
                          handleInputChange("taxId", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessLicense">Business License</Label>
                      <Input
                        id="businessLicense"
                        value={formData.businessLicense || ""}
                        onChange={(e) =>
                          handleInputChange("businessLicense", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="establishedYear">Established Year</Label>
                      <Input
                        id="establishedYear"
                        type="number"
                        value={formData.establishedYear || ""}
                        onChange={(e) =>
                          handleInputChange("establishedYear", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Employee Count</Label>
                      <Input
                        id="employeeCount"
                        type="number"
                        value={formData.employeeCount || ""}
                        onChange={(e) =>
                          handleInputChange("employeeCount", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry || ""}
                      onChange={(e) =>
                        handleInputChange("industry", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">Business Description</Label>
                    <Textarea
                      id="businessDescription"
                      value={formData.businessDescription || ""}
                      onChange={(e) =>
                        handleInputChange("businessDescription", e.target.value)
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website || ""}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialMediaLinks">Social Media Links (comma-separated)</Label>
                    <Input
                      id="socialMediaLinks"
                      value={formData.socialMediaLinks?.facebook || ""}
                      onChange={(e) =>
                        handleInputChange("socialMediaLinks.facebook", e.target.value)
                      }
                      placeholder="https://facebook.com/yourorg"
                    />
                    <Input
                      id="socialMediaLinks"
                      value={formData.socialMediaLinks?.twitter || ""}
                      onChange={(e) =>
                        handleInputChange("socialMediaLinks.twitter", e.target.value)
                      }
                      placeholder="https://twitter.com/yourorg"
                    />
                    <Input
                      id="socialMediaLinks"
                      value={formData.socialMediaLinks?.linkedin || ""}
                      onChange={(e) =>
                        handleInputChange("socialMediaLinks.linkedin", e.target.value)
                      }
                      placeholder="https://linkedin.com/yourorg"
                    />
                    <Input
                      id="socialMediaLinks"
                      value={formData.socialMediaLinks?.instagram || ""}
                      onChange={(e) =>
                        handleInputChange("socialMediaLinks.instagram", e.target.value)
                      }
                      placeholder="https://instagram.com/yourorg"
                    />
                    <Input
                      id="socialMediaLinks"
                      value={formData.socialMediaLinks?.youtube || ""}
                      onChange={(e) =>
                        handleInputChange("socialMediaLinks.youtube", e.target.value)
                      }
                      placeholder="https://youtube.com/yourorg"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Banking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Banking Region Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="bankingRegion">Banking Region</Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("bankingDetails.bankingRegion", value)
                      }
                      value={formData.bankingDetails?.bankingRegion || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select banking region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="europe">Europe</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Common Banking Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankingDetails.accountHolderName">Account Holder Name</Label>
                      <Input
                        id="bankingDetails.accountHolderName"
                        value={formData.bankingDetails?.accountHolderName || ""}
                        onChange={(e) =>
                          handleInputChange("bankingDetails.accountHolderName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankingDetails.bankName">Bank Name</Label>
                      <Input
                        id="bankingDetails.bankName"
                        value={formData.bankingDetails?.bankName || ""}
                        onChange={(e) =>
                          handleInputChange("bankingDetails.bankName", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankingDetails.accountNumber">Account Number</Label>
                    <Input
                      id="bankingDetails.accountNumber"
                      value={formData.bankingDetails?.accountNumber || ""}
                      onChange={(e) =>
                        handleInputChange("bankingDetails.accountNumber", e.target.value)
                      }
                    />
                  </div>

                  {/* Indian Banking Fields */}
                  {formData.bankingDetails?.bankingRegion === "india" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankingDetails.ifscCode">IFSC Code *</Label>
                          <Input
                            id="bankingDetails.ifscCode"
                            value={formData.bankingDetails?.ifscCode || ""}
                            onChange={(e) =>
                              handleInputChange("bankingDetails.ifscCode", e.target.value)
                            }
                            placeholder="e.g., SBIN0001234"
                          />
                          <p className="text-xs text-gray-500">Required for Indian bank transfers</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankingDetails.branchName">Branch Name</Label>
                          <Input
                            id="bankingDetails.branchName"
                            value={formData.bankingDetails?.branchName || ""}
                            onChange={(e) =>
                              handleInputChange("bankingDetails.branchName", e.target.value)
                            }
                            placeholder="e.g., Connaught Place Branch"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankingDetails.branchAddress">Branch Address</Label>
                        <Textarea
                          id="bankingDetails.branchAddress"
                          value={formData.bankingDetails?.branchAddress || ""}
                          onChange={(e) =>
                            handleInputChange("bankingDetails.branchAddress", e.target.value)
                          }
                          placeholder="Complete branch address"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankingDetails.accountType">Account Type</Label>
                          <Select
                            onValueChange={(value) =>
                              handleInputChange("bankingDetails.accountType", value)
                            }
                            value={formData.bankingDetails?.accountType || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="savings">Savings Account</SelectItem>
                              <SelectItem value="current">Current Account</SelectItem>
                              <SelectItem value="salary">Salary Account</SelectItem>
                              <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                              <SelectItem value="recurring_deposit">Recurring Deposit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankingDetails.upiId">UPI ID (Optional)</Label>
                          <Input
                            id="bankingDetails.upiId"
                            value={formData.bankingDetails?.upiId || ""}
                            onChange={(e) =>
                              handleInputChange("bankingDetails.upiId", e.target.value)
                            }
                            placeholder="e.g., yourname@paytm"
                          />
                          <p className="text-xs text-gray-500">For UPI-based transactions</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* US Banking Fields */}
                  {formData.bankingDetails?.bankingRegion === "us" && (
                    <div className="space-y-2">
                      <Label htmlFor="bankingDetails.routingNumber">Routing Number</Label>
                      <Input
                        id="bankingDetails.routingNumber"
                        value={formData.bankingDetails?.routingNumber || ""}
                        onChange={(e) =>
                          handleInputChange("bankingDetails.routingNumber", e.target.value)
                        }
                        placeholder="9-digit routing number"
                      />
                    </div>
                  )}

                  {/* UK Banking Fields */}
                  {formData.bankingDetails?.bankingRegion === "uk" && (
                    <div className="space-y-2">
                      <Label htmlFor="bankingDetails.sortCode">Sort Code</Label>
                      <Input
                        id="bankingDetails.sortCode"
                        value={formData.bankingDetails?.sortCode || ""}
                        onChange={(e) =>
                          handleInputChange("bankingDetails.sortCode", e.target.value)
                        }
                        placeholder="e.g., 12-34-56"
                      />
                    </div>
                  )}

                  {/* European Banking Fields */}
                  {formData.bankingDetails?.bankingRegion === "europe" && (
                    <div className="space-y-2">
                      <Label htmlFor="bankingDetails.iban">IBAN</Label>
                      <Input
                        id="bankingDetails.iban"
                        value={formData.bankingDetails?.iban || ""}
                        onChange={(e) =>
                          handleInputChange("bankingDetails.iban", e.target.value)
                        }
                        placeholder="e.g., DE89370400440532013000"
                      />
                    </div>
                  )}

                  {/* International/SWIFT Code for International transfers */}
                  {(formData.bankingDetails?.bankingRegion === "international" || 
                    formData.bankingDetails?.bankingRegion === "europe") && (
                    <div className="space-y-2">
                      <Label htmlFor="bankingDetails.swiftCode">SWIFT Code</Label>
                      <Input
                        id="bankingDetails.swiftCode"
                        value={formData.bankingDetails?.swiftCode || ""}
                        onChange={(e) =>
                          handleInputChange("bankingDetails.swiftCode", e.target.value)
                        }
                        placeholder="e.g., SBININBB123"
                      />
                      <p className="text-xs text-gray-500">Required for international transfers</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Person</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson.name">Name</Label>
                      <Input
                        id="contactPerson.name"
                        value={formData.contactPerson?.name || ""}
                        onChange={(e) =>
                          handleInputChange("contactPerson.name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson.title">Title</Label>
                      <Input
                        id="contactPerson.title"
                        value={formData.contactPerson?.title || ""}
                        onChange={(e) =>
                          handleInputChange("contactPerson.title", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson.email">Email</Label>
                      <Input
                        id="contactPerson.email"
                        type="email"
                        value={formData.contactPerson?.email || ""}
                        onChange={(e) =>
                          handleInputChange("contactPerson.email", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson.phone">Phone</Label>
                      <Input
                        id="contactPerson.phone"
                        type="tel"
                        value={formData.contactPerson?.phone || ""}
                        onChange={(e) =>
                          handleInputChange("contactPerson.phone", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Management Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventManagementExperience">
                      Describe your experience managing events
                    </Label>
                    <Textarea
                      id="eventManagementExperience"
                      value={formData.eventManagementExperience || ""}
                      onChange={(e) =>
                        handleInputChange("eventManagementExperience", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Specializations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specializations">
                      List your areas of specialization (comma-separated)
                    </Label>
                    <Input
                      id="specializations"
                      value={formData.specializations?.join(", ") || ""}
                      onChange={(e) =>
                        handleArrayChange("specializations", e.target.value)
                      }
                      placeholder="e.g., Marathon, Gala, Concert"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="certifications">
                      List your relevant certifications (comma-separated)
                    </Label>
                    <Input
                      id="certifications"
                      value={formData.certifications?.join(", ") || ""}
                      onChange={(e) =>
                        handleArrayChange("certifications", e.target.value)
                      }
                      placeholder="e.g., Event Management, First Aid"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Insurance Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insuranceInfo.provider">Insurance Provider</Label>
                      <Input
                        id="insuranceInfo.provider"
                        value={formData.insuranceInfo?.provider || ""}
                        onChange={(e) =>
                          handleInputChange("insuranceInfo.provider", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceInfo.policyNumber">Policy Number</Label>
                      <Input
                        id="insuranceInfo.policyNumber"
                        value={formData.insuranceInfo?.policyNumber || ""}
                        onChange={(e) =>
                          handleInputChange("insuranceInfo.policyNumber", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insuranceInfo.expiryDate">Expiry Date</Label>
                    <Input
                      id="insuranceInfo.expiryDate"
                      type="date"
                      value={formData.insuranceInfo?.expiryDate || ""}
                      onChange={(e) =>
                        handleInputChange("insuranceInfo.expiryDate", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Personal Information for Attendees */}
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

              {/* MarathonStats card from your version */}
              {user && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="text-lg">Marathon Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarathonStats userId={user.uid} />
                  </CardContent>
                </Card>
              )}
            </>
          )}

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

function MarathonStats({ userId }: { userId: string }) {
  const [tickets, setTickets] = useState<(Ticket & { event?: Event })[]>([]);
  useEffect(() => {
    const fetchTickets = async () => {
      const q = query(collection(db, 'tickets'), where('attendeeUid', '==', userId));
      const qs = await getDocs(q);
      const ticketsData = await Promise.all(qs.docs.map(async (docSnap) => {
        const data = docSnap.data() as Ticket;
        const eventDoc = await getDoc(doc(db, 'events', data.eventId));
        let event: Event | undefined = undefined;
        if (eventDoc.exists()) {
          event = { id: eventDoc.id, ...eventDoc.data() } as Event;
        }
        return { ...data, event };
      }));
      setTickets(ticketsData.filter(t => t.event?.type === 'marathon'));
    };
    fetchTickets();
  }, [userId]);
  if (tickets.length === 0) return <div className="text-gray-500">No marathon registrations yet.</div>;
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th className="px-2 py-1 text-left">Event</th>
          <th className="px-2 py-1 text-left">Bib</th>
          <th className="px-2 py-1 text-left">Category</th>
          <th className="px-2 py-1 text-left">T-Shirt</th>
          <th className="px-2 py-1 text-left">Finish Time</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr key={t.id} className="border-b">
            <td className="px-2 py-1">{t.event?.title || 'N/A'}</td>
            <td className="px-2 py-1">{t.registrationData?.bibNumber || 'N/A'}</td>
            <td className="px-2 py-1">{t.event?.raceCategories?.find((c: RaceCategory) => c.id === t.registrationData?.selectedCategoryId)?.name || 'N/A'}</td>
            <td className="px-2 py-1">{t.registrationData?.tShirtSize || 'N/A'}</td>
            <td className="px-2 py-1">{t.registrationData?.finishTime || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
