"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Sparkles,
  Users,
  Calendar,
  Globe,
  Heart,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  Award,
} from "lucide-react"

export default function AboutPage() {
  const router = useRouter()

  const features = [
    {
      icon: Calendar,
      title: "Smart Event Creation",
      description: "Create stunning events in minutes with our intuitive builder and customization options.",
    },
    {
      icon: Globe,
      title: "Virtual & Hybrid Events",
      description: "Host virtual events with live streaming, interactive chat, and seamless attendee management.",
    },
    {
      icon: Shield,
      title: "Secure Check-in System",
      description: "QR code-based check-in system ensures secure and efficient attendee management.",
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Track registrations, revenue, and engagement with comprehensive analytics and insights.",
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Connect attendees through interactive features and build lasting communities.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built with modern technology for speed, reliability, and exceptional user experience.",
    },
  ]

  const stats = [
    { number: "50K+", label: "Events Created" },
    { number: "2M+", label: "Happy Attendees" },
    { number: "150+", label: "Countries" },
    { number: "99%", label: "Satisfaction Rate" },
  ]

  const team = [
    {
      name: "Alex Johnson",
      role: "Founder & CEO",
      description: "Passionate about connecting people through amazing experiences.",
    },
    {
      name: "Sarah Chen",
      role: "Head of Product",
      description: "Designing intuitive experiences that make event management effortless.",
    },
    {
      name: "Michael Rodriguez",
      role: "Lead Engineer",
      description: "Building scalable technology that powers millions of events worldwide.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                EventHub
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-8">
            <Heart className="w-4 h-4 mr-2" />
            Made with love for event creators
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            About
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent block mt-2">
              EventHub
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            We're on a mission to make event creation and management accessible to everyone, from small community
            gatherings to large-scale conferences.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                EventHub was born from the belief that everyone should have the tools to create meaningful connections
                and unforgettable experiences. Whether you're organizing a small workshop or a major conference, we
                provide the technology and support you need to succeed.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We've helped thousands of organizers bring their visions to life, connecting millions of people
                worldwide through the power of events.
              </p>
              <div className="flex items-center space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-gray-700 font-medium">Trusted by 10,000+ event creators</span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Creating Connections</h3>
                  <p className="text-gray-600">Every event is an opportunity to bring people together</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose EventHub?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built everything you need to create, manage, and grow your events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate individuals working to make events better for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                  <p className="text-gray-600 leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Values Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Award className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Excellence</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We strive for excellence in everything we build, ensuring our platform meets the highest standards of
                quality and reliability.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Community</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We believe in the power of community and work to create tools that bring people together and foster
                meaningful connections.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Zap className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Innovation</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We continuously innovate and evolve our platform to stay ahead of the curve and provide cutting-edge
                event management solutions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-pink-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Trust</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We prioritize security, privacy, and transparency in all our interactions, building lasting trust with
                our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Create Amazing Events?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of event creators who trust EventHub to bring their visions to life.
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/")}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  )
}
