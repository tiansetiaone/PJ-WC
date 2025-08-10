require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./config/db");



// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/campaigns", require("./routes/campaign.routes"));
app.use("/api/deposits", require("./routes/deposit.routes"));
app.use("/api/referrals", require("./routes/referral.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/support", require("./routes/support.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use('/api/profile', require('./routes/profile.routes'));


if (process.env.NODE_ENV === 'development') {
    const debugRouter = require('./routes/auth.routes');
    app.use('/api/auth', debugRouter);
}

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Konfigurasi CORS yang tepat
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'OPTIONS']
};

app.use(cors(corsOptions));

// Handle OPTIONS request
app.options('*', cors(corsOptions));


// Error handling
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// Tambahkan di app.js sebelum routes
app.use((req, res, next) => {
  // Header untuk mengatasi COOP error
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
});