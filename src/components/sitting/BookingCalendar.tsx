import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, User } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { parseDateOnly } from "@/lib/dateOnly";

export interface CalendarBooking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  city?: string;
  state?: string;
  address?: string;
  status: string;
  familyId?: {
    householdName?: string;
  };
  confirmedSitterId?: {
    firstName?: string;
    lastName?: string;
  };
}

interface BookingCalendarProps {
  bookings: CalendarBooking[];
  viewerRole: "sitter" | "family";
}

const parseBookingDate = (value: string) => {
  return parseDateOnly(value) || new Date(value);
};

export function BookingCalendar({ bookings, viewerRole }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const bookingsForSelected = selectedDate
    ? bookings.filter((b) => isSameDay(parseBookingDate(b.date), selectedDate))
    : [];

  const confirmedDates = bookings
    .filter((b) => b.status === "confirmed")
    .map((b) => parseBookingDate(b.date));
  const completedDates = bookings
    .filter((b) => b.status === "completed")
    .map((b) => parseBookingDate(b.date));

  const counterpartName = (b: CalendarBooking) =>
    viewerRole === "sitter"
      ? b.familyId?.householdName || "Family"
      : `${b.confirmedSitterId?.firstName || ""} ${b.confirmedSitterId?.lastName || ""}`.trim() || "Sitter";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-xl"
            modifiers={{
              confirmed: confirmedDates,
              completed: completedDates,
            }}
            modifiersClassNames={{
              confirmed: "!bg-[#E8A0BF] !text-white font-semibold rounded-lg",
              completed: "!bg-[#F5D5E5] !text-[#9B5A80] font-semibold rounded-lg",
            }}
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 mt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "#E8A0BF" }} />
              <span className="text-xs text-[#4A4A4A]/70">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "#F5D5E5" }} />
              <span className="text-xs text-[#4A4A4A]/70">Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected day's bookings */}
      <div>
        <h3 className="font-semibold text-[#4A4A4A] mb-3">
          {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
        </h3>

        {bookingsForSelected.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "#E8A0BF" }} />
              <p className="text-sm text-[#4A4A4A]/60">No bookings on this day</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookingsForSelected.map((b) => (
              <Card key={b._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: "#C77DA3" }} />
                      <span className="font-semibold text-[#4A4A4A]">{counterpartName(b)}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: b.status === "completed" ? "#F5D5E5" : "#E8A0BF",
                        color: b.status === "completed" ? "#9B5A80" : "white",
                      }}
                    >
                      {b.status === "completed" ? "Completed" : "Confirmed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#4A4A4A]/70 mb-1">
                    <Clock className="w-4 h-4" style={{ color: "#E8A0BF" }} />
                    {b.startTime} - {b.endTime}
                  </div>
                  {(b.city || b.state) && (
                    <div className="flex items-center gap-2 text-sm text-[#4A4A4A]/70">
                      <MapPin className="w-4 h-4" style={{ color: "#E8A0BF" }} />
                      {[b.city, b.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
