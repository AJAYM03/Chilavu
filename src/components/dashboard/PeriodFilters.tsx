import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PeriodType } from "@/pages/Dashboard";

interface PeriodFiltersProps {
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const PeriodFilters = ({ period, setPeriod, selectedDate, setSelectedDate }: PeriodFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="daily" className="text-sm px-4">Day</TabsTrigger>
          <TabsTrigger value="weekly" className="text-sm px-4">Week</TabsTrigger>
          <TabsTrigger value="monthly" className="text-sm px-4">Month</TabsTrigger>
        </TabsList>
      </Tabs>

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn("justify-start text-left font-normal h-9 text-sm")}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            {format(selectedDate, "MMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
