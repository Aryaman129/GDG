"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store";
import { speakerAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parse, startOfDay, isValid, getMonth, getYear } from "date-fns";
import axios from "axios";

// Helper functions for income calculations
const calculateMonthlyIncome = (bookings: Booking[], pricePerHour: number | null, date: Date): string => {
  const currentMonth = getMonth(date);
  const currentYear = getYear(date);

  const monthlyBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.slot.session_date);
    return getMonth(bookingDate) === currentMonth && getYear(bookingDate) === currentYear;
  });

  const hourlyRate = typeof pricePerHour === 'number' ? pricePerHour : 0;
  const income = monthlyBookings.length * hourlyRate;
  return income.toFixed(2);
};

const calculateTotalIncome = (bookings: Booking[], pricePerHour: number | null): string => {
  const hourlyRate = typeof pricePerHour === 'number' ? pricePerHour : 0;
  const income = bookings.length * hourlyRate;
  return income.toFixed(2);
};

const calculateAverageIncome = (bookings: Booking[], pricePerHour: number | null): string => {
  if (bookings.length === 0) return "0.00";
  const hourlyRate = typeof pricePerHour === 'number' ? pricePerHour : 0;
  return hourlyRate.toFixed(2);
};

const getMonthlyBreakdown = (bookings: Booking[], pricePerHour: number | null) => {
  const hourlyRate = typeof pricePerHour === 'number' ? pricePerHour : 0;
  const monthlyData: Record<string, { month: string; sessions: number; income: number }> = {};

  bookings.forEach(booking => {
    const date = new Date(booking.slot.session_date);
    const monthYear = format(date, "MMMM yyyy");

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        month: monthYear,
        sessions: 0,
        income: 0
      };
    }

    monthlyData[monthYear].sessions += 1;
    monthlyData[monthYear].income += hourlyRate;
  });

  return Object.values(monthlyData).sort((a, b) => {
    // Sort by most recent month first
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateB.getTime() - dateA.getTime();
  });
};

const getIncomeByAttendee = (bookings: Booking[], pricePerHour: number | null) => {
  const hourlyRate = typeof pricePerHour === 'number' ? pricePerHour : 0;
  const attendeeData: Record<string, {
    id: string;
    name: string;
    email: string;
    sessions: number;
    income: number
  }> = {};

  bookings.forEach(booking => {
    const attendeeId = booking.user.id || booking.user.email;

    if (!attendeeData[attendeeId]) {
      attendeeData[attendeeId] = {
        id: attendeeId,
        name: booking.user.full_name,
        email: booking.user.email,
        sessions: 0,
        income: 0
      };
    }

    attendeeData[attendeeId].sessions += 1;
    attendeeData[attendeeId].income += hourlyRate;
  });

  return Object.values(attendeeData).sort((a, b) => b.income - a.income);
};

interface SpeakerProfile {
  expertise: string | null;
  price_per_hour: number | null;
  bio: string | null;
}

interface SessionSlot {
  id: number;
  session_date: string;
  hour: number;
  is_booked: boolean;
}

interface Booking {
  id: number;
  user: {
    id?: string;
    full_name: string;
    email: string;
  };
  slot: {
    session_date: string;
    hour: number;
  };
  checked_in: boolean;
  created_at: string;
}

