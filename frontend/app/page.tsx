'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Users, 
  MessageSquare, 
  Bell, 
  Activity, 
  FileText,
  Heart,
  Clock,
  Shield,
  Zap,
  Video,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
  BarChart
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900">Health Hub EMR</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, they'll be redirected
  if (user) return null;

  const features = [
    {
      icon: Users,
      title: 'Patient Management',
      description: 'Comprehensive patient records with real-time updates, vital signs tracking, and medical history management.',
      color: 'from-sky-500 to-sky-600',
      highlights: ['Digital Records', 'Vital Signs', 'Medical History']
    },
    {
      icon: Video,
      title: 'Surgery Simulation',
      description: 'Immersive 3D surgical training with real-time collaboration, multiple surgical tools, and realistic physics.',
      color: 'from-red-500 to-red-600',
      highlights: ['3D Training', 'Real-time Collab', 'Physics Engine']
    },
    {
      icon: MessageSquare,
      title: 'Real-time Messaging',
      description: 'Instant communication between healthcare providers with patient context and secure messaging.',
      color: 'from-teal-500 to-teal-600',
      highlights: ['Instant Chat', 'Secure', 'Patient Context']
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Intelligent alerts for critical events, task reminders, and patient updates delivered in real-time.',
      color: 'from-amber-500 to-amber-600',
      highlights: ['Critical Alerts', 'Task Reminders', 'Live Updates']
    },
    {
      icon: Activity,
      title: 'Timeline & Audit Trail',
      description: 'Complete audit trail of all patient activities, treatments, and care team interactions.',
      color: 'from-red-500 to-rose-600',
      highlights: ['Full History', 'Compliance', 'Transparency']
    },
    {
      icon: FileText,
      title: 'Medical Reports',
      description: 'Generate, store, and share medical reports, lab results, and diagnostic documents securely.',
      color: 'from-cyan-500 to-sky-600',
      highlights: ['Reports', 'Lab Results', 'Documents']
    }
  ];

  const stats = [
    { label: 'Healthcare Providers', value: '500+', icon: Users },
    { label: 'Patients Managed', value: '10K+', icon: Heart },
    { label: 'Real-time Updates', value: '99.9%', icon: Zap },
    { label: 'Uptime', value: '24/7', icon: Clock }
  ];

  const roles = [
    { name: 'Doctors', description: 'Full patient management and surgery simulation access' },
    { name: 'Nurses', description: 'Patient care, vital signs, and medication management' },
    { name: 'Admins', description: 'Complete system administration and oversight' },
    { name: 'Receptionists', description: 'Patient registration and appointment management' },
    { name: 'Lab Technicians', description: 'Lab results and diagnostic report management' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-red-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-red-500/5"></div>
        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-red-600 bg-clip-text text-transparent">
                Health Hub EMR
              </span>
              <Badge variant="outline" className="ml-2 border-sky-300 text-sky-700">
                v2.0.0
              </Badge>
            </div>
            <Button 
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200 border-0 px-4 py-1.5">
                <Sparkles className="h-3 w-3 mr-1" />
                Next Generation Healthcare Platform
              </Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Healthcare
              <br />
              <span className="bg-gradient-to-r from-sky-600 to-red-500 bg-clip-text text-transparent">
                With Smart EMR
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive Electronic Medical Records system with real-time collaboration, 
              3D surgery simulation, and intelligent patient management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-sky-300 hover:bg-sky-50 hover:border-sky-400 text-sky-700 text-lg px-8 py-6"
              >
                Explore Features
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-sky-100 to-red-100 rounded-xl mb-2">
                    <stat.icon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 mb-4">
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline healthcare operations with our comprehensive suite of integrated tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Surgery Simulation Highlight */}
      <section className="py-20 bg-gradient-to-br from-red-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                Revolutionary Feature
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                3D Surgery Simulation
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Experience cutting-edge surgical training with our immersive 3D simulation platform. 
                Collaborate with colleagues in real-time, practice with realistic surgical tools, 
                and master techniques in a risk-free environment.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'Real-time multi-user collaboration',
                  '6 realistic surgical tools (Scalpel, Forceps, Suture, etc.)',
                  'Advanced physics engine for realistic tissue interaction',
                  'Shareable sessions with unique codes',
                  'Desktop and mobile support',
                  'Professional surgical environment'
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <Button 
                size="lg"
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
              >
                Try Surgery Simulation
                <Video className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-sky-400 rounded-3xl blur-3xl opacity-20"></div>
              <Card className="relative border-0 shadow-2xl overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-red-900 to-sky-900 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <Video className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">Interactive 3D Surgical Environment</p>
                    <p className="text-sm text-red-200 mt-2">Login to experience the simulation</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Access */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200 border-0 mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Secure & Flexible
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Role-Based Access Control
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tailored permissions for every member of your healthcare team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {roles.map((role, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-sky-300">
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-sky-100 to-red-100 rounded-full mb-3 mx-auto">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {role.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-sky-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-0 mb-4">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Modern Healthcare
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="text-center">
                <Globe className="h-12 w-12 text-sky-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Real-time Collaboration</CardTitle>
                <CardDescription>
                  Connect with your team instantly. Share updates, messages, and patient information in real-time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="text-center">
                <Lock className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">HIPAA Compliant</CardTitle>
                <CardDescription>
                  Enterprise-grade security with encryption, audit trails, and role-based access control.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="text-center">
                <BarChart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Analytics & Insights</CardTitle>
                <CardDescription>
                  Make data-driven decisions with comprehensive analytics and reporting tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-sky-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Healthcare Practice?
          </h2>
          <p className="text-xl mb-8 text-red-100">
            Join hundreds of healthcare providers already using Health Hub EMR to deliver better patient care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/login')}
              className="bg-white hover:bg-gray-100 text-red-600 shadow-xl text-lg px-8 py-6"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Stethoscope className="h-6 w-6 text-red-400" />
                <span className="text-xl font-bold text-white">Health Hub EMR</span>
              </div>
              <p className="text-sm">
                Next-generation healthcare platform for modern medical practices.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>Patient Management</li>
                <li>Surgery Simulation</li>
                <li>Real-time Messaging</li>
                <li>Smart Notifications</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Support</li>
                <li>Training</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Health Hub EMR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
