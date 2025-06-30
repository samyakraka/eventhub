export interface UserProfile {
  bio?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organization?: string;
  website?: string;
  location?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContact?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  company?: string;
  jobTitle?: string;
  autoFillEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Update User interface to include optional profile
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role?: "organizer" | "attendee"; // Make role optional initially
  profileImageBase64?: string | null;
  profile?: UserProfile;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: "gala" | "concert" | "marathon" | "webinar" | "conference" | "workshop";
  location?: string;
  virtualLink?: string;
  virtualType?: "meeting" | "broadcast";
  date: Date;
  time: string;
  endTime: string;
  themeColor: string;
  status: "upcoming" | "live" | "completed";
  logoBase64?: string;
  bannerBase64?: string;
  organizerUid: string;
  maxAttendees?: number;
  ticketPrice: number; // Price in USD
  isVirtual: boolean;
  requiresCheckIn: boolean; // Now required for ALL events
  discountEnabled: boolean;
  discountPercentage?: number;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  eventId: string;
  attendeeUid: string;
  qrCode: string;
  discountCode?: string;
  originalPrice: number;
  finalPrice: number;
  discountAmount?: number;
  checkedIn: boolean;
  checkInTime?: Date;
  registrationData: Record<string, any>;
  createdAt: Date;
}

export interface LiveChat {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  reactions?: { [emoji: string]: string[] };
}

export interface Donation {
  id: string;
  eventId: string;
  userId: string;
  amount: number;
  message?: string;
  createdAt: Date;
}

export interface DiscountCode {
  id: string;
  eventId: string;
  code: string;
  discount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface ReferralCode {
  id: string;
  eventId: string;
  code: string;
  referrerUid: string;
  usageCount: number;
  createdAt: Date;
}
