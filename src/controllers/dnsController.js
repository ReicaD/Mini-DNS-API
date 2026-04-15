const validationService = require('../services/validationService');
const DNSRecord = require('../models/DNSRecord');
const dnsService = require('../services/dnsService');

/**
 * Creates a new DNS record.
 * POST /api/dns
 */
const createDnsRecord = async (req, res, next) => {
  // Asynchronous logging of the request
  setImmediate(() => {
    console.log(`[DNS LOG] ASYNC LOG: POST /api/dns - Body: ${JSON.stringify(req.body)}`);
  });
  
  try {
    const { hostname, type, value, ttl } = req.body;
    
    // Rigorous validation against DNS constraints
    await validationService.validateDnsRecord(hostname, type, value);
    
    const recordData = {
      hostname: hostname.toLowerCase(),
      type,
      value
    };
    if (ttl !== undefined) recordData.ttl = ttl;
    
    const record = new DNSRecord(recordData);
    const savedRecord = await record.save();
    
    res.status(201).json({
      hostname: savedRecord.hostname,
      type: savedRecord.type,
      value: savedRecord.value,
      createdAt: savedRecord.createdAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves all raw DNS records for a given hostname.
 * GET /api/dns/:hostname/records
 */
const getRecords = async (req, res, next) => {
  setImmediate(() => {
    console.log(`[DNS LOG] ASYNC LOG: GET ${req.originalUrl}`);
  });
  
  try {
    const { hostname } = req.params;
    const records = await dnsService.getRecordsByHostname(hostname.toLowerCase());
    
    res.status(200).json({
      hostname: hostname.toLowerCase(),
      records: records.map(r => ({
        type: r.type,
        value: r.value
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves a hostname following CNAME chains to final A records.
 * GET /api/dns/:hostname
 */
const resolveDns = async (req, res, next) => {
  setImmediate(() => {
    console.log(`[DNS LOG] ASYNC LOG: RESOLVE (GET) ${req.originalUrl}`);
  });
  
  try {
    const hostname = req.params.hostname.toLowerCase();
    const result = await dnsService.resolveHostname(hostname);

    if (!result) {
      return res.status(404).json({ error: `No DNS records found for ${hostname}` });
    }

    res.status(200).json(result);
  } catch (error) {
    // Handle circular reference and chain-length errors as 400 Bad Request
    if (error.message.includes('Circular') || error.message.includes('chain too long')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Deletes a specific DNS record based on hostname, type, and value.
 * DELETE /api/dns/:hostname
 */
const deleteDnsRecord = async (req, res, next) => {
  setImmediate(() => {
    console.log(`[DNS LOG] ASYNC LOG: DELETE ${req.originalUrl}`);
  });
  
  try {
    const { hostname } = req.params;
    const { type, value } = req.query;

    if (!type || !value) {
      return res.status(400).json({ error: 'Query parameters "type" and "value" are required.' });
    }

    const deletedRecord = await dnsService.deleteRecord(hostname, type, value);

    if (!deletedRecord) {
      return res.status(404).json({ error: 'DNS record not found.' });
    }

    res.status(200).json({ 
      message: 'DNS record deleted successfully.', 
      deletedRecord: {
        hostname: deletedRecord.hostname,
        type: deletedRecord.type,
        value: deletedRecord.value
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDnsRecord,
  getRecords,
  resolveDns,
  deleteDnsRecord
};
