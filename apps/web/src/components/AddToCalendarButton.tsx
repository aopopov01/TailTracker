/**
 * Add to Calendar Button Component
 * Dropdown menu for adding events to various calendar services
 * Uses Portal to avoid overflow:hidden clipping issues
 */

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  className?: string;
  size?: 'sm' | 'md';
}

export const AddToCalendarButton = ({
  event,
  className = '',
  size = 'md',
}: AddToCalendarButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure we have a valid Date object
  const getValidDate = (): Date => {
    if (!event.startDate) {
      console.error('AddToCalendar: No startDate provided');
      return new Date();
    }
    const date = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    if (isNaN(date.getTime())) {
      console.error('AddToCalendar: Invalid date:', event.startDate);
      return new Date();
    }
    return date;
  };

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 208 + window.scrollX, // Align right edge (w-52 = 208px)
      });
    }
  }, [isOpen]);

  // Close on outside click - check both button AND dropdown refs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedButton = buttonRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedButton && !clickedDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate close on the same click that opened
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const date = getValidDate();
    const endDate = event.endDate || new Date(date.getTime() + 60 * 60 * 1000);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      dates: `${formatGoogleDate(date)}/${formatGoogleDate(endDate)}`,
    });
    if (event.location) {
      params.set('location', event.location);
    }

    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleOutlookCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const date = getValidDate();
    const endDate = event.endDate || new Date(date.getTime() + 60 * 60 * 1000);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      body: event.description,
      startdt: date.toISOString(),
      enddt: endDate.toISOString(),
    });
    if (event.location) {
      params.set('location', event.location);
    }

    const url = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleDownloadICS = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const date = getValidDate();
    const endDate = event.endDate || new Date(date.getTime() + 60 * 60 * 1000);

    const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Escape special characters in description
    const escapedDescription = event.description
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

    const escapedTitle = event.title
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TailTracker//Pet Health//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tailtracker.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(date)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapedTitle}`,
      `DESCRIPTION:${escapedDescription}`,
    ];

    if (event.location) {
      const escapedLocation = event.location
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
      lines.push(`LOCATION:${escapedLocation}`);
    }

    lines.push('END:VEVENT', 'END:VCALENDAR');

    const icsContent = lines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  // Use Portal to render dropdown outside parent container (avoids overflow clipping)
  const dropdown = isOpen && createPortal(
    <div
      ref={dropdownRef}
      className="fixed w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999]"
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        onClick={handleGoogleCalendar}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google Calendar
      </button>

      <button
        type="button"
        onClick={handleOutlookCalendar}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.23-.578.23h-8.388v-6.06l1.884 1.32a.27.27 0 00.15.048.27.27 0 00.15-.048.228.228 0 00.078-.18v-.81a.228.228 0 00-.078-.18l-3.7-2.58a.27.27 0 00-.15-.048H12V7.5h11.184c.226 0 .42.077.578.23.158.153.238.346.238.577v-.92zM12 12.133l-6.79-4.74a.27.27 0 00-.15-.048.27.27 0 00-.15.048.228.228 0 00-.078.18v.81c0 .072.026.132.078.18l5.21 3.64-5.21 3.64a.228.228 0 00-.078.18v.81c0 .072.026.132.078.18a.27.27 0 00.15.048.27.27 0 00.15-.048L12 13.273l5.79 4.04a.27.27 0 00.15.048.27.27 0 00.15-.048.228.228 0 00.078-.18v-.81a.228.228 0 00-.078-.18l-5.21-3.64 5.21-3.64a.228.228 0 00.078-.18v-.81a.228.228 0 00-.078-.18.27.27 0 00-.15-.048.27.27 0 00-.15.048L12 12.133z"/>
        </svg>
        Outlook
      </button>

      <div className="border-t border-gray-100 my-1" />

      <button
        type="button"
        onClick={handleDownloadICS}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
      >
        <Calendar className="w-5 h-5 text-gray-500" />
        Download .ics (Apple/Other)
      </button>
    </div>,
    document.body
  );

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
      >
        <Calendar className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        <span className="hidden sm:inline">Add to Calendar</span>
        <span className="sm:hidden">Add</span>
        <ChevronDown
          className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {dropdown}
    </>
  );
};

export default AddToCalendarButton;
