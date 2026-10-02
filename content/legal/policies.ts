/** Crowvo legal document version — bump when Terms or Privacy materially change. */
export const LEGAL_VERSION = "2026-07-13";
export const LEGAL_EFFECTIVE_DATE = "July 13, 2026";
export const LEGAL_LAST_UPDATED = "July 13, 2026";

export const LEGAL_CHANGELOG: { version: string; date: string; summary: string }[] = [
  {
    version: "2026-07-13",
    date: "July 13, 2026",
    summary: "Content reports, MFA, cookie preferences, and data export/deletion tools.",
  },
  {
    version: "2026-07-12",
    date: "July 12, 2026",
    summary: "Initial Public Beta Terms of Service and Privacy Policy.",
  },
];

export type LegalSection = { id: string; title: string; paragraphs: string[] };

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "1. Agreement to these Terms",
    paragraphs: [
      "These Terms of Service (“Terms”) govern your access to and use of Crowvo’s websites, apps, and related services (the “Service”), operated in connection with the Crowvo Public Beta at crow-vo.com and app.crow-vo.com.",
      "By creating an account, clicking to accept these Terms, or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use Crowvo.",
    ],
  },
  {
    id: "beta",
    title: "2. Public Beta",
    paragraphs: [
      "Crowvo is offered as a Public Beta. Features may change, break, or be removed without notice. We may reset data, limit capacity, or pause access as needed to operate and improve the Service.",
      "Beta software is provided “as is.” We work hard to keep Crowvo reliable, but we do not guarantee uninterrupted or error-free operation during beta.",
    ],
  },
  {
    id: "eligibility",
    title: "3. Eligibility and accounts",
    paragraphs: [
      "You must be at least 13 years old to use Crowvo (or older where your country requires a higher age for social platforms). By signing up you confirm you meet this requirement.",
      "You are responsible for your account credentials and for activity under your account. Provide accurate information. One person should control one account unless we expressly allow otherwise.",
      "You may sign up with email and password or supported OAuth providers (such as Google or Apple). Keep recovery methods secure.",
    ],
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable use",
    paragraphs: [
      "You agree not to use Crowvo to: break the law; harass, threaten, or exploit others; share illegal sexual content involving minors; spam or scam; impersonate others; distribute malware; scrape or overload the Service beyond normal use; circumvent security or access controls; or sell access to Crowvo without our permission.",
      "We may remove content, restrict features, suspend, or terminate accounts that violate these Terms or put communities at risk.",
    ],
  },
  {
    id: "content",
    title: "5. Your content",
    paragraphs: [
      "You retain ownership of content you post (including Sparks, messages, media, profile information, and Realm materials you create).",
      "You grant Crowvo a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, and distribute your content solely to operate, improve, and promote the Service (for example showing your posts in feeds, Realms, and previews).",
      "You represent you have the rights needed to post your content and that it does not infringe others’ rights.",
    ],
  },
  {
    id: "realms",
    title: "6. Realms and communities",
    paragraphs: [
      "Realms are community spaces with rooms, roles, and access settings (public, invite-only, discoverable, or private). Realm owners and authorized members moderate their spaces using Crowvo’s tools.",
      "Discoverable Realms may appear in Community Marketplace and Discover surfaces. Owners control branding (name, description, icon, banner), tags, and discovery settings.",
      "Crowvo may intervene when required for safety, legal compliance, or Terms enforcement, even inside Realms.",
    ],
  },
  {
    id: "features",
    title: "7. Platform features",
    paragraphs: [
      "Crowvo may include Pulse feeds, Sparks, messaging, events, friends/follows, notifications, invites, and related tools. Feature availability can vary during beta.",
      "Some actions require permissions (for example editing a Realm or managing members). Misuse of elevated roles may result in loss of privileges or account action.",
    ],
  },
  {
    id: "termination",
    title: "8. Suspension and termination",
    paragraphs: [
      "You may leave Realms or stop using Crowvo at any time. Realm owners may delete Realms they own; that permanently removes Realm data subject to our retention practices.",
      "We may suspend or terminate access for Terms violations, risk to others, legal reasons, or operational need. We will try to provide notice when practical.",
    ],
  },
  {
    id: "disclaimers",
    title: "9. Disclaimers and limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.",
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, CROWVO AND ITS OPERATORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.",
      "Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest extent allowed by law.",
    ],
  },
  {
    id: "changes",
    title: "10. Changes to these Terms",
    paragraphs: [
      "We may update these Terms as Crowvo evolves. Material changes will update the document version and effective date. Continued use after changes become effective constitutes acceptance of the updated Terms.",
      "When we bump the legal version, we may ask you to review and accept again in Settings or at sign-in.",
    ],
  },
  {
    id: "contact",
    title: "11. Contact",
    paragraphs: [
      "Questions about these Terms: use the Contact page on crow-vo.com or reach out through in-app feedback.",
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "intro",
    title: "1. Introduction",
    paragraphs: [
      "This Privacy Policy explains how Crowvo collects, uses, and shares information when you use crow-vo.com, app.crow-vo.com, and related services.",
      // REVIEW BEFORE LAUNCH: advertising wording drafted by engineering, not counsel.
      // It removes the previous "not advertisers / we do not sell to advertisers" claim,
      // which stops being true once the ad model ships. Have a lawyer confirm the
      // wording — "sale" under CCPA/CPRA can include sharing for cross-context
      // behavioural advertising even when no money changes hands.
      "Crowvo is a community platform. We intend to support it with advertising inside the app. Advertising is not running today, and we will update this policy before it launches.",
      "We do not sell your personal information for money.",
    ],
  },
  {
    id: "collect",
    title: "2. Information we collect",
    paragraphs: [
      "Account data: email address, username, display name, password (stored hashed), OAuth identifiers if you sign in with Google or Apple, and verification status.",
      "Profile data: bio, avatar, banner, interests, location/region you choose to share, and presence/status information.",
      "Community data: Realms you join or own, roles, messages in Realm rooms, Sparks/posts and media you upload, events you create or RSVP to, friends/follows, and invites.",
      "Technical data: device/browser user agent for sessions, IP-related security signals where needed for abuse prevention, and approximate usage logs.",
      "Communications: feedback you send, waitlist or contact form submissions on the marketing site, and support messages.",
    ],
  },
  {
    id: "use",
    title: "3. How we use information",
    paragraphs: [
      "We use information to provide and secure Crowvo, authenticate you, operate Realms and feeds, send transactional email (verification, password reset), moderate abuse, improve the product, and communicate important service updates.",
      "We may use aggregated or de-identified insights to understand product health. If and when advertising launches, this section will describe exactly what information may be used to select an ad, before that happens.",
    ],
  },
  {
    id: "sharing",
    title: "4. How we share information",
    paragraphs: [
      "Other users: content and profile fields you make visible (for example public Sparks, discoverable Realm listings, usernames) can be seen by others according to your settings and Realm access rules.",
      "Service providers: hosting, databases, email delivery, and OAuth providers process data on our behalf to run Crowvo.",
      "Legal: we may disclose information if required by law or to protect rights, safety, and integrity of the Service and its users.",
    ],
  },
  {
    id: "cookies",
    title: "5. Cookies and analytics",
    paragraphs: [
      "The app uses local storage for authentication tokens during beta. The marketing site may use analytics tools (such as Google Analytics or Hotjar) when configured, to understand traffic and improve pages.",
      "We will expand cookie controls as we ship a consent experience. You can also use browser controls to limit analytics cookies where available.",
    ],
  },
  {
    id: "security",
    title: "6. Security",
    paragraphs: [
      "We use industry-standard practices such as HTTPS, hashed passwords, hashed refresh tokens, short-lived access tokens, and access controls. No method of transmission or storage is 100% secure.",
      "You can review and revoke active sessions in Password & Security settings when that feature is available on your account.",
    ],
  },
  {
    id: "retention",
    title: "7. Retention",
    paragraphs: [
      "We retain account and content data while your account is active and as needed to operate Crowvo, comply with law, and resolve disputes. Deleted Realms remove associated Realm structures; residual backups or logs may persist for a limited period.",
    ],
  },
  {
    id: "rights",
    title: "8. Your choices and rights",
    paragraphs: [
      "You can update profile information in Settings, verify your email, and manage sessions. Depending on where you live, you may have rights to access, correct, delete, or export personal data.",
      "Request privacy help via the Contact page. We will add in-app data export and account deletion flows as Crowvo matures; until then, contact us and we will help manually where feasible.",
    ],
  },
  {
    id: "children",
    title: "9. Children’s privacy",
    paragraphs: [
      "Crowvo is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has created an account, contact us and we will take appropriate steps.",
    ],
  },
  {
    id: "international",
    title: "10. International users",
    paragraphs: [
      "Crowvo may be hosted in the United States or other regions. If you access the Service from elsewhere, you understand your information may be processed in countries with different data protection laws.",
    ],
  },
  {
    id: "changes",
    title: "11. Changes to this Policy",
    paragraphs: [
      "We may update this Privacy Policy as features and laws evolve. We will update the version and “Last updated” date. Significant changes may require renewed acceptance.",
    ],
  },
  {
    id: "contact",
    title: "12. Contact",
    paragraphs: [
      "Privacy questions: use Contact on crow-vo.com or in-app feedback. Prefer a dedicated privacy inbox when available.",
    ],
  },
];
