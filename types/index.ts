export interface User {
  uid: string
  email: string
  displayName: string
  role: "organizer" | "attendee"
  profileImageBase64?: string
  createdAt: Date
}

export interface Event {
  id: string
  title: string
  description: string
  type: "gala" | "concert" | "marathon" | "webinar" | "conference" | "workshop"
  location?: string
  virtualLink?: string
  virtualType?: "meeting" | "broadcast"
  date: Date
  time: string
  endTime: string
  themeColor: string
  status: "upcoming" | "live" | "completed"
  logoBase64?: string
  bannerBase64?: string
  organizerUid: string
  maxAttendees?: number
  ticketPrice: number
  isVirtual: boolean
  requiresCheckIn: boolean // Now required for ALL events
  discountEnabled: boolean
  discountPercentage?: number
  createdAt: Date
}

export interface Ticket {
  id: string
  eventId: string
  attendeeUid: string
  qrCode: string
  discountCode?: string
  originalPrice: number
  finalPrice: number
  discountAmount?: number
  checkedIn: boolean
  checkInTime?: Date
  registrationData: Record<string, any>
  createdAt: Date
}

export interface LiveChat {
  id: string
  eventId: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  reactions?: { [emoji: string]: string[] }
}

export interface Donation {
  id: string
  eventId: string
  userId: string
  amount: number
  message?: string
  createdAt: Date
}

export interface DiscountCode {
  id: string
  eventId: string
  code: string
  discount: number
  usageLimit: number
  usedCount: number
  isActive: boolean
}

export interface ReferralCode {
  id: string
  eventId: string
  code: string
  referrerUid: string
  usageCount: number
  createdAt: Date
}
