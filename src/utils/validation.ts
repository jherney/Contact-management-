import { Contact } from '../types';

export interface ContactValidationErrors {
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  website?: string;
  linkedIn?: string;
  avatarUrl?: string;
  notes?: string;
  customFields?: string;
  general?: string;
}

/**
 * Checks if a string contains valid name characters (letters, spaces, hyphens, apostrophes, accents).
 */
export function isValidNameString(name: string): boolean {
  if (!name.trim()) return true;
  // Allow letters from any language, spaces, dots, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s\.'\-]+$/;
  return nameRegex.test(name.trim());
}

/**
 * Validates an email address. Returns true if empty or valid.
 */
export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true;
  // Standard email format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim()) && email.trim().length <= 100;
}

/**
 * Validates a phone number. Returns true if empty or contains valid phone digits/symbols.
 */
export function isValidPhone(phone: string): boolean {
  if (!phone.trim()) return true;
  // Must have at least 7 digits and only common phone chars: +, -, (), ., spaces, digits
  const sanitized = phone.replace(/[\s()+\-.]/g, '');
  const validCharsRegex = /^[0-9+\-\s().]+$/;
  return validCharsRegex.test(phone.trim()) && sanitized.length >= 7 && phone.trim().length <= 25;
}

/**
 * Validates a web URL format. Returns true if empty or valid URL.
 */
export function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;
  // Accepts domain format or http/https URLs
  const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=#]*)?$/i;
  return urlRegex.test(url.trim());
}

/**
 * Validates LinkedIn profile URL or handle.
 */
export function isValidLinkedIn(url: string): boolean {
  if (!url.trim()) return true;
  const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i;
  const simpleHandleRegex = /^@?[a-zA-Z0-9\-_]{3,100}$/;
  return linkedInRegex.test(url.trim()) || simpleHandleRegex.test(url.trim());
}

/**
 * Full contact form validation covering ALL input fields.
 */
export function validateContactFormData(data: {
  firstName: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  website?: string;
  linkedIn?: string;
  avatarUrl?: string;
  notes?: string;
  customFields?: { id: string; label: string; value: string }[];
}): ContactValidationErrors {
  const errors: ContactValidationErrors = {};

  // First Name validation
  const trimmedFirstName = data.firstName ? data.firstName.trim() : '';
  if (!trimmedFirstName) {
    errors.firstName = 'First name is required.';
  } else if (trimmedFirstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters.';
  } else if (trimmedFirstName.length > 50) {
    errors.firstName = 'First name cannot exceed 50 characters.';
  } else if (!isValidNameString(trimmedFirstName)) {
    errors.firstName = 'First name contains invalid characters (numbers/symbols not allowed).';
  }

  // Last Name validation
  if (data.lastName && data.lastName.trim()) {
    const trimmedLastName = data.lastName.trim();
    if (trimmedLastName.length > 50) {
      errors.lastName = 'Last name cannot exceed 50 characters.';
    } else if (!isValidNameString(trimmedLastName)) {
      errors.lastName = 'Last name contains invalid characters (numbers/symbols not allowed).';
    }
  }

  // Company validation
  if (data.company && data.company.trim().length > 80) {
    errors.company = 'Company name cannot exceed 80 characters.';
  }

  // Job Title validation
  if (data.jobTitle && data.jobTitle.trim().length > 80) {
    errors.jobTitle = 'Job title cannot exceed 80 characters.';
  }

  // Address validation
  if (data.address && data.address.trim().length > 200) {
    errors.address = 'Address cannot exceed 200 characters.';
  }

  // Email validation
  if (data.email && data.email.trim()) {
    if (!isValidEmail(data.email)) {
      errors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    } else if (data.email.trim().length > 100) {
      errors.email = 'Email address cannot exceed 100 characters.';
    }
  }

  // Primary Phone validation
  if (data.phone && data.phone.trim()) {
    if (!isValidPhone(data.phone)) {
      errors.phone = 'Please enter a valid phone number (at least 7 digits).';
    }
  }

  // Secondary Phone validation
  if (data.secondaryPhone && data.secondaryPhone.trim()) {
    if (!isValidPhone(data.secondaryPhone)) {
      errors.secondaryPhone = 'Please enter a valid secondary phone number.';
    }
  }

  // Website validation
  if (data.website && data.website.trim()) {
    if (!isValidUrl(data.website)) {
      errors.website = 'Please enter a valid URL (e.g. example.com or https://example.com).';
    } else if (data.website.trim().length > 200) {
      errors.website = 'Website URL cannot exceed 200 characters.';
    }
  }

  // LinkedIn validation
  if (data.linkedIn && data.linkedIn.trim()) {
    if (!isValidLinkedIn(data.linkedIn)) {
      errors.linkedIn = 'Please enter a valid LinkedIn profile URL or handle.';
    } else if (data.linkedIn.trim().length > 200) {
      errors.linkedIn = 'LinkedIn link cannot exceed 200 characters.';
    }
  }

  // Avatar URL validation
  if (data.avatarUrl && data.avatarUrl.trim()) {
    if (!isValidUrl(data.avatarUrl)) {
      errors.avatarUrl = 'Please enter a valid image URL.';
    } else if (data.avatarUrl.trim().length > 300) {
      errors.avatarUrl = 'Avatar URL cannot exceed 300 characters.';
    }
  }

  // Notes validation
  if (data.notes && data.notes.trim().length > 2000) {
    errors.notes = 'Notes content cannot exceed 2000 characters.';
  }

  // Custom fields validation
  if (data.customFields && data.customFields.length > 0) {
    for (const cf of data.customFields) {
      if (cf.value.trim() && !cf.label.trim()) {
        errors.customFields = 'All custom attributes with values must have a label.';
        break;
      }
      if (cf.label.trim().length > 40) {
        errors.customFields = 'Custom attribute labels cannot exceed 40 characters.';
        break;
      }
      if (cf.value.trim().length > 100) {
        errors.customFields = 'Custom attribute values cannot exceed 100 characters.';
        break;
      }
    }
  }

  return errors;
}

