/**
 * Calendar Utility Functions
 * Generate calendar events for vaccinations and medical appointments
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ)
 */
const formatICSDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate ICS file content (universal calendar format)
 * Works with Apple Calendar, Outlook Desktop, and other calendar apps
 */
export const generateICSFile = (event: CalendarEvent): string => {
  const endDate =
    event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000); // 1 hour default

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
    `DTSTART:${formatICSDate(event.startDate)}`,
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

  return lines.join('\r\n');
};

/**
 * Download ICS file (works on all devices)
 */
export const downloadICSFile = (event: CalendarEvent, filename: string): void => {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format date for Google Calendar URL
 */
const formatGoogleDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Generate Google Calendar URL
 */
export const getGoogleCalendarUrl = (event: CalendarEvent): string => {
  const endDate =
    event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(endDate)}`,
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Calendar URL (Outlook.com / Office 365)
 */
export const getOutlookCalendarUrl = (event: CalendarEvent): string => {
  const endDate =
    event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: event.startDate.toISOString(),
    enddt: endDate.toISOString(),
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Helper to combine a date string with a time string (HH:MM format)
 */
const combineDateAndTime = (dateStr: string, timeStr?: string): Date => {
  const date = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
};

/**
 * Create calendar event for vaccination due date
 */
export const createVaccinationCalendarEvent = (
  petName: string,
  vaccineName: string,
  dueDate: string,
  previousDate?: string,
  clinicName?: string,
  startTime?: string,
  endTime?: string
): CalendarEvent => {
  let description = `Vaccination reminder for ${petName}.\n\nVaccine: ${vaccineName}`;

  if (previousDate) {
    description += `\nPrevious vaccination: ${new Date(previousDate).toLocaleDateString()}`;
  }

  description += '\n\nScheduled via TailTracker';

  const startDate = combineDateAndTime(dueDate, startTime);
  const endDate = endTime
    ? combineDateAndTime(dueDate, endTime)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

  return {
    title: `${petName} - ${vaccineName} Vaccination Due`,
    description,
    startDate,
    endDate,
    location: clinicName,
  };
};

/**
 * Create calendar event for medical follow-up
 */
export const createMedicalFollowUpCalendarEvent = (
  petName: string,
  recordTitle: string,
  followUpDate: string,
  originalDate?: string,
  diagnosis?: string,
  clinicName?: string,
  startTime?: string,
  endTime?: string
): CalendarEvent => {
  let description = `Medical follow-up appointment for ${petName}.\n\nReason: ${recordTitle}`;

  if (originalDate) {
    description += `\nOriginal visit: ${new Date(originalDate).toLocaleDateString()}`;
  }

  if (diagnosis) {
    description += `\nDiagnosis: ${diagnosis}`;
  }

  description += '\n\nScheduled via TailTracker';

  const startDate = combineDateAndTime(followUpDate, startTime);
  const endDate = endTime
    ? combineDateAndTime(followUpDate, endTime)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

  return {
    title: `${petName} - Follow-up: ${recordTitle}`,
    description,
    startDate,
    endDate,
    location: clinicName,
  };
};
