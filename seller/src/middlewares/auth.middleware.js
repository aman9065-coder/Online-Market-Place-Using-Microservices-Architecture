const jwt = require('jsonwebtoken');

function createAuthMiddleware(roles = ['user']) {
    return function authmiddleware(req, res, next) {
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: "unauthorized , no token"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!roles.includes(decoded.role)) {
                return res.status(403).json({
                    message: "Forbidden: insufficient permissions"
                });
            }

            const user = decoded;
            req.user = user;
            next();
        } catch (err) {
            console.log(err);
            return res.status(401).json({
                message: "unauthorized , invalid token"
            });

        }
    }
}

module.exports = createAuthMiddleware;