export default function SpeakerDashboard() {
  const { user, session } = useAuthStore();
  const [profile, setProfile] = useState<SpeakerProfile>({ expertise: "", price_per_hour: null, bio: "" });
  const [slots, setSlots] = useState<SessionSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotHour, setNewSlotHour] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);

  // Fetch speaker profile, slots, and bookings on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !session) return;
      setIsLoadingProfile(true);
      setIsLoadingSlots(true);
      setIsLoadingBookings(true);

      try {
        // Fetch profile
        const speakersResponse = await speakerAPI.getAllSpeakers();
        const myProfileData = speakersResponse.data.find((s: any) => s.id === user.id);
        if (myProfileData) {
          setProfile({
            expertise: myProfileData.expertise,
            price_per_hour: myProfileData.price_per_hour,
            bio: myProfileData.bio
          });
        }

        // Fetch slots for the selected date (today by default)
        await fetchSlotsForDate(user.id, selectedDate);

        // Fetch bookings for this speaker
        // We need to create a direct API call since we don't have this in the API client
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const bookingsResponse = await axios.get(`${API_URL}/bookings/speaker`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          // For demo purposes, if user data is missing, add some demo data
          const bookingsWithUserData = bookingsResponse.data.map((booking: any) => {
            if (!booking.user || !booking.user.id) {
              return {
                ...booking,
                user: {
                  ...booking.user,
                  id: `attendee-${booking.id}`,
                  full_name: booking.user?.full_name || `Attendee ${booking.id}`,
                  email: booking.user?.email || `attendee${booking.id}@example.com`
                }
              };
            }
            return booking;
          });

          setBookings(bookingsWithUserData);
        } catch (bookingError) {
          console.error("Error fetching bookings:", bookingError);
          toast.error("Failed to load your bookings");

          // For demo purposes, create some sample bookings if the API call fails
          if (profile.price_per_hour) {
            const demoBookings = [
              {
                id: 1,
                user: {
                  id: 'demo-attendee-1',
                  full_name: 'John Smith',
                  email: 'john@example.com'
                },
                slot: {
                  session_date: format(new Date(), 'yyyy-MM-dd'),
                  hour: 10
                },
                checked_in: true,
                created_at: new Date().toISOString()
              },
              {
                id: 2,
                user: {
                  id: 'demo-attendee-2',
                  full_name: 'Sarah Johnson',
                  email: 'sarah@example.com'
                },
                slot: {
                  session_date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'), // Tomorrow
                  hour: 14
                },
                checked_in: false,
                created_at: new Date().toISOString()
              },
              {
                id: 3,
                user: {
                  id: 'demo-attendee-3',
                  full_name: 'Michael Brown',
                  email: 'michael@example.com'
                },
                slot: {
                  session_date: format(new Date(Date.now() + 172800000), 'yyyy-MM-dd'), // Day after tomorrow
                  hour: 11
                },
                checked_in: false,
                created_at: new Date().toISOString()
              }
            ];
            setBookings(demoBookings);
          }
        } finally {
          setIsLoadingBookings(false);
        }

      } catch (error) {
        console.error("Error fetching speaker data:", error);
        toast.error("Failed to load your profile or slots");
      } finally {
        setIsLoadingProfile(false);
        setIsLoadingSlots(false);
      }
    };

    fetchData();
  }, [user, session]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const dataToUpdate: any = {};
      if (profile.expertise !== null) dataToUpdate.expertise = profile.expertise;
      if (profile.bio !== null) dataToUpdate.bio = profile.bio;
      if (profile.price_per_hour !== null) {
        const price = parseFloat(profile.price_per_hour as any);
        if (!isNaN(price) && price >= 0) {
          dataToUpdate.price_per_hour = price;
        } else {
          toast.error("Invalid price per hour.");
          setIsUpdatingProfile(false);
          return;
        }
      }

      await speakerAPI.updateProfile(dataToUpdate);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const hourNum = parseInt(newSlotHour, 10);
    const date = parse(newSlotDate, "yyyy-MM-dd", new Date());

    if (!isValid(date)) {
      toast.error("Invalid date format. Use YYYY-MM-DD.");
      return;
    }
    if (isNaN(hourNum) || hourNum < 9 || hourNum > 16) {
      toast.error("Invalid hour. Must be between 9 and 16.");
      return;
    }

    setIsCreatingSlot(true);
    try {
      const response = await speakerAPI.createSlot({ session_date: newSlotDate, hour: hourNum });
      toast.success(`Slot created for ${newSlotDate} at ${hourNum}:00`);

      // If the created slot is for the currently selected date, refresh the slots list
      if (newSlotDate === selectedDate) {
        // Refresh the slots for the current date
        if (user) {
          await fetchSlotsForDate(user.id, selectedDate);
        }
      } else {
        // If it's for a different date, update the selected date and fetch slots for that date
        setSelectedDate(newSlotDate);
        if (user) {
          await fetchSlotsForDate(user.id, newSlotDate);
        }
      }

      setNewSlotDate("");
      setNewSlotHour("");
    } catch (error: any) {
      console.error("Error creating slot:", error);
      toast.error(error.response?.data?.error || "Failed to create slot");
    } finally {
      setIsCreatingSlot(false);
    }
  };

  // Function to fetch slots for a specific date
  const fetchSlotsForDate = async (speakerId: string, date: string) => {
    if (!speakerId || !date) return;

    setIsLoadingSlots(true);
    try {
      const slotsResponse = await speakerAPI.getSpeakerSlots(speakerId, date);
      setSlots(slotsResponse.data);
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to load your slots");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Handle date change for viewing slots
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (user) {
      fetchSlotsForDate(user.id, newDate);
    }
  };

  const formatTime = (hour: number | string) => {
    const hourNum = typeof hour === 'string' ? parseInt(hour, 10) : hour;
    if (isNaN(hourNum)) return 'Invalid time';
    return `${hourNum}:00 - ${hourNum + 1}:00`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Speaker Dashboard</h1>
          <p className="text-neutral-600">Manage your profile and availability</p>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle>Update Your Profile</CardTitle>
                <CardDescription>Set your expertise and pricing.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-10 w-1/3 mt-4" />
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="expertise">Expertise</Label>
                      <Input
                        id="expertise"
                        name="expertise"
                        placeholder="e.g., React, AI, Public Speaking"
                        value={profile.expertise || ""}
                        onChange={handleProfileChange}
                        disabled={isUpdatingProfile}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biography</Label>
                      <textarea
                        id="bio"
                        name="bio"
                        placeholder="Tell attendees about yourself and your background"
                        value={profile.bio || ""}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={isUpdatingProfile}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_per_hour">Price per Hour ($)</Label>
                      <Input
                        id="price_per_hour"
                        name="price_per_hour"
                        type="number"
                        placeholder="e.g., 100"
                        value={profile.price_per_hour === null ? "" : profile.price_per_hour}
                        onChange={handleProfileChange}
                        disabled={isUpdatingProfile}
                        min="0"
                        step="1"
                      />
                    </div>
                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle>Add New Slot</CardTitle>
                <CardDescription>Make yourself available for booking.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSlot} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-2 flex-grow">
                    <Label htmlFor="newSlotDate">Date</Label>
                    <Input
                      id="newSlotDate"
                      type="date"
                      value={newSlotDate}
                      onChange={(e) => setNewSlotDate(e.target.value)}
                      required
                      disabled={isCreatingSlot}
                      min={format(new Date(), "yyyy-MM-dd")} // Prevent past dates
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newSlotHour">Hour (9-16)</Label>
                    <Input
                      id="newSlotHour"
                      type="number"
                      placeholder="e.g., 14 (for 2 PM)"
                      value={newSlotHour}
                      onChange={(e) => setNewSlotHour(e.target.value)}
                      required
                      disabled={isCreatingSlot}
                      min="9"
                      max="16"
                    />
                  </div>
                  <Button type="submit" disabled={isCreatingSlot} className="w-full sm:w-auto">
                    {isCreatingSlot ? "Adding..." : "Add Slot"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle>Your Current Slots</CardTitle>
                <CardDescription>Overview of your availability for the selected date.</CardDescription>
                <div className="mt-4">
                  <Label htmlFor="viewSlotDate">Select Date to View Slots</Label>
                  <Input
                    id="viewSlotDate"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="mt-1"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSlots ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-neutral-600">You have no available slots for the selected date.</p>
                ) : (
                  <ul className="space-y-2">
                    {slots.map((slot) => (
                      <li key={slot.id} className={`flex justify-between items-center p-3 rounded-md ${slot.is_booked ? 'bg-neutral-200' : 'bg-green-100'}`}>
                        <span className="font-medium">
                          {format(new Date(slot.session_date), "yyyy-MM-dd")} - {formatTime(slot.hour)}
                        </span>
                        <span className={`text-sm font-semibold ${slot.is_booked ? 'text-red-600' : 'text-green-700'}`}>
                          {slot.is_booked ? "Booked" : "Available"}
                        </span>
                        {/* TODO: Add delete button for available slots */}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>View all sessions booked with you</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-neutral-600">You have no bookings yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 text-left">Attendee</th>
                            <th className="py-2 px-4 text-left">Date</th>
                            <th className="py-2 px-4 text-left">Time</th>
                            <th className="py-2 px-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="border-b hover:bg-neutral-50">
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium">{booking.user.full_name}</div>
                                  <div className="text-sm text-neutral-500">{booking.user.email}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {format(new Date(booking.slot.session_date), "MMM d, yyyy")}
                              </td>
                              <td className="py-3 px-4">
                                {formatTime(booking.slot.hour)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.checked_in
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.checked_in ? 'Checked In' : 'Not Checked In'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income">
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle>Income Summary</CardTitle>
                <CardDescription>Track your earnings from speaker sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-neutral-600">You have no bookings yet. Income will be displayed once you have bookings.</p>
                ) : (
                  <div className="space-y-6">
                    {/* Monthly Income Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Current Month Income</h3>
                        <p className="text-2xl font-bold mt-1">
                          ${calculateMonthlyIncome(bookings, profile.price_per_hour || 0, new Date())}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Total Income</h3>
                        <p className="text-2xl font-bold mt-1">
                          ${calculateTotalIncome(bookings, profile.price_per_hour || 0)}
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Average Per Session</h3>
                        <p className="text-2xl font-bold mt-1">
                          ${calculateAverageIncome(bookings, profile.price_per_hour || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Monthly Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 px-4 text-left">Month</th>
                              <th className="py-2 px-4 text-left">Sessions</th>
                              <th className="py-2 px-4 text-left">Income</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getMonthlyBreakdown(bookings, profile.price_per_hour || 0).map((month) => (
                              <tr key={month.month} className="border-b hover:bg-neutral-50">
                                <td className="py-3 px-4 font-medium">{month.month}</td>
                                <td className="py-3 px-4">{month.sessions}</td>
                                <td className="py-3 px-4">${month.income}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Income by Attendee */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Income by Attendee</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 px-4 text-left">Attendee</th>
                              <th className="py-2 px-4 text-left">Sessions</th>
                              <th className="py-2 px-4 text-left">Income</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getIncomeByAttendee(bookings, profile.price_per_hour || 0).map((attendee) => (
                              <tr key={attendee.id} className="border-b hover:bg-neutral-50">
                                <td className="py-3 px-4">
                                  <div className="font-medium">{attendee.name}</div>
                                  <div className="text-sm text-neutral-500">{attendee.email}</div>
                                </td>
                                <td className="py-3 px-4">{attendee.sessions}</td>
                                <td className="py-3 px-4">${attendee.income}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
