import nodemailer from 'nodemailer';

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

function detailsList(info: BookingMailInfo) {
  return `
    <li><strong>Date:</strong> ${info.date}</li>
    <li><strong>Time:</strong> ${info.startTime} - ${info.endTime}</li>
    ${info.scholarName ? `<li><strong>Scholar:</strong> ${info.scholarName} (${info.scholarId ?? ''})</li>` : ''}
  `;
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

  const transport = getTransport();
  await transport.sendMail({
    from: `"VIT SCOPE Portal" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `New Booking Pending Confirmation: ${info.meetingType} - ${info.facultyName || info.facultyEmail}`,
    html: `
      <p>A faculty member has booked a slot on VIT SCOPE Portal and it is awaiting your confirmation:</p>
      <ul>
        <li><strong>Meeting Type:</strong> ${info.meetingType}</li>
        <li><strong>Faculty:</strong> ${info.facultyName || ''} (${info.facultyEmail})</li>
        ${detailsList(info)}
      </ul>
      <p>Please confirm this booking from the Admin dashboard.</p>
    `,
  });
}

// Sent to the faculty member once the admin confirms their booking.
export async function notifyFacultyOfConfirmation(info: BookingMailInfo) {
  if (!mailEnabled()) return;

  const transport = getTransport();
  await transport.sendMail({
    from: `"VIT SCOPE Portal" <${process.env.SMTP_USER}>`,
    to: info.facultyEmail,
    subject: `Slot Confirmed: ${info.meetingType} on ${info.date}`,
    html: `
      <p>Dear ${info.facultyName || 'Faculty'},</p>
      <p>Your <strong>${info.meetingType}</strong> slot has been <strong>confirmed</strong>:</p>
      <ul>${detailsList(info)}</ul>
      <p><strong>Please also complete the corresponding booking on VTOP.</strong></p>
      <p>This is an automated message from VIT SCOPE Portal.</p>
    `,
  });
}
