"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Users, MessageSquare, Award, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Force client-side hydration to ensure auth state is correct
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show auth-dependent UI until client-side hydration is complete
  const authUI = mounted ? isAuthenticated : false;

  const getDashboardLink = () => {
    if (!user) return "/dashboard";

    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "SPEAKER":
        return "/speaker/dashboard";
      default:
        return "/dashboard";
    }
  };
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gradient-to-b from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob dark:opacity-30"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000 dark:opacity-30"></div>
        <div className="absolute bottom-8 left-1/4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000 dark:opacity-30"></div>
      </div>

      {/* Hero section */}
      <motion.div
        className="z-10 max-w-5xl w-full flex flex-col items-center justify-center text-center mt-20 mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Welcome to Speaker Connect
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-3xl">
          Book exclusive one-on-one sessions with industry experts and thought leaders.
          Elevate your knowledge with personalized guidance from professionals.
        </p>
        <div className="flex gap-4">
          {authUI ? (
            <Link href={getDashboardLink()} passHref>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login" passHref>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">Login</Button>
              </Link>
              <Link href="/auth/signup" passHref>
                <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* Features section */}
      <motion.section
        className="w-full max-w-6xl mx-auto mb-16 px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-center mb-12 text-neutral-800 dark:text-white">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
              title: "Find Experts",
              description: "Browse through our curated list of industry experts and thought leaders."
            },
            {
              icon: <CalendarDays className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
              title: "Book Sessions",
              description: "Select available time slots that work with your schedule."
            },
            {
              icon: <CheckCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
              title: "Attend with QR Code",
              description: "Receive a QR code for easy check-in at your scheduled session."
            }
          ].map((feature, index) => (
            <Card key={index} className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900/50 shadow-md">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neutral-800 dark:text-white">{feature.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Testimonials section */}
      <motion.section
        className="w-full max-w-6xl mx-auto mb-20 px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-center mb-12 text-neutral-800 dark:text-white">Featured Speakers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Dr. Sarah Johnson",
              role: "AI Researcher",
              image: "https://randomuser.me/api/portraits/women/44.jpg",
              quote: "Specializing in artificial intelligence and machine learning algorithms."
            },
            {
              name: "Michael Chen",
              role: "Web Developer",
              image: "https://randomuser.me/api/portraits/men/32.jpg",
              quote: "Expert in modern web technologies and cloud architecture."
            },
            {
              name: "Emma Rodriguez",
              role: "UX Designer",
              image: "https://randomuser.me/api/portraits/women/68.jpg",
              quote: "Creating intuitive and accessible interfaces for digital products."
            }
          ].map((testimonial, index) => (
            <Card key={index} className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900/50 shadow-md overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-200 dark:border-blue-900"
                  />
                  <div>
                    <h3 className="font-semibold text-neutral-800 dark:text-white">{testimonial.name}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 italic">{testimonial.quote}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* CTA section */}
      <motion.section
        className="w-full max-w-4xl mx-auto text-center mb-16 px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-8 md:p-12 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Connect with Experts?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            {authUI
              ? "Browse our expert speakers and book your next session now."
              : "Join our platform today and start booking sessions with industry-leading professionals."
            }
          </p>
          {authUI ? (
            <Link href={getDashboardLink()} passHref>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-neutral-900 dark:text-blue-400 dark:hover:bg-neutral-800">
                Explore Speakers
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signup" passHref>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-neutral-900 dark:text-blue-400 dark:hover:bg-neutral-800">
                Get Started Now
              </Button>
            </Link>
          )}
        </div>
      </motion.section>
    </main>
  );
}

