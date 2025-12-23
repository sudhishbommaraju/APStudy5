import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_TYPES = {
  ap_exam: { label: 'AP Exam', color: '#8B5CF6' },
  sat: { label: 'SAT', color: '#3B82F6' },
  act: { label: 'ACT', color: '#10B981' },
  school_exam: { label: 'School Exam', color: '#F59E0B' },
  study_session: { label: 'Study Session', color: '#6366F1' },
  other: { label: 'Other', color: '#64748B' },
};

export default function Calendar({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    event_type: 'other',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events', user?.email],
    queryFn: () => base44.entities.CalendarEvent.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.CalendarEvent.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowAddDialog(false);
      setNewEvent({ title: '', date: '', event_type: 'other', description: '' });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const previousMonthDays = Array.from({ length: startDay }, (_, i) => null);

  // Already filtered by user at query level
  const userEvents = events;

  const getEventsForDate = (date) => {
    return userEvents.filter(e => isSameDay(new Date(e.date), date));
  };

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date) {
      const eventData = {
        ...newEvent,
        color: EVENT_TYPES[newEvent.event_type].color,
      };
      createEventMutation.mutate(eventData);
    }
  };

  const upcomingEvents = userEvents
    .filter(e => !isBefore(startOfDay(new Date(e.date)), startOfDay(new Date())))
    .slice(0, 3);

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1 hover:bg-slate-700/50 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>
          <span className="text-sm font-medium text-slate-100 min-w-[120px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 hover:bg-slate-700/50 rounded"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
          <Button
            size="sm"
            onClick={() => {
              setNewEvent({ ...newEvent, date: format(new Date(), 'yyyy-MM-dd') });
              setShowAddDialog(true);
            }}
            className="ml-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs font-medium text-slate-400 text-center py-1">
            {day}
          </div>
        ))}
        {previousMonthDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {daysInMonth.map(day => {
          const dayEvents = getEventsForDate(day);
          const isCurrentDay = isToday(day);
          
          return (
            <button
              key={day.toString()}
              onClick={() => {
                setSelectedDate(day);
                if (dayEvents.length === 0) {
                  setNewEvent({ ...newEvent, date: format(day, 'yyyy-MM-dd') });
                  setShowAddDialog(true);
                }
              }}
              className={cn(
                "aspect-square p-1 rounded-lg text-xs transition-colors relative text-slate-300",
                isCurrentDay && "bg-violet-500/20 font-semibold text-violet-300",
                !isCurrentDay && "hover:bg-slate-700/30",
                dayEvents.length > 0 && "font-medium"
              )}
            >
              <div>{format(day, 'd')}</div>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 justify-center mt-0.5">
                  {dayEvents.slice(0, 2).map((event, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="border-t border-slate-700/30 pt-3">
          <p className="text-xs font-medium text-slate-400 mb-2">Upcoming</p>
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-start gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-100 truncate">{event.title}</p>
                  <p className="text-slate-400">{format(new Date(event.date), 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => deleteEventMutation.mutate(event.id)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
              <Input
                placeholder="e.g., AP Calculus AB Exam"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Event Type</label>
              <Select
                value={newEvent.event_type}
                onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Description (optional)</label>
              <Textarea
                placeholder="Add notes..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={2}
              />
            </div>
            <Button onClick={handleAddEvent} className="w-full" disabled={!newEvent.title || !newEvent.date}>
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}