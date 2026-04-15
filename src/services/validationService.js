const dnsService = require('./dnsService');

/**
 * Basic regex for valid hostnames.
 */
const isValidHostname = (hostname) => {
  if (!hostname || typeof hostname !== 'string') return false;
  const regex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/;
  return regex.test(hostname);
};

/**
 * Basic regex for valid IPv4 addresses.
 */
const isValidIPv4 = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
};

/**
 * Validates a DNS record against predefined rules.
 * Throws descriptive Errors if validation fails.
 * 
 * @param {string} rawHostname 
 * @param {string} type 
 * @param {string} value 
 */
const validateDnsRecord = async (rawHostname, type, value) => {
  // Basic sanity check before normalization
  if (typeof rawHostname !== 'string') {
    throw new Error('Invalid hostname: Must be a string');
  }

  // Treat case-insensitively (normalize to lowercase)
  const hostname = rawHostname.toLowerCase();

  // 1. Basic Input validation
  if (!isValidHostname(hostname)) {
    throw new Error('Invalid hostname');
  }

  if (type === 'A') {
    if (!isValidIPv4(value)) {
      throw new Error('Invalid IPv4 address');
    }
  } else if (type === 'CNAME') {
    if (!isValidHostname(value)) {
      throw new Error('Invalid hostname for CNAME target');
    }
  } else {
    throw new Error('Invalid record type. Must be A or CNAME.');
  }

  // 2. Duplicate Prevention
  const exists = await dnsService.recordExists(hostname, type, value);
  if (exists) {
    throw new Error('Duplicate record already exists');
  }

  // 3. Fetch existing records for conflict checking
  const existingCname = await dnsService.getCNAMERecord(hostname);
  const existingRecords = await dnsService.getRecordsByHostname(hostname);

  // 4. DNS Conflict Rules
  if (type === 'A') {
    // If a CNAME exists for a hostname -> reject adding A records
    if (existingCname) {
      throw new Error('Cannot add A record when CNAME exists');
    }
  } else if (type === 'CNAME') {
    // If any record exists (A or CNAME) -> reject adding a CNAME
    if (existingRecords.length > 0) {
      throw new Error('Cannot add CNAME when other records exist for this hostname');
    }
  }

  return true;
};

module.exports = {
  validateDnsRecord
};
