import nodemailer from 'nodemailer';
import { escapeHtml, stripCrlf } from '@/utils/sanitize';

declare global {
  // eslint-disable-next-line no-var
  var mailTransport: ReturnType<typeof nodemailer.createTransport> | undefined;
}

function getTransport() {
  if (!global.mailTransport) {
    global.mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return global.mailTransport;
}

function mailEnabled() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP_USER/SMTP_PASS not configured; skipping email.');
    return false;
  }
  return true;
}

interface BookingMailInfo {
  facultyEmail: string;
  facultyName: string;
  meetingType: string;
  date: string;
  startTime: string;
  endTime: string;
  scholarName?: string;
  scholarId?: string;
}

// Every value below is user-supplied (faculty name, scholar name/id, meeting
// type come straight from the booking form) and is HTML-escaped before
// going into the email body — unescaped, a booking could carry an <a>/
// <img>/<iframe> payload that renders as live markup for whoever reads the
// notification (VAPT-04).
function detailsListHtml(info: BookingMailInfo) {
  return `
    <li><strong>Date:</strong> ${escapeHtml(info.date)}</li>
    <li><strong>Time:</strong> ${escapeHtml(info.startTime)} - ${escapeHtml(info.endTime)}</li>
    ${info.scholarName ? `<li><strong>Scholar:</strong> ${escapeHtml(info.scholarName)} (${escapeHtml(info.scholarId ?? '')})</li>` : ''}
  `;
}

function detailsListText(info: BookingMailInfo) {
  const lines = [
    `Date: ${info.date}`,
    `Time: ${info.startTime} - ${info.endTime}`,
  ];
  if (info.scholarName) lines.push(`Scholar: ${info.scholarName} (${info.scholarId ?? ''})`);
  return lines.join('\n');
}

// Sent to the admin when a faculty member books a slot, so the admin knows
// to review/confirm it (bookings start as 'pending').
export async function notifyAdminOfNewBooking(info: BookingMailInfo) {
  if (!mailEnabled()) return;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_NOTIFY_EMAIL not configured; skipping admin notification email.');
    return;
  }

  // Subject lines go through stripCrlf — a value containing \r\n could
  // otherwise inject extra mail headers.
  const subject = stripCrlf(
    `New Booking Pending Confirmation: ${info.meetingType} - ${info.facultyName || info.facultyEmail}`
  );

  const transport = getTransport();
  await transport.sendMail({
    from: `"VIT SCOPE Portal" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject,
    html: `
      <p>A faculty member has booked a slot on VIT SCOPE Portal and it is awaiting your confirmation:</p>
      <ul>
        <li><strong>Meeting Type:</strong> ${escapeHtml(info.meetingType)}</li>
        <li><strong>Faculty:</strong> ${escapeHtml(info.facultyName || '')} (${escapeHtml(info.facultyEmail)})</li>
        ${detailsListHtml(info)}
      </ul>
      <p>Please confirm this booking from the Admin dashboard.</p>
    `,
    text: `A faculty member has booked a slot on VIT SCOPE Portal and it is awaiting your confirmation:

Meeting Type: ${info.meetingType}
Faculty: ${info.facultyName || ''} (${info.facultyEmail})
${detailsListText(info)}

Please confirm this booking from the Admin dashboard.`,
  });
}

// Sent to the faculty member once the admin confirms their booking.
export async function notifyFacultyOfConfirmation(info: BookingMailInfo) {
  if (!mailEnabled()) return;

  const subject = stripCrlf(`Slot Confirmed: ${info.meetingType} on ${info.date}`);

  const transport = getTransport();
  await transport.sendMail({
    from: `"VIT SCOPE Portal" <${process.env.SMTP_USER}>`,
    to: info.facultyEmail,
    subject,
    html: `
      <p>Dear ${escapeHtml(info.facultyName || 'Faculty')},</p>
      <p>Your <strong>${escapeHtml(info.meetingType)}</strong> slot has been <strong>confirmed</strong>:</p>
      <ul>${detailsListHtml(info)}</ul>
      <p><strong>Please also complete the corresponding booking on VTOP.</strong></p>
      <p>This is an automated message from VIT SCOPE Portal.</p>
    `,
    text: `Dear ${info.facultyName || 'Faculty'},

Your ${info.meetingType} slot has been confirmed:

${detailsListText(info)}

Please also complete the corresponding booking on VTOP.

This is an automated message from VIT SCOPE Portal.`,
  });
}
