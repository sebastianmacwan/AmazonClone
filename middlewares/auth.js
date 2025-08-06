// middlewares/auth.js
function verifyAdmin(req, res, next) {
    const user = req.body || req.query;

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }

    next();
}

module.exports = { verifyAdmin };
