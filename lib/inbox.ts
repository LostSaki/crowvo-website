/** Inbox for contact, investor, and general site inquiries. */
export function contactInboxEmail() {
  return (
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    "dylan.aruizmoya@gmail.com"
  );
}

export const CONTACT_MAILTO = `mailto:${contactInboxEmail()}`;
