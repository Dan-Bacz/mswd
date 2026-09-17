const express = require('express');
const router = express.Router();
const { requireAdmin, loadNotifications } = require('../middleware/auth');
const {
  dashboard,
  listAllBeneficiaries,
  newBeneficiaryForm,
  createBeneficiary,
  viewBeneficiary,
  editBeneficiaryForm,
  updateBeneficiary,
  setBeneficiaryStatus
} = require('../controllers/adminController');

router.use(requireAdmin);
router.use(loadNotifications);

router.get('/', dashboard);
router.get('/beneficiaries', listAllBeneficiaries);
router.get('/beneficiaries/new', newBeneficiaryForm);
router.post('/beneficiaries', createBeneficiary);
router.get('/beneficiaries/:id', viewBeneficiary);
router.get('/beneficiaries/:id/edit', editBeneficiaryForm);
router.post('/beneficiaries/:id/status', setBeneficiaryStatus);
router.post('/beneficiaries/:id', updateBeneficiary);

module.exports = router;