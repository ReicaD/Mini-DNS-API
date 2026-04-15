const net = require('node:net');
const dnsService = require('./dnsService');

/**
 * Validates hostname format based on standard DNS rules.
 */
const isValidHostname = (hostname) => {
  if (!hostname || typeof hostname !== 'string') return false;
  const regex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/;
  return regex.test(hostname);
};

/**
 * Validates IPv4 address using Node.js built-in 'net' module.
 */
const isValidIPv4 = (ip) => {
  return net.isIPv4(ip);
};

/**
 * Validates a DNS record against RFC rules and record exclusivity constraints.
 * Throws descriptive Errors if validation fails.
 */
const validateDnsRecord = async (rawHostname, type, value) => {
  if (typeof rawHostname !== 'string') {
    throw new Error('Invalid hostname: Must be a string');
  }

  // Normalize hostname to lowercase for consistency
  const hostname = rawHostname.toLowerCase();

  // 1. Basic format validation
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

  // 2. Duplicate detection
  const exists = await dnsService.recordExists(hostname, type, value);
  if (exists) {
    throw new Error('Duplicate record already exists');
  }

  // 3. Conflict Rule: CNAME Exclusivity
  const existingCname = await dnsService.getCNAMERecord(hostname);
  const existingRecords = await dnsService.getRecordsByHostname(hostname);

  // If a CNAME exists for a hostname -> reject adding any other records (including A)
  if (type === 'A' && existingCname) {
    throw new Error('Cannot add A record when CNAME exists');
  }

  // If any record (A or CNAME) exists -> reject adding a new CNAME
  if (type === 'CNAME' && existingRecords.length > 0) {
    throw new Error('Cannot add CNAME when other records exist for this hostname');
  }

  return true;
};

module.exports = {
  validateDnsRecord
};
