import jwt from 'jsonwebtoken';

export const isAuthenticated = async (req, res, next) => {
    try {
        console.log("req.headers.authorization:", req.headers.authorization);
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing or invalid"
            });
        }
        
        const token = authHeader.split(" ")[1];
        let decoded;
        
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET1);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token has expired"
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: "Token verification failed"
                });
            }
        }

        // Attach token payload directly to request without querying database
        req.user = {
            _id: decoded.id,
            id: decoded.id,
            role: decoded.role
        };
        req.id = decoded.id;
        
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "'isAuthenticated': Internal server error."
        });
    }
};

export const isAuthorized = (allowedRoles) => {
    return (req, res, next) => {
        if (req.user && allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: `Access Denied: Required permissions missing.`
            });
        }
    };
};