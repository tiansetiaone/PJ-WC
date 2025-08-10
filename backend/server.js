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

// Error handling
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
