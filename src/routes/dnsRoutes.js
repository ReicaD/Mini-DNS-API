const express = require('express');
const router = express.Router();
const dnsController = require('../controllers/dnsController');

// POST /api/dns -> createDnsRecord
router.post('/', dnsController.createDnsRecord);

// GET /api/dns/:hostname/records -> list records
router.get('/:hostname/records', dnsController.getRecords);

// GET /api/dns/:hostname -> resolve function stub
router.get('/:hostname', dnsController.resolveDns);

// DELETE /api/dns/:hostname -> delete stub
router.delete('/:hostname', dnsController.deleteDnsRecord);

module.exports = router;
