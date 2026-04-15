const DNSRecord = require('../models/DNSRecord');

/**
 * Fetch all DNS records associated with a specific hostname
 * @param {string} hostname
 * @returns {Promise<Array>} Array of DNSRecord documents
 */
const getRecordsByHostname = async (hostname) => {
  return await DNSRecord.find({ hostname });
};

/**
 * Fetch only 'A' records for a specific hostname
 * @param {string} hostname
 * @returns {Promise<Array>} Array of DNSRecord 'A' documents
 */
const getARecords = async (hostname) => {
  return await DNSRecord.find({ hostname, type: 'A' });
};

/**
 * Fetch the 'CNAME' record for a specific hostname
 * @param {string} hostname
 * @returns {Promise<Object|null>} A single DNSRecord 'CNAME' document or null
 */
const getCNAMERecord = async (hostname) => {
  return await DNSRecord.findOne({ hostname, type: 'CNAME' });
};

/**
 * Check if a specific, exact DNS record already exists
 * @param {string} hostname
 * @param {string} type
 * @param {string} value
 * @returns {Promise<boolean>} True if record exists, false otherwise
 */
const recordExists = async (hostname, type, value) => {
  const record = await DNSRecord.findOne({ hostname, type, value });
  return record !== null;
};

/**
 * Recursively resolves a hostname following CNAME chains until A records are found.
 * Detects circular references to prevent infinite loops.
 * 
 * @param {string} hostname - The hostname to resolve
 * @param {Set} [visited=new Set()] - Tracks visited hostnames to detect loops
 * @param {number} [maxDepth=10] - Maximum CNAME chain depth to prevent runaway recursion
 * @returns {Promise<Object>} Resolution result with IPs, record type, and chain info
 */
const resolveHostname = async (hostname, visited = new Set(), maxDepth = 10) => {
  // Guard: circular reference detection
  if (visited.has(hostname)) {
    throw new Error(`Circular CNAME reference detected at ${hostname}`);
  }

  // Guard: max depth exceeded
  if (visited.size >= maxDepth) {
    throw new Error(`CNAME chain too long (exceeded ${maxDepth} levels)`);
  }

  visited.add(hostname);

  // Check for A records first
  const aRecords = await DNSRecord.find({ hostname, type: 'A' });
  if (aRecords.length > 0) {
    return {
      hostname,
      resolvedIps: aRecords.map(record => record.value),
      recordType: 'A',
      pointsTo: hostname
    };
  }

  // Check for CNAME record
  const cnameRecord = await DNSRecord.findOne({ hostname, type: 'CNAME' });
  if (cnameRecord) {
    // Recursively resolve the CNAME target
    const resolved = await resolveHostname(cnameRecord.value, visited, maxDepth);
    
    if (!resolved) {
      return {
        hostname,
        resolvedIps: [],
        recordType: 'CNAME',
        pointsTo: cnameRecord.value
      };
    }

    return {
      hostname,
      resolvedIps: resolved.resolvedIps,
      recordType: 'CNAME',
      pointsTo: resolved.pointsTo
    };
  }

  // No records found at all
  return null;
};

/**
 * Deletes a specific, exact DNS record
 * @param {string} hostname
 * @param {string} type
 * @param {string} value
 * @returns {Promise<Object|null>} The deleted document, or null if not found
 */
const deleteRecord = async (hostname, type, value) => {
  return await DNSRecord.findOneAndDelete({ 
    hostname: hostname.toLowerCase(), 
    type, 
    value 
  });
};

/**
 * Starts the background TTL cleanup job
 */
const startTTLJob = () => {
  setInterval(async () => {
    try {
      const records = await DNSRecord.find({ ttl: { $exists: true } });
      const now = Date.now();

      for (const record of records) {
        // Evaluate expiration
        const expirationTime = record.createdAt.getTime() + record.ttl * 1000;
        if (now > expirationTime) {
          await DNSRecord.findByIdAndDelete(record._id);
          console.log(`[DNS LOG] Deleted expired record: ${record.hostname} (${record.type})`);
        }
      }
    } catch (error) {
      console.error('[DNS LOG] Error within TTL cleanup job:', error.message);
    }
  }, 30000);
};

module.exports = {
  getRecordsByHostname,
  getARecords,
  getCNAMERecord,
  recordExists,
  resolveHostname,
  deleteRecord,
  startTTLJob,
};
