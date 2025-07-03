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
  // Organization-specific fields
  organizationName?: string;
  organizationType?:
    | "nonprofit"
    | "corporate"
    | "educational"
    | "government"
    | "individual"
    | "other";
  taxId?: string;
  businessLicense?: string;
  establishedYear?: number;
  employeeCount?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  industry?: string;
  businessDescription?: string;
  socialMediaLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  bankingDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  contactPerson?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  eventManagementExperience?: string;
  specializations?: string[];
  certifications?: string[];
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    expiryDate?: string;
  };
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
  startDate: Date;
  endDate: Date;
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

export interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "number"
    | "date"
    | "select"
    | "radio"
    | "checkbox"
    | "textarea"
    | "file";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  order: number;
}

export interface CustomForm {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

// Predefined form field templates
export const FORM_FIELD_TEMPLATES: Omit<FormField, "id" | "order">[] = [
  // Personal Information
  {
    type: "text",
    label: "Full Name",
    placeholder: "Enter your full name",
    required: true,
  },
  {
    type: "text",
    label: "Father's Name",
    placeholder: "Enter your father's name",
    required: false,
  },
  {
    type: "text",
    label: "Mother's Name",
    placeholder: "Enter your mother's name",
    required: false,
  },
  { type: "date", label: "Date of Birth", required: true },
  {
    type: "select",
    label: "Gender",
    options: ["Male", "Female", "Other", "Prefer not to say"],
    required: false,
  },
  {
    type: "select",
    label: "Sexual Orientation",
    options: [
      "Straight",
      "Gay",
      "Lesbian",
      "Bisexual",
      "Pansexual",
      "Asexual",
      "Other",
      "Prefer not to say",
    ],
    required: false,
  },

  // Contact Information
  {
    type: "email",
    label: "Email Address",
    placeholder: "Enter your email address",
    required: true,
  },
  {
    type: "phone",
    label: "Phone Number",
    placeholder: "Enter your phone number",
    required: true,
  },
  {
    type: "text",
    label: "Alternate Phone",
    placeholder: "Enter alternate phone number",
    required: false,
  },

  // Address Information
  {
    type: "textarea",
    label: "Address",
    placeholder: "Enter your complete address",
    required: false,
  },
  {
    type: "text",
    label: "City",
    placeholder: "Enter your city",
    required: false,
  },
  {
    type: "text",
    label: "State",
    placeholder: "Enter your state",
    required: false,
  },
  {
    type: "text",
    label: "Pincode",
    placeholder: "Enter your pincode",
    required: false,
  },
  {
    type: "text",
    label: "Country",
    placeholder: "Enter your country",
    required: false,
  },

  // Professional Information
  {
    type: "text",
    label: "Company/Organization",
    placeholder: "Enter your company or organization",
    required: false,
  },
  {
    type: "text",
    label: "Job Title",
    placeholder: "Enter your job title",
    required: false,
  },
  {
    type: "text",
    label: "Department",
    placeholder: "Enter your department",
    required: false,
  },
  {
    type: "number",
    label: "Years of Experience",
    placeholder: "Enter years of experience",
    required: false,
  },

  // Identity Documents
  {
    type: "text",
    label: "Passport Number",
    placeholder: "Enter your passport number",
    required: false,
  },
  {
    type: "text",
    label: "Aadhar Number",
    placeholder: "Enter your Aadhar number",
    required: false,
  },
  {
    type: "text",
    label: "PAN Number",
    placeholder: "Enter your PAN number",
    required: false,
  },
  {
    type: "text",
    label: "Driving License",
    placeholder: "Enter your driving license number",
    required: false,
  },

  // Health & Accessibility
  {
    type: "select",
    label: "Physical Disabilities",
    options: ["None", "Mobility", "Visual", "Hearing", "Cognitive", "Other"],
    required: false,
  },
  {
    type: "textarea",
    label: "Accessibility Requirements",
    placeholder: "Describe any accessibility requirements",
    required: false,
  },
  {
    type: "select",
    label: "Dietary Restrictions",
    options: [
      "None",
      "Vegetarian",
      "Vegan",
      "Gluten-free",
      "Dairy-free",
      "Nut-free",
      "Halal",
      "Kosher",
      "Other",
    ],
    required: false,
  },
  {
    type: "textarea",
    label: "Medical Conditions",
    placeholder: "Any medical conditions we should be aware of",
    required: false,
  },

  // Emergency Contact
  {
    type: "text",
    label: "Emergency Contact Name",
    placeholder: "Enter emergency contact name",
    required: false,
  },
  {
    type: "phone",
    label: "Emergency Contact Phone",
    placeholder: "Enter emergency contact phone",
    required: false,
  },
  {
    type: "text",
    label: "Relationship to Emergency Contact",
    placeholder: "e.g., Spouse, Parent, Friend",
    required: false,
  },

  // Event Specific
  {
    type: "select",
    label: "How did you hear about this event?",
    options: [
      "Social Media",
      "Email",
      "Friend/Family",
      "Website",
      "Advertisement",
      "Other",
    ],
    required: false,
  },
  {
    type: "checkbox",
    label: "I agree to receive updates about future events",
    options: ["Yes"],
    required: false,
  },
  {
    type: "checkbox",
    label: "I agree to the terms and conditions",
    options: ["Yes"],
    required: true,
  },
  {
    type: "checkbox",
    label: "I consent to photos/videos being taken",
    options: ["Yes"],
    required: false,
  },

  // Custom Fields
  {
    type: "textarea",
    label: "Additional Comments",
    placeholder: "Any additional information you'd like to share",
    required: false,
  },
  {
    type: "file",
    label: "Upload Document",
    placeholder: "Upload any relevant documents",
    required: false,
  },
];
