"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store";
import { adminAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Stats {
  totalBookings: number;
  checkedInBookings: number;
  bookingsPerSpeaker: Array<{
    speakerName: string;
    count: number;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [qrPayload, setQrPayload] = useState("");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    message: string;
    booking?: any;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load statistics");
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrPayload.trim()) {
      toast.error("Please enter QR code data");
      return;
    }

    setIsCheckingIn(true);
    setCheckInResult(null);

    try {
      const response = await adminAPI.checkIn({ qrPayload });
      setCheckInResult({
        success: true,
        message: response.data.message,
        booking: response.data.booking
      });
      toast.success("Check-in successful!");
      
      // Refresh stats after successful check-in
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      
      // Clear the input
      setQrPayload("");
    } catch (error: any) {
      console.error("Check-in error:", error);
      setCheckInResult({
        success: false,
        message: error.response?.data?.error || "Check-in failed"
      });
      toast.error(error.response?.data?.error || "Check-in failed");
    } finally {
      setIsCheckingIn(false);
    }
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
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-600">Manage check-ins and view statistics</p>
        </header>

        <Tabs defaultValue="checkin" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="checkin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-neutral-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Check-in Attendee</CardTitle>
                  <CardDescription>Scan or paste QR code data to check in an attendee</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCheckIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qrPayload">QR Code Data</Label>
                      <Input
                        id="qrPayload"
                        placeholder="Paste QR code JSON data here"
                        value={qrPayload}
                        onChange={(e) => setQrPayload(e.target.value)}
                        required
                        disabled={isCheckingIn}
                      />
                      <p className="text-xs text-neutral-500">
                        This should be the JSON data from the QR code, e.g., {`{"bookingId":1,"userId":"123",...}`}
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isCheckingIn}
                      className="w-full bg-neutral-900 hover:bg-neutral-800"
                    >
                      {isCheckingIn ? "Processing..." : "Check In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-neutral-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Check-in Result</CardTitle>
                  <CardDescription>Status of the last check-in attempt</CardDescription>
                </CardHeader>
                <CardContent>
                  {isCheckingIn ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-1/2 mt-4" />
                    </div>
                  ) : checkInResult ? (
                    <div className={`p-4 rounded-md ${checkInResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`font-medium ${checkInResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {checkInResult.success ? '✓ Success' : '✗ Failed'}
                      </p>
                      <p className="mt-1 text-neutral-700">{checkInResult.message}</p>
                      
                      {checkInResult.success && checkInResult.booking && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="mt-3 pt-3 border-t border-green-200"
                        >
                          <p className="text-sm text-neutral-700">
                            <strong>Attendee:</strong> {checkInResult.booking.user.full_name}
                          </p>
                          <p className="text-sm text-neutral-700">
                            <strong>Speaker:</strong> {checkInResult.booking.slot.speaker.profile.full_name}
                          </p>
                          <p className="text-sm text-neutral-700">
                            <strong>Date:</strong> {new Date(checkInResult.booking.slot.session_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-neutral-700">
                            <strong>Time:</strong> {checkInResult.booking.slot.hour}:00 - {checkInResult.booking.slot.hour + 1}:00
                          </p>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      No recent check-in activity
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatsCard 
                title="Total Bookings" 
                value={stats?.totalBookings} 
                isLoading={isLoadingStats} 
                icon="📊"
              />
              <StatsCard 
                title="Checked In" 
                value={stats?.checkedInBookings} 
                isLoading={isLoadingStats} 
                icon="✓"
              />
              <StatsCard 
                title="Check-in Rate" 
                value={stats ? `${Math.round((stats.checkedInBookings / stats.totalBookings) * 100)}%` : undefined} 
                isLoading={isLoadingStats} 
                icon="📈"
              />
            </div>

            <Card className="border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle>Bookings per Speaker</CardTitle>
                <CardDescription>Number of bookings for each speaker</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : stats?.bookingsPerSpeaker.length === 0 ? (
                  <p className="text-neutral-600">No booking data available.</p>
                ) : (
                  <div className="space-y-4">
                    {stats?.bookingsPerSpeaker.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center"
                      >
                        <div className="flex-grow">
                          <p className="font-medium">{item.speakerName || 'Unknown Speaker'}</p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-48 bg-neutral-100 rounded-full h-2.5 mr-2">
                            <motion.div 
                              className="bg-neutral-700 h-2.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / Math.max(...stats.bookingsPerSpeaker.map(s => s.count))) * 100}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </motion.div>
                    ))}
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

function StatsCard({ title, value, isLoading, icon }: { title: string; value?: number | string; isLoading: boolean; icon: string }) {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{value ?? 0}</p>
            )}
          </div>
          <div className="text-2xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
