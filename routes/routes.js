const router = require('express').Router();
const authController = require('../controllers/auth-controller');
const activateController = require('../controllers/activate-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const roomsController = require('../controllers/rooms-controller');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/activate', authMiddleware, activateController.activate);
router.get("/refresh", authController.refresh);
router.post("/logout", authMiddleware, authController.logout);
router.post("/rooms", authMiddleware, roomsController.create);
router.get("/rooms", authMiddleware, roomsController.index);
router.get('/rooms/:roomId', authMiddleware, roomsController.show);

module.exports = router