/**
 * Checks if a contact matches any existing contact in the directory.
 */
export function findDuplicateContact(
  data: { firstName: string; lastName?: string; email?: string; phone?: string },
  existingContacts: Contact[],
  currentContactId?: string
): { isDuplicate: boolean; field?: 'email' | 'firstName'; message?: string; existingContact?: Contact } {
  const normEmail = (data.email || '').trim().toLowerCase();
  const normFirstName = (data.firstName || '').trim().toLowerCase();
  const normLastName = (data.lastName || '').trim().toLowerCase();
  const normFullName = `${normFirstName} ${normLastName}`.trim();
  const normPhone = (data.phone || '').replace(/[\s()+\-.]/g, '');

  for (const contact of existingContacts) {
    if (currentContactId && contact.id === currentContactId) continue;

    const contactEmail = (contact.email || '').trim().toLowerCase();
    const contactFirstName = (contact.firstName || '').trim().toLowerCase();
    const contactLastName = (contact.lastName || '').trim().toLowerCase();
    const contactFullName = `${contactFirstName} ${contactLastName}`.trim();
    const contactPhone = (contact.phone || '').replace(/[\s()+\-.]/g, '');

    // 1. Check exact email match
    if (normEmail && contactEmail && normEmail === contactEmail) {
      return {
        isDuplicate: true,
        field: 'email',
        message: `A contact with email "${data.email}" already exists (${contact.firstName} ${contact.lastName}).`,
        existingContact: contact
      };
    }

    // 2. Check full name + phone match
    if (normFullName && contactFullName && normFullName === contactFullName) {
      if (normPhone && contactPhone && normPhone === contactPhone) {
        return {
          isDuplicate: true,
          field: 'firstName',
          message: `A contact named "${contact.firstName} ${contact.lastName}" with the same phone number already exists.`,
          existingContact: contact
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Deduplicates and filters imported contacts against internal file records & existing database.
 */
export function processImportedContacts(
  importedContacts: Contact[],
  existingContacts: Contact[],
  strategy: 'skip' | 'replace' | 'allow' = 'skip'
): {
  validContacts: Contact[];
  skippedExistingCount: number;
  internalDuplicateCount: number;
  updatedCount: number;
  addedCount: number;
  cleanedFieldCount: number;
} {
  let cleanedFieldCount = 0;

  // 0. Verify and sanitize fields for every imported contact
  const verifiedContacts = importedContacts.map((c) => {
    let fn = (c.firstName || '').trim();
    let ln = (c.lastName || '').trim();

    // Verify first name: if missing or default "Unknown", derive from email or company
    if (!fn || fn.toLowerCase() === 'unknown') {
      if (c.email && c.email.includes('@')) {
        const parts = c.email.split('@')[0].split(/[._-]/);
        fn = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Contact';
        if (parts[1] && !ln) {
          ln = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        }
      } else if (c.company) {
        fn = c.company.trim();
      } else {
        fn = 'Contact';
      }
      cleanedFieldCount++;
    }

    // Verify & sanitize email
    let email = (c.email || '').trim();
    if (email && !isValidEmail(email)) {
      email = '';
      cleanedFieldCount++;
    }

    // Verify & sanitize primary phone
    let phone = (c.phone || '').trim();
    if (phone && !isValidPhone(phone)) {
      phone = '';
      cleanedFieldCount++;
    }

    // Verify & sanitize secondary phone
    let secondaryPhone = (c.secondaryPhone || '').trim();
    if (secondaryPhone && !isValidPhone(secondaryPhone)) {
      secondaryPhone = '';
      cleanedFieldCount++;
    }

    // Verify & sanitize website URL
    let website = (c.website || '').trim();
    if (website && !isValidUrl(website)) {
      website = '';
      cleanedFieldCount++;
    }

    // Verify & sanitize LinkedIn URL/handle
    let linkedIn = (c.linkedIn || '').trim();
    if (linkedIn && !isValidLinkedIn(linkedIn)) {
      linkedIn = '';
      cleanedFieldCount++;
    }

    return {
      ...c,
      firstName: fn,
      lastName: ln,
      email,
      phone,
      secondaryPhone,
      website,
      linkedIn
    };
  });

  const seenKeys = new Set<string>();
  const internalDups: Contact[] = [];
  const uniqueInFile: Contact[] = [];

  const getContactKey = (c: Contact) => {
    const email = (c.email || '').trim().toLowerCase();
    if (email) return `email:${email}`;
    const name = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
    const phone = (c.phone || '').replace(/[\s()+\-.]/g, '');
    if (name && phone) return `name_phone:${name}_${phone}`;
    if (name) return `name:${name}`;
    return `id:${c.id}`;
  };

  // 1. Filter internal duplicates within the imported file
  for (const c of verifiedContacts) {
    const key = getContactKey(c);
    if (seenKeys.has(key)) {
      internalDups.push(c);
    } else {
      seenKeys.add(key);
      uniqueInFile.push(c);
    }
  }

  if (strategy === 'allow') {
    return {
      validContacts: uniqueInFile,
      skippedExistingCount: 0,
      internalDuplicateCount: internalDups.length,
      updatedCount: 0,
      addedCount: uniqueInFile.length,
      cleanedFieldCount
    };
  }

  // 2. Map existing contacts for fast lookup
  const existingMap = new Map<string, Contact>();
  existingContacts.forEach((ec) => {
    const key = getContactKey(ec);
    existingMap.set(key, ec);
    if (ec.email) existingMap.set(`email:${ec.email.trim().toLowerCase()}`, ec);
  });

  const finalContactsToImport: Contact[] = [];
  let skippedExistingCount = 0;
  let updatedCount = 0;

  for (const c of uniqueInFile) {
    const key = getContactKey(c);
    const existing = existingMap.get(key);

    if (existing) {
      if (strategy === 'skip') {
        skippedExistingCount++;
      } else if (strategy === 'replace') {
        const merged: Contact = {
          ...existing,
          ...c,
          id: existing.id,
          interactions: c.interactions.length > 0 ? c.interactions : existing.interactions,
          updatedAt: new Date().toISOString()
        };
        finalContactsToImport.push(merged);
        updatedCount++;
      }
    } else {
      finalContactsToImport.push(c);
    }
  }

  return {
    validContacts: finalContactsToImport,
    skippedExistingCount,
    internalDuplicateCount: internalDups.length,
    updatedCount,
    addedCount: finalContactsToImport.length - updatedCount,
    cleanedFieldCount
  };
}
