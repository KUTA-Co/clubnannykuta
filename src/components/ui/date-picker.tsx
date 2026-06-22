import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  minDate?: Date;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  className,
  placeholder = "Pick a date"
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [selectedYear, setSelectedYear] = React.useState<number>(
    value ? new Date(value).getFullYear() : new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    value ? new Date(value).getMonth() : new Date().getMonth()
  );

  React.useEffect(() => {
    if (value) {
      const dateValue = new Date(value);
      setDate(dateValue);
      setSelectedYear(dateValue.getFullYear());
      setSelectedMonth(dateValue.getMonth());
    }
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate && onChange) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
    }
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);
    // Update the date if one is already selected
    if (date) {
      const newDate = new Date(date);
      newDate.setFullYear(yearNum);
      setDate(newDate);
      if (onChange) {
        onChange(format(newDate, "yyyy-MM-dd"));
      }
    }
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month);
    setSelectedMonth(monthNum);
    // Update the date if one is already selected
    if (date) {
      const newDate = new Date(date);
      newDate.setMonth(monthNum);
      setDate(newDate);
      if (onChange) {
        onChange(format(newDate, "yyyy-MM-dd"));
      }
    }
  };

  // Generate years from 1950 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);
  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  // Disable dates outside the selected year
  const disabledDates = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (date.getFullYear() !== selectedYear) return true;
    return false;
  };

  return (
    <div className="space-y-3">
      {/* Year and Month Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-body font-medium text-[#4A4A4A]">Year *</Label>
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="h-12 font-body bg-white border border-[#E8E5DF] rounded-xl hover:border-[#8BA99E] focus:border-[#8BA99E] focus:ring-2 focus:ring-[#8BA99E]/20">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-white border border-[#E8E5DF] rounded-xl shadow-lg">
              {years.map((year) => (
                <SelectItem 
                  key={year} 
                  value={year.toString()}
                  className="font-body text-[#4A4A4A] hover:bg-[#F5F2EB] focus:bg-[#8BA99E] focus:text-[#4A4A4A] cursor-pointer rounded-lg mx-1 my-0.5"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-body font-medium text-[#4A4A4A]">Month *</Label>
          <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-12 font-body bg-white border border-[#E8E5DF] rounded-xl hover:border-[#8BA99E] focus:border-[#8BA99E] focus:ring-2 focus:ring-[#8BA99E]/20">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#E8E5DF] rounded-xl shadow-lg">
              {months.map((month) => (
                <SelectItem 
                  key={month.value} 
                  value={month.value}
                  className="font-body text-[#4A4A4A] hover:bg-[#F5F2EB] focus:bg-[#8BA99E] focus:text-[#4A4A4A] cursor-pointer rounded-lg mx-1 my-0.5"
                >
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label className="text-sm font-body font-medium text-[#4A4A4A]">Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-12 w-full justify-start text-left font-body bg-white border border-[#E8E5DF] rounded-xl hover:bg-[#F5F2EB] hover:border-[#8BA99E] transition-colors",
                !date && "text-[#4A4A4A]/60",
                className
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-[#4A4A4A]/60" />
              {date ? format(date, "PPP") : <span className="text-[#4A4A4A]/60">{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border border-[#E8E5DF] rounded-2xl shadow-lg" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              disabled={disabledDates}
              month={new Date(selectedYear, selectedMonth)}
              onMonthChange={(month) => setSelectedMonth(month.getMonth())}
              initialFocus
              className="rounded-2xl"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

