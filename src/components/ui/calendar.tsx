import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-base font-semibold font-heading text-[#4A4A4A]",
        caption_dropdowns: "flex gap-2 items-center",
        dropdown: "px-2 py-1 text-sm font-body border border-[#E8E5DF] rounded-lg bg-white hover:border-[#8BA99E] focus:border-[#8BA99E] focus:ring-2 focus:ring-[#8BA99E]/20",
        dropdown_month: "px-2 py-1 text-sm font-body border border-[#E8E5DF] rounded-lg bg-white hover:border-[#8BA99E] focus:border-[#8BA99E] focus:ring-2 focus:ring-[#8BA99E]/20",
        dropdown_year: "px-2 py-1 text-sm font-body border border-[#E8E5DF] rounded-lg bg-white hover:border-[#8BA99E] focus:border-[#8BA99E] focus:ring-2 focus:ring-[#8BA99E]/20",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-white border border-[#E8E5DF] rounded-lg p-0 hover:bg-[#F5F2EB] hover:border-[#8BA99E] transition-colors",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell: "text-[#4A4A4A]/60 rounded-md w-10 font-normal text-xs font-body",
        row: "flex w-full mt-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal font-body text-[#4A4A4A] rounded-lg hover:bg-[#F5F2EB] hover:text-[#4A4A4A] transition-colors aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#8BA99E] text-[#4A4A4A] hover:bg-[#8BA99E]/90 hover:text-[#4A4A4A] focus:bg-[#8BA99E] focus:text-[#4A4A4A] font-semibold",
        day_today: "bg-[#F5F2EB] text-[#4A4A4A] font-semibold border border-[#8BA99E]",
        day_outside:
          "day-outside text-[#4A4A4A]/30 opacity-50 aria-selected:bg-[#8BA99E]/50 aria-selected:text-[#4A4A4A] aria-selected:opacity-100",
        day_disabled: "text-[#4A4A4A]/20 opacity-30 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-[#8BA99E]/50 aria-selected:text-[#4A4A4A]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4 text-[#4A4A4A]" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4 text-[#4A4A4A]" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
