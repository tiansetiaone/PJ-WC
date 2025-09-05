require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./config/db");
const path = require('path');



// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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


// Di index.js, tambahkan test route
app.get('/test-upload', (req, res) => {
  const testPath = path.join(__dirname, 'uploads', 'profiles');
  const testFile = path.join(testPath, 'profile-33-1756482455248.jpg');
  
  const fs = require('fs');
  
  console.log('Upload directory exists:', fs.existsSync(testPath));
  console.log('Test file exists:', fs.existsSync(testFile));
  console.log('Upload path:', testPath);
  
  if (fs.existsSync(testFile)) {
    res.send('File exists: ' + testFile);
  } else {
    res.status(404).send('File not found: ' + testFile);
  }
});