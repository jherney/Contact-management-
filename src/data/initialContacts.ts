import { Contact } from '../types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@techsphere.io',
    phone: '+1 (555) 234-5678',
    secondaryPhone: '+1 (555) 234-5679',
    company: 'TechSphere Solutions',
    jobTitle: 'VP of Engineering',
    category: 'Work',
    tags: ['Tech Lead', 'Key Client', 'Q3 Project'],
    avatarBgColor: 'bg-emerald-600',
    isFavorite: true,
    address: '450 Tech Way, Suite 800, San Francisco, CA 94107',
    website: 'https://techsphere.io',
    linkedIn: 'linkedin.com/in/sarah-chen-dev',
    notes: 'Key decision maker for cloud architecture strategy. Prefers morning emails or direct Slack messages.',
    customFields: [
      { id: 'cf-1', label: 'Timezone', value: 'PST (UTC-8)' },
      { id: 'cf-2', label: 'Preferred Contact Method', value: 'Email / Slack' }
    ],
    interactions: [
      {
        id: 'int-1',
        type: 'Meeting',
        date: '2026-08-05T10:30:00Z',
        summary: 'Q3 Product Roadmap Review',
        details: 'Discussed API scaling requirements and upcoming migration milestones.'
      },
      {
        id: 'int-2',
        type: 'Email',
        date: '2026-07-28T14:15:00Z',
        summary: 'Sent updated contract proposal',
        details: 'Proposal draft v2.1 attached.'
      }
    ],
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-08-05T10:30:00Z',
    lastContactedAt: '2026-08-05T10:30:00Z'
  },
  {
    id: 'contact-2',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.v@vancelegal.com',
    phone: '+1 (555) 876-5432',
    company: 'Vance & Partners Legal',
    jobTitle: 'Managing Partner',
    category: 'Client',
    tags: ['Legal', 'VIP', 'Retainer'],
    avatarBgColor: 'bg-indigo-600',
    isFavorite: true,
    address: '100 Financial Plaza, Floor 18, Chicago, IL 60603',
    website: 'https://vancelegal.com',
    linkedIn: 'linkedin.com/in/marcus-vance-esq',
    notes: 'Advises on corporate compliance and IP protection. Meeting scheduled quarterly.',
    customFields: [
      { id: 'cf-3', label: 'Assistant Name', value: 'Rachel Miller (+1 555-876-5400)' }
    ],
    interactions: [
      {
        id: 'int-3',
        type: 'Call',
        date: '2026-08-02T16:00:00Z',
        summary: 'Bi-weekly legal status phone call',
        details: 'Confirmed non-disclosure agreement renewals for external contractors.'
      }
    ],
    createdAt: '2026-02-10T11:20:00Z',
    updatedAt: '2026-08-02T16:00:00Z',
    lastContactedAt: '2026-08-02T16:00:00Z'
  },
  {
    id: 'contact-3',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@designlab.co',
    phone: '+1 (555) 345-6789',
    company: 'DesignLab Studio',
    jobTitle: 'Creative Director',
    category: 'Work',
    tags: ['UI/UX', 'Design', 'Freelancer'],
    avatarBgColor: 'bg-rose-600',
    isFavorite: false,
    address: '72 S Market St, Austin, TX 78701',
    website: 'https://designlab.co',
    notes: 'Led the UI redesign for our main product dashboard. Very responsive and creative.',
    interactions: [
      {
        id: 'int-4',
        type: 'Email',
        date: '2026-07-20T11:00:00Z',
        summary: 'Received final brand asset exports',
        details: 'Figma link and SVG assets delivered.'
      }
    ],
    createdAt: '2026-03-01T14:00:00Z',
    updatedAt: '2026-07-20T11:00:00Z',
    lastContactedAt: '2026-07-20T11:00:00Z'
  },
  {
    id: 'contact-4',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@familynet.org',
    phone: '+1 (555) 901-2345',
    company: 'Evergreen Health',
    jobTitle: 'Chief Medical Officer',
    category: 'Family',
    tags: ['Family', 'Healthcare', 'Austin'],
    avatarBgColor: 'bg-amber-600',
    isFavorite: true,
    notes: 'Cousin David. Birthday is November 14th.',
    interactions: [
      {
        id: 'int-5',
        type: 'Call',
        date: '2026-07-30T19:30:00Z',
        summary: 'Catch-up call on family dinner planning',
        details: 'Agreed to meet in Austin during Labor Day weekend.'
      }
    ],
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-07-30T19:30:00Z',
    lastContactedAt: '2026-07-30T19:30:00Z'
  },
  {
    id: 'contact-5',
    firstName: 'Amara',
    lastName: 'Okonkwo',
    email: 'amara.o@globalventures.com',
    phone: '+1 (555) 432-1098',
    company: 'Global Ventures Capital',
    jobTitle: 'Investment Partner',
    category: 'VIP',
    tags: ['Investor', 'Fintech', 'Board Member'],
    avatarBgColor: 'bg-violet-600',
    isFavorite: true,
    address: '500 Madison Ave, New York, NY 10022',
    website: 'https://globalventures.com',
    linkedIn: 'linkedin.com/in/amara-okonkwo-vc',
    notes: 'Primary investor contact. Focuses on AI and SaaS early-stage investments.',
    interactions: [
      {
        id: 'int-6',
        type: 'Meeting',
        date: '2026-08-01T15:00:00Z',
        summary: 'Monthly investor updates call',
        details: 'Shared Q2 growth figures and customer acquisition cost metrics.'
      }
    ],
    createdAt: '2026-02-28T09:00:00Z',
    updatedAt: '2026-08-01T15:00:00Z',
    lastContactedAt: '2026-08-01T15:00:00Z'
  },
  {
    id: 'contact-6',
    firstName: 'Julian',
    lastName: 'Moreno',
    email: 'j.moreno@apexlogistics.com',
    phone: '+1 (555) 678-9012',
    company: 'Apex Logistics Corp',
    jobTitle: 'Operations Director',
    category: 'Client',
    tags: ['Supply Chain', 'Logistics', 'Enterprise'],
    avatarBgColor: 'bg-cyan-600',
    isFavorite: false,
    address: '1200 Supply Chain Blvd, Atlanta, GA 30301',
    notes: 'Handles enterprise logistics routing contracts.',
    interactions: [
      {
        id: 'int-7',
        type: 'Follow-up',
        date: '2026-07-15T13:00:00Z',
        summary: 'Followed up on custom API integration docs',
        details: 'Awaiting feedback from their dev team.'
      }
    ],
    createdAt: '2026-04-12T08:30:00Z',
    updatedAt: '2026-07-15T13:00:00Z',
    lastContactedAt: '2026-07-15T13:00:00Z'
  },
  {
    id: 'contact-7',
    firstName: 'Chloe',
    lastName: 'Bennett',
    email: 'chloe.b@creativeminds.org',
    phone: '+1 (555) 567-8901',
    company: 'CreativeMinds Foundation',
    jobTitle: 'Program Manager',
    category: 'Personal',
    tags: ['Community', 'Volunteer', 'Events'],
    avatarBgColor: 'bg-teal-600',
    isFavorite: false,
    notes: 'Coordinates community tech workshops and youth mentorship programs.',
    interactions: [],
    createdAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z'
  }
];
