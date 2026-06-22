import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimePickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  defaultValue,
  onChange,
  className,
  placeholder = "Select time"
}: TimePickerProps) {
  const initialTime = value || defaultValue || "";
  const [hour, setHour] = React.useState<string>(initialTime ? initialTime.split(":")[0] || "" : "");
  const [minute, setMinute] = React.useState<string>(initialTime ? initialTime.split(":")[1] || "" : "");

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHour(h || "");
      setMinute(m || "");
    }
  }, [value]);

  const handleHourChange = (h: string) => {
    setHour(h);
    if (h && minute) {
      onChange?.(`${h.padStart(2, "0")}:${minute.padStart(2, "0")}`);
    }
  };

  const handleMinuteChange = (m: string) => {
    setMinute(m);
    if (hour && m) {
      onChange?.(`${hour.padStart(2, "0")}:${m.padStart(2, "0")}`);
    }
  };

  const displayValue = hour && minute 
    ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
    : "";

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  // Show common minute intervals: 00, 15, 30, 45
  const minutes = ["00", "15", "30", "45"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 w-full justify-start text-left font-body bg-white border border-[#E8E5DF] rounded-xl hover:bg-[#F5F2EB] hover:border-[#8BA99E] transition-colors",
            !displayValue && "text-[#4A4A4A]/60",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-[#4A4A4A]/60" />
          {displayValue || <span className="text-[#4A4A4A]/60">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-white border border-[#E8E5DF] rounded-2xl shadow-lg" align="start">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#4A4A4A]/60 font-body uppercase tracking-wide">Hour</label>
            <Select value={hour} onValueChange={handleHourChange}>
              <SelectTrigger className="w-20 h-12 font-body bg-white border border-[#E8E5DF] rounded-xl focus:border-[#8BA99E] focus:ring-2 focus:ring-[#8BA99E]/20">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] bg-white border border-[#E8E5DF] rounded-xl shadow-lg">
                {hours.map((h) => (
                  <SelectItem 
                    key={h} 
                    value={h}
                    className="font-body text-[#4A4A4A] hover:bg-[#F5F2EB] focus:bg-[#8BA99E] focus:text-[#4A4A4A] cursor-pointer rounded-lg mx-1 my-0.5"
                  >
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-2xl font-bold text-[#4A4A4A] pt-6">:</div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#4A4A4A]/60 font-body uppercase tracking-wide">Minute</label>
            <Select value={minute} onValueChange={handleMinuteChange}>
              <SelectTrigger className="w-20 h-12 font-body bg-white border border-[#E8E5DF] rounded-xl focus:border-[#8BA99E] focus:ring-2 focus:ring-[#8BA99E]/20">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] bg-white border border-[#E8E5DF] rounded-xl shadow-lg">
                {minutes.map((m) => (
                  <SelectItem 
                    key={m} 
                    value={m}
                    className="font-body text-[#4A4A4A] hover:bg-[#F5F2EB] focus:bg-[#8BA99E] focus:text-[#4A4A4A] cursor-pointer rounded-lg mx-1 my-0.5"
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

