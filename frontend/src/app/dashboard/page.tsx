"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store";
import { bookingAPI, speakerAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addHours } from "date-fns";
import { Download, Calendar, Share } from "lucide-react";
import { jsPDF } from "jspdf";
import { useNotificationStore } from "@/lib/notification-store";
import { PaymentModal } from "@/components/ui/payment-modal";
import { CountdownTimer } from "@/components/ui/countdown-timer";

interface Booking {
  id: number;
  slot: {
    session_date: string;
    hour: number;
    speaker: {
      profile: {
        full_name: string;
        expertise: string;
      };
    };
  };
  qr_code_url: string;
  checked_in: boolean;
  created_at: string;
}

interface Speaker {
  id: string;
  fullName: string;
  email: string;
  expertise: string;
  bio: string;
  pricePerHour: number;
  avatarUrl: string;
}

interface Slot {
  id: number;
  session_date: string;
  hour: number;
}

export default function UserDashboard() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    slotId: number;
    amount: number;
    speakerName: string;
    sessionDate: string;
    sessionTime: string;
  } | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingAPI.getMyBookings();
        setBookings(response.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load your bookings");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSpeakers = async () => {
      try {
        setIsLoadingSpeakers(true);
        const response = await speakerAPI.getAllSpeakers();
        setSpeakers(response.data);
      } catch (error) {
        console.error("Error fetching speakers:", error);
        toast.error("Failed to load speakers");
      } finally {
        setIsLoadingSpeakers(false);
      }
    };

    fetchBookings();
    fetchSpeakers();
  }, []);

  const handleViewQR = async (bookingId: number) => {
    try {
      const response = await bookingAPI.getBookingQr(bookingId);
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking({
          ...booking,
          qr_code_url: response.data.qr_code_url
        });

        // Show reminder notification if the session is upcoming and not checked in
        if (!booking.checked_in) {
          const sessionDate = new Date(booking.slot.session_date);
          const today = new Date();
          const sessionTime = new Date(sessionDate);
          sessionTime.setHours(booking.slot.hour, 0, 0, 0);

          // If session is today or in the future
          if (sessionDate >= today) {
            addNotification({
              title: "Session Reminder",
              message: `Don't forget your session with ${booking.slot.speaker.profile.full_name} on ${formatDate(booking.slot.session_date)} at ${formatTime(booking.slot.hour)}.`,
              type: "info",
              action: {
                label: "Add to Calendar",
                onClick: () => handleAddToCalendar(booking)
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      toast.error("Failed to load QR code");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (hour: number) => {
    return `${hour}:00 - ${hour + 1}:00`;
  };

  // Function to download QR code as PDF
  const handleDownloadQR = async (bookingId: number, speakerName: string, sessionDate: string, sessionHour: number) => {
    try {
      // Get the QR code
      const response = await bookingAPI.getBookingQr(bookingId);
      const qrCodeUrl = response.data.qr_code_url;

      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(20);
      pdf.text('Conference Session QR Code', 105, 20, { align: 'center' });

      // Add session details
      pdf.setFontSize(12);
      pdf.text(`Speaker: ${speakerName}`, 20, 40);
      pdf.text(`Date: ${formatDate(sessionDate)}`, 20, 50);
      pdf.text(`Time: ${formatTime(sessionHour)}`, 20, 60);
      pdf.text('Please present this QR code at the venue for check-in', 20, 70);

      // Add QR code image
      const img = new Image();
      img.src = qrCodeUrl;

      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Add the QR code to the PDF
      pdf.addImage(img, 'PNG', 65, 80, 80, 80);

      // Add footer
      pdf.setFontSize(10);
      pdf.text('Generated by Conference Management System', 105, 180, { align: 'center' });

      // Save the PDF
      pdf.save(`conference-session-${bookingId}.pdf`);

      toast.success('QR code downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  // Function to add event to calendar
  const handleAddToCalendar = (booking: Booking) => {
    const { slot } = booking;
    const speakerName = slot.speaker.profile.full_name;
    const sessionDate = new Date(slot.session_date);
    const startHour = slot.hour;
    const endHour = startHour + 1;

    // Format date for calendar
    sessionDate.setHours(startHour, 0, 0);
    const endDate = new Date(sessionDate);
    endDate.setHours(endHour, 0, 0);

    // Create calendar event URL (works with Google Calendar, Outlook, etc.)
    const eventTitle = encodeURIComponent(`Conference Session with ${speakerName}`);
    const eventDetails = encodeURIComponent(`Your booked session with ${speakerName}. Please bring your QR code for check-in.`);
    const eventLocation = encodeURIComponent('Conference Venue');

    const startDateStr = sessionDate.toISOString().replace(/-|:|\.\d+/g, '');
    const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, '');

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${eventDetails}&location=${eventLocation}&dates=${startDateStr}/${endDateStr}`;

    // Open calendar in new tab
    window.open(calendarUrl, '_blank');
  };

  // Function to share booking
  const handleShareBooking = async (booking: Booking) => {
    const { slot } = booking;
    const speakerName = slot.speaker.profile.full_name;
    const sessionDate = formatDate(slot.session_date);
    const sessionTime = formatTime(slot.hour);

    const shareText = `I've booked a conference session with ${speakerName} on ${sessionDate} at ${sessionTime}!`;

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Conference Session',
          text: shareText,
        });
        toast.success('Shared successfully');
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to clipboard
        copyToClipboard(shareText);
      }
    } else {
      // Fallback to clipboard
      copyToClipboard(shareText);
    }
  };

  // Helper function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy'));
  };

  // Function to fetch available slots for a speaker on a specific date
  const fetchAvailableSlots = async () => {
    if (!selectedSpeakerId || !selectedDate) return;

    setIsLoadingSlots(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await speakerAPI.getSpeakerSlots(selectedSpeakerId, formattedDate);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error("Failed to load available slots");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Function to initiate booking process
  const handleBookSlot = async (slotId: number) => {
    // Find the selected speaker
    const selectedSpeaker = speakers.find(speaker => speaker.id === selectedSpeakerId);
    if (!selectedSpeaker) return;

    // Find the selected slot
    const selectedSlot = availableSlots.find(slot => slot.id === slotId);
    if (!selectedSlot) return;

    // Set payment details
    setPaymentDetails({
      slotId,
      amount: selectedSpeaker.pricePerHour || 100, // Default to 100 if no price set
      speakerName: selectedSpeaker.fullName,
      sessionDate: formatDate(selectedSlot.session_date),
      sessionTime: formatTime(selectedSlot.hour)
    });

    // Show payment modal
    setShowPayment(true);
  };

  // Function to complete booking after payment
  const handleCompleteBooking = async () => {
    if (!paymentDetails) return;

    setIsBooking(true);
    try {
      await bookingAPI.createBooking({ slotId: paymentDetails.slotId });
      toast.success("Session booked successfully!");

      // Refresh bookings
      const response = await bookingAPI.getMyBookings();
      const newBookings = response.data;
      setBookings(newBookings);

      // Find the newly created booking
      const newBooking = newBookings.find(booking =>
        booking.slot.id === paymentDetails.slotId ||
        (newBookings.length > 0 && newBookings[0].id > (bookings[0]?.id || 0))
      );

      if (newBooking) {
        // Show notification with calendar action
        addNotification({
          title: "Session Booked Successfully",
          message: `Your session with ${newBooking.slot.speaker.profile.full_name} on ${formatDate(newBooking.slot.session_date)} at ${formatTime(newBooking.slot.hour)} has been confirmed.`,
          type: "success",
          action: {
            label: "Add to Calendar",
            onClick: () => handleAddToCalendar(newBooking)
          }
        });

        // Set the selected booking to show QR code
        setSelectedBooking({
          ...newBooking,
          qr_code_url: newBooking.qr_code_url || ''
        });
      }

      // Clear selection
      setSelectedSpeakerId(null);
      setSelectedDate(null);
      setAvailableSlots([]);
      setShowPayment(false);
      setPaymentDetails(null);
    } catch (error: any) {
      console.error("Error booking slot:", error);
      toast.error(error.response?.data?.error || "Failed to book session");
    } finally {
      setIsBooking(false);
    }
  };

  // Effect to fetch available slots when speaker or date changes
  useEffect(() => {
    if (selectedSpeakerId && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedSpeakerId, selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Welcome, {user?.fullName || 'User'}</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your conference sessions and bookings</p>
        </header>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="qrcodes">My QR Codes</TabsTrigger>
            <TabsTrigger value="explore">Explore Speakers</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Upcoming session countdown */}
            {!isLoading && bookings.length > 0 && (
              <div className="mb-6">
                {(() => {
                  // Find the next upcoming session
                  const now = new Date();
                  const upcomingBookings = bookings
                    .filter(booking => !booking.checked_in)
                    .map(booking => {
                      const sessionDate = new Date(booking.slot.session_date);
                      sessionDate.setHours(booking.slot.hour, 0, 0, 0);
                      return {
                        booking,
                        date: sessionDate
                      };
                    })
                    .filter(item => item.date > now)
                    .sort((a, b) => a.date.getTime() - b.date.getTime());

                  if (upcomingBookings.length > 0) {
                    const nextSession = upcomingBookings[0];
                    const sessionEndTime = addHours(nextSession.date, 1);

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <CountdownTimer
                          targetDate={nextSession.date}
                          title={`Next Session with ${nextSession.booking.slot.speaker.profile.full_name}`}
                          description={`${formatDate(nextSession.booking.slot.session_date)} at ${formatTime(nextSession.booking.slot.hour)}`}
                        />
                      </motion.div>
                    );
                  }

                  return null;
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Loading skeletons
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2 dark:bg-neutral-800" />
                      <Skeleton className="h-4 w-1/2 dark:bg-neutral-800" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2 dark:bg-neutral-800" />
                      <Skeleton className="h-4 w-2/3 mb-2 dark:bg-neutral-800" />
                      <Skeleton className="h-4 w-1/2 mb-4 dark:bg-neutral-800" />
                      <Skeleton className="h-9 w-full dark:bg-neutral-800" />
                    </CardContent>
                  </Card>
                ))
              ) : bookings.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">You don't have any bookings yet.</p>
                  <Button asChild variant="outline" className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                    <a href="#explore">Explore Speakers</a>
                  </Button>
                </div>
              ) : (
                bookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="h-full"
                  >
                    <Card className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl dark:text-white">
                          Session with {booking.slot.speaker.profile.full_name}
                        </CardTitle>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{booking.slot.speaker.profile.expertise}</p>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col">
                        <div className="mb-4 flex-grow">
                          <p className="text-neutral-700 dark:text-neutral-300">
                            <strong>Date:</strong> {formatDate(booking.slot.session_date)}
                          </p>
                          <p className="text-neutral-700 dark:text-neutral-300">
                            <strong>Time:</strong> {formatTime(booking.slot.hour)}
                          </p>
                          <p className="text-neutral-700 dark:text-neutral-300">
                            <strong>Status:</strong>{" "}
                            <span className={booking.checked_in ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"}>
                              {booking.checked_in ? "Checked In" : "Not Checked In"}
                            </span>
                          </p>
                        </div>
                        <Button
                          onClick={() => handleViewQR(booking.id)}
                          className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        >
                          View QR Code
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="qrcodes" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">My QR Codes</h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                All your QR codes for upcoming sessions in one place.
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array(2).fill(0).map((_, i) => (
                  <Card key={i} className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2 dark:bg-neutral-800" />
                      <Skeleton className="h-4 w-1/2 dark:bg-neutral-800" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <Skeleton className="h-48 w-48 mb-4 dark:bg-neutral-800" />
                      <Skeleton className="h-4 w-full mb-2 dark:bg-neutral-800" />
                      <Skeleton className="h-4 w-2/3 dark:bg-neutral-800" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">You don't have any bookings yet.</p>
                <Button asChild variant="outline" className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                  <a href="#explore">Explore Speakers</a>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bookings.filter(b => !b.checked_in).map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Card className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-xl dark:text-white">
                          Session with {booking.slot.speaker.profile.full_name}
                        </CardTitle>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {formatDate(booking.slot.session_date)} at {formatTime(booking.slot.hour)}
                        </p>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center">
                        <div
                          className="bg-white dark:bg-neutral-800 p-4 rounded-lg flex justify-center mb-4 w-48 h-48 relative"
                          onClick={() => handleViewQR(booking.id)}
                        >
                          {booking.qr_code_url ? (
                            <img
                              src={booking.qr_code_url}
                              alt={`QR Code for session with ${booking.slot.speaker.profile.full_name}`}
                              className="max-w-full h-auto"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Button
                                onClick={() => handleViewQR(booking.id)}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                              >
                                Load QR Code
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                          Show this QR code at the venue to check in
                        </p>
                        <p className={`text-sm font-semibold mt-2 ${booking.checked_in ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"}`}>
                          {booking.checked_in ? "Checked In" : "Not Checked In"}
                        </p>

                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadQR(
                                booking.id,
                                booking.slot.speaker.profile.full_name,
                                booking.slot.session_date,
                                booking.slot.hour
                              );
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-1 border-neutral-300 dark:border-neutral-700"
                          >
                            <Download size={14} />
                            <span className="text-xs">PDF</span>
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCalendar(booking);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-1 border-neutral-300 dark:border-neutral-700"
                          >
                            <Calendar size={14} />
                            <span className="text-xs">Calendar</span>
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareBooking(booking);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-1 border-neutral-300 dark:border-neutral-700"
                          >
                            <Share size={14} />
                            <span className="text-xs">Share</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explore" id="explore">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Explore Speakers</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Browse our expert speakers and book a session.
              </p>

              {isLoadingSpeakers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4 mb-2">
                          <Skeleton className="h-12 w-12 rounded-full dark:bg-neutral-800" />
                          <div>
                            <Skeleton className="h-5 w-32 mb-1 dark:bg-neutral-800" />
                            <Skeleton className="h-4 w-24 dark:bg-neutral-800" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2 dark:bg-neutral-800" />
                        <Skeleton className="h-4 w-full mb-2 dark:bg-neutral-800" />
                        <Skeleton className="h-4 w-2/3 mb-4 dark:bg-neutral-800" />
                        <Skeleton className="h-9 w-full dark:bg-neutral-800" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : speakers.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-2">No speakers available at the moment.</p>
                  <p className="text-neutral-500 dark:text-neutral-500 text-sm">Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {speakers.map((speaker) => (
                    <motion.div
                      key={speaker.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -5 }}
                      className="h-full"
                    >
                      <Card className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 h-full flex flex-col overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-4">
                            {speaker.avatarUrl ? (
                              <img
                                src={speaker.avatarUrl}
                                alt={speaker.fullName}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-300">
                                {speaker.fullName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg dark:text-white">{speaker.fullName}</CardTitle>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">{speaker.expertise}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col">
                          <div className="mb-4 flex-grow">
                            <p className="text-neutral-700 dark:text-neutral-300 text-sm line-clamp-3 mb-2">
                              {speaker.bio || "No bio available."}
                            </p>
                            {speaker.pricePerHour && (
                              <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                                ${speaker.pricePerHour}/hour
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedSpeakerId(speaker.id);
                              setSelectedDate(new Date());
                            }}
                            className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                          >
                            View Available Slots
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* QR Code Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white">Your QR Code</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Show this QR code at the venue to check in for your session with{" "}
              <strong className="dark:text-white">{selectedBooking.slot.speaker.profile.full_name}</strong> on{" "}
              {formatDate(selectedBooking.slot.session_date)} at {formatTime(selectedBooking.slot.hour)}.
            </p>
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg flex justify-center mb-4">
              <img
                src={selectedBooking.qr_code_url}
                alt="Booking QR Code"
                className="max-w-full h-auto"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Button
                onClick={() => handleDownloadQR(
                  selectedBooking.id,
                  selectedBooking.slot.speaker.profile.full_name,
                  selectedBooking.slot.session_date,
                  selectedBooking.slot.hour
                )}
                variant="outline"
                className="flex items-center justify-center gap-2 border-neutral-300 dark:border-neutral-700"
              >
                <Download size={16} />
                <span>Download</span>
              </Button>

              <Button
                onClick={() => handleAddToCalendar(selectedBooking)}
                variant="outline"
                className="flex items-center justify-center gap-2 border-neutral-300 dark:border-neutral-700"
              >
                <Calendar size={16} />
                <span>Calendar</span>
              </Button>

              <Button
                onClick={() => handleShareBooking(selectedBooking)}
                variant="outline"
                className="flex items-center justify-center gap-2 border-neutral-300 dark:border-neutral-700"
              >
                <Share size={16} />
                <span>Share</span>
              </Button>
            </div>

            <Button
              onClick={() => setSelectedBooking(null)}
              className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              Close
            </Button>
          </motion.div>
        </div>
      )}

      {/* Available Slots Modal */}
      {selectedSpeakerId && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Available Slots
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
                onClick={() => {
                  setSelectedSpeakerId(null);
                  setSelectedDate(null);
                }}
              >
                ✕
              </Button>
            </div>

            {isLoadingSlots ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-neutral-600 dark:text-neutral-400 mb-2">No available slots for this date.</p>
                <p className="text-sm text-neutral-500">Try selecting a different date.</p>
                <div className="mt-4">
                  <input
                    type="date"
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        setSelectedDate(date);
                      }
                    }}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                    Select a time slot for{" "}
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Change date
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      value={format(selectedDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        if (!isNaN(date.getTime())) {
                          setSelectedDate(date);
                        }
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {availableSlots.map((slot) => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                      className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 flex justify-between items-center"
                    >
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {formatTime(slot.hour)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleBookSlot(slot.id)}
                        disabled={isBooking}
                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 transition-all duration-200 hover:scale-105"
                      >
                        {isBooking ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-1 h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                            Booking...
                          </span>
                        ) : (
                          "Book"
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    setSelectedSpeakerId(null);
                    setSelectedDate(null);
                  }}
                  variant="outline"
                  className="w-full border-neutral-300 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </Button>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && paymentDetails && (
        <PaymentModal
          amount={paymentDetails.amount}
          speakerName={paymentDetails.speakerName}
          sessionDate={paymentDetails.sessionDate}
          sessionTime={paymentDetails.sessionTime}
          onCancel={() => {
            setShowPayment(false);
            setPaymentDetails(null);
          }}
          onComplete={handleCompleteBooking}
        />
      )}
    </div>
  );
}
