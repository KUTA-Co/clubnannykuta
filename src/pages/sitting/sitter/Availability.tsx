import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2, Calendar, Clock, X } from "lucide-react";
import { formatDateOnly } from "@/lib/dateOnly";

const API_URL = import.meta.env.VITE_API_URL || '';

interface BlockedSlot {
  _id?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  isAllDay: boolean;
}

interface DayAvailability {
  available: boolean;
  start: string;
  end: string;
}

interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

const defaultDayAvailability: DayAvailability = {
  available: true,
  start: '08:00',
  end: '22:00'
};

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SitterAvailability() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>({
    monday: { ...defaultDayAvailability },
    tuesday: { ...defaultDayAvailability },
    wednesday: { ...defaultDayAvailability },
    thursday: { ...defaultDayAvailability },
    friday: { ...defaultDayAvailability },
    saturday: { ...defaultDayAvailability },
    sunday: { ...defaultDayAvailability }
  });
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [newBlock, setNewBlock] = useState<BlockedSlot>({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    isAllDay: true
  });

  useEffect(() => {
    fetchAvailability();
  }, [token]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sitter/availability`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.availability) {
        if (data.availability.weeklyAvailability) {
          setWeeklyAvailability(data.availability.weeklyAvailability);
        }
        setBlockedSlots(data.availability.blockedSlots || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyChange = (day: typeof days[number], field: keyof DayAvailability, value: any) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveWeekly = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/sitter/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ weeklyAvailability })
      });
      const data = await response.json();

      if (data.success) {
        if (data.availability?.weeklyAvailability) {
          setWeeklyAvailability(data.availability.weeklyAvailability);
        }
        toast({ title: "Saved!", description: "Your availability has been updated." });
      } else {
        toast({ title: "Error", description: data.message || "Failed to save availability", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sitter/availability/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newBlock)
      });
      const data = await response.json();

      if (data.success) {
        setBlockedSlots(data.availability?.blockedSlots || []);
        setNewBlock({ date: '', startTime: '', endTime: '', reason: '', isAllDay: true });
        setShowBlockForm(false);
        toast({ title: "Time Blocked", description: "The date has been blocked." });
      } else {
        toast({ title: "Error", description: data.message || "Failed to block date", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  const handleRemoveBlock = async (slotId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/sitter/availability/block/${slotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setBlockedSlots(data.availability?.blockedSlots || []);
        toast({ title: "Block Removed", description: "The date is now available." });
      } else {
        toast({ title: "Error", description: data.message || "Failed to remove block", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateOnly(dateStr, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E8A0BF' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#4A4A4A]">My Availability</h1>
        <p className="text-sm text-[#4A4A4A]/60">Set when you're available to work</p>
      </div>

      {/* Weekly Schedule - Card */}
      <div className="bg-[#F5D5E5]/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: '#E8A0BF' }} />
          <h2 className="font-semibold text-[#4A4A4A]">Weekly Schedule</h2>
        </div>

        <div className="space-y-3">
          {days.map((day, index) => (
            <div
              key={day}
              className={`flex items-center justify-between p-3 rounded-xl bg-white ${
                weeklyAvailability[day].available ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={weeklyAvailability[day].available}
                  onCheckedChange={(checked) => handleWeeklyChange(day, 'available', checked)}
                />
                <span className="font-medium text-[#4A4A4A] w-10">{dayLabels[index]}</span>
              </div>

              {weeklyAvailability[day].available ? (
                <div className="flex items-center gap-1 text-sm">
                  <input
                    type="time"
                    value={weeklyAvailability[day].start}
                    onChange={(e) => handleWeeklyChange(day, 'start', e.target.value)}
                    className="bg-[#F5D5E5]/50 rounded-lg px-2 py-1 text-[#4A4A4A] text-center w-20"
                  />
                  <span className="text-[#4A4A4A]/40">-</span>
                  <input
                    type="time"
                    value={weeklyAvailability[day].end}
                    onChange={(e) => handleWeeklyChange(day, 'end', e.target.value)}
                    className="bg-[#F5D5E5]/50 rounded-lg px-2 py-1 text-[#4A4A4A] text-center w-20"
                  />
                </div>
              ) : (
                <span className="text-sm text-[#4A4A4A]/40">Off</span>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleSaveWeekly}
          disabled={saving}
          className="w-full mt-4 text-white rounded-xl h-12"
          style={{ backgroundColor: '#E8A0BF' }}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Schedule</>
          )}
        </Button>
      </div>

      {/* Block Dates - Card */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: '#C77DA3' }} />
            <h2 className="font-semibold text-[#4A4A4A]">Blocked Dates</h2>
          </div>
          <button
            onClick={() => setShowBlockForm(!showBlockForm)}
            className="p-2 rounded-full"
            style={{ backgroundColor: '#F5D5E5' }}
          >
            {showBlockForm ? (
              <X className="w-5 h-5" style={{ color: '#C77DA3' }} />
            ) : (
              <Plus className="w-5 h-5" style={{ color: '#C77DA3' }} />
            )}
          </button>
        </div>

        {/* Add Block Form */}
        {showBlockForm && (
          <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: '#F5D5E5' }}>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#4A4A4A]">Date</label>
                <Input
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                  className="mt-1"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={newBlock.isAllDay}
                  onCheckedChange={(checked) => setNewBlock({ ...newBlock, isAllDay: checked })}
                />
                <span className="text-sm text-[#4A4A4A]">Block entire day</span>
              </div>

              {!newBlock.isAllDay && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    className="flex-1"
                  />
                  <span className="text-[#4A4A4A]/60">to</span>
                  <Input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    className="flex-1"
                  />
                </div>
              )}

              <Input
                placeholder="Reason (optional)"
                value={newBlock.reason}
                onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
              />

              <Button
                onClick={handleAddBlock}
                className="w-full text-white rounded-xl"
                style={{ backgroundColor: '#C77DA3' }}
              >
                Block Date
              </Button>
            </div>
          </div>
        )}

        {/* Blocked List */}
        {blockedSlots.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#F5D5E5' }}
            >
              <Calendar className="w-6 h-6" style={{ color: '#C77DA3' }} />
            </div>
            <p className="text-[#4A4A4A]/60 text-sm">No blocked dates</p>
            <p className="text-[#4A4A4A]/40 text-xs mt-1">
              Block dates when you can't work
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedSlots.map((slot) => (
              <div
                key={slot._id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
              >
                <div>
                  <p className="font-medium text-[#4A4A4A]">{formatDate(slot.date)}</p>
                  <p className="text-xs text-[#4A4A4A]/60">
                    {slot.isAllDay ? 'All day' : `${slot.startTime} - ${slot.endTime}`}
                    {slot.reason && ` • ${slot.reason}`}
                  </p>
                </div>
                <button
                  onClick={() => slot._id && handleRemoveBlock(slot._id)}
                  className="p-2 rounded-full text-red-400 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
