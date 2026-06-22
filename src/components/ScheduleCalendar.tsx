import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  children?: number;
  address?: string;
  location?: string;
  nanny?: {
    name: string;
    image: string;
  };
  family?: {
    name: string;
    image: string;
  };
  status: "pending" | "accepted" | "confirmed" | "completed" | "active";
}

interface ScheduleCalendarProps {
  bookings: Booking[];
  isNanny?: boolean;
}

export function ScheduleCalendar({ bookings, isNanny = false }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get bookings for selected date
  const selectedDateBookings = selectedDate
    ? bookings.filter((booking) => isSameDay(parseISO(booking.date), selectedDate))
    : [];

  // Get all booked dates
  const bookedDates = bookings.map((booking) => parseISO(booking.date));

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Get bookings count for a specific date
  const getBookingsCount = (date: Date) => {
    return bookings.filter((booking) => isSameDay(parseISO(booking.date), date)).length;
  };

  // Get status for a date (for color coding)
  const getDateStatus = (date: Date): "pending" | "confirmed" | "completed" | null => {
    const dateBookings = bookings.filter((booking) => isSameDay(parseISO(booking.date), date));
    if (dateBookings.length === 0) return null;
    
    // Priority: completed > confirmed > pending
    if (dateBookings.some((b) => b.status === "completed")) return "completed";
    if (dateBookings.some((b) => b.status === "confirmed" || b.status === "active" || b.status === "accepted")) return "confirmed";
    if (dateBookings.some((b) => b.status === "pending")) return "pending";
    return null;
  };

  return (
    <div className="space-y-4">
      <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold font-heading text-[#4A4A4A]">My Schedule</CardTitle>
              <p className="text-sm text-[#4A4A4A]/60 font-body mt-1">View and manage all your bookings</p>
            </div>
            <Button
              onClick={goToToday}
              variant="outline"
              className="font-body border-[#E8E5DF] hover:bg-[#F5F2EB] hover:border-[#8BA99E]"
            >
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Calendar */}
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                  className="h-10 w-10 border-[#E8E5DF] hover:bg-[#F5F2EB] hover:border-[#8BA99E] rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5 text-[#4A4A4A]" />
                </Button>
                <h2 className="text-xl font-semibold font-heading text-[#4A4A4A]">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  className="h-10 w-10 border-[#E8E5DF] hover:bg-[#F5F2EB] hover:border-[#8BA99E] rounded-lg"
                >
                  <ChevronRight className="h-5 w-5 text-[#4A4A4A]" />
                </Button>
              </div>

              {/* Calendar */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-2xl"
                modifiers={{
                  booked: bookedDates,
                  pending: bookings.filter((b) => b.status === "pending").map((b) => parseISO(b.date)),
                  confirmed: bookings.filter((b) => b.status === "confirmed" || b.status === "active" || b.status === "accepted").map((b) => parseISO(b.date)),
                  completed: bookings.filter((b) => b.status === "completed").map((b) => parseISO(b.date)),
                }}
                modifiersClassNames={{
                  booked: "!bg-[#F5F2EB]",
                  pending: "!bg-yellow-100 !text-yellow-700 font-semibold",
                  confirmed: "!bg-[#8BA99E] !text-[#4A4A4A] font-semibold",
                  completed: "!bg-green-100 !text-green-700 font-semibold",
                }}
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4",
                  caption: "hidden",
                  caption_label: "text-lg font-semibold font-heading text-[#4A4A4A]",
                  nav: "hidden",
                  nav_button: "hidden",
                  nav_button_previous: "hidden",
                  nav_button_next: "hidden",
                  table: "w-full border-collapse space-y-2",
                  head_row: "flex mb-3",
                  head_cell: "text-[#4A4A4A]/60 rounded-md w-12 font-medium text-xs font-body uppercase tracking-wide",
                  row: "flex w-full mt-2",
                  cell: "h-12 w-12 text-center text-sm p-0 relative",
                  day: "h-12 w-12 p-0 font-normal font-body text-[#4A4A4A] rounded-lg transition-all",
                  day_selected: "ring-2 ring-[#4A4A4A] ring-offset-1 font-semibold",
                  day_today: "border-2 border-[#8BA99E] font-semibold",
                }}
              />

              {/* Legend */}
              <div className="pt-4 border-t border-[#E8E5DF]">
                <p className="text-sm font-semibold text-[#4A4A4A] font-body mb-3">Legend</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                    <span className="text-xs font-body text-[#4A4A4A]/70">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#8BA99E] border border-[#8BA99E]" />
                    <span className="text-xs font-body text-[#4A4A4A]/70">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                    <span className="text-xs font-body text-[#4A4A4A]/70">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Selected Date Bookings */}
            <div className="space-y-4">
              <div className="pb-4 border-b border-[#E8E5DF]">
                <h3 className="text-xl font-semibold font-heading text-[#4A4A4A] mb-2">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
                </h3>
                {selectedDateBookings.length === 0 ? (
                  <p className="text-sm text-[#4A4A4A]/60 font-body">No bookings on this date</p>
                ) : (
                  <p className="text-sm text-[#4A4A4A]/60 font-body">
                    {selectedDateBookings.length} {selectedDateBookings.length === 1 ? "booking" : "bookings"}
                  </p>
                )}
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {selectedDateBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F5F2EB] flex items-center justify-center mb-4">
                      <Clock className="h-8 w-8 text-[#4A4A4A]/40" />
                    </div>
                    <p className="text-sm font-medium text-[#4A4A4A] font-body mb-1">No bookings scheduled</p>
                    <p className="text-xs text-[#4A4A4A]/60 font-body">Select a date with bookings to view details</p>
                  </div>
                ) : (
                  selectedDateBookings.map((booking) => (
                    <Card key={booking.id} className="border border-[#E8E5DF] bg-white shadow-sm rounded-xl hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 border-2 border-[#8BA99E] flex-shrink-0">
                            <AvatarImage src={isNanny ? booking.family?.image : booking.nanny?.image} />
                            <AvatarFallback className="bg-[#8BA99E] text-[#4A4A4A] text-sm font-semibold">
                              {(isNanny ? booking.family?.name : booking.nanny?.name)
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <h4 className="text-base font-semibold text-[#4A4A4A] font-body mb-1">
                                  {isNanny ? booking.family?.name : booking.nanny?.name}
                                </h4>
                                <Badge
                                  className={cn(
                                    "text-xs font-body",
                                    booking.status === "pending" && "bg-yellow-100 text-yellow-700 border-yellow-300",
                                    (booking.status === "confirmed" || booking.status === "active" || booking.status === "accepted") && "bg-[#8BA99E] text-[#4A4A4A] border-[#8BA99E]",
                                    booking.status === "completed" && "bg-green-100 text-green-700 border-green-300"
                                  )}
                                >
                                  {booking.status === "pending" && "Pending"}
                                  {(booking.status === "confirmed" || booking.status === "active" || booking.status === "accepted") && "Confirmed"}
                                  {booking.status === "completed" && "Completed"}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm font-body text-[#4A4A4A]/70">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#4A4A4A]/50" />
                                <span>
                                  {booking.startTime} - {booking.endTime}
                                </span>
                                <span className="text-[#4A4A4A]/50">•</span>
                                <span>{booking.duration}</span>
                              </div>
                              {booking.children && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-[#4A4A4A]/50" />
                                  <span>{booking.children} {booking.children === 1 ? "child" : "children"}</span>
                                </div>
                              )}
                              {(booking.address || booking.location) && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-[#4A4A4A]/50 flex-shrink-0" />
                                  <span className="truncate">{booking.address || booking.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
