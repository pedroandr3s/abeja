const corsConfig = {
    origin: [
        'http://localhost:3004',  // React frontend
        'http://localhost:3000'   // Backend API (self-reference)
    ],
    credentials: true
};

module.exports = corsConfig;