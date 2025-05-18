const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const dashboardRoutes = require("./routes/dashboard");

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/services', require('./routes/services'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/banking', require('./routes/banking'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use("/api/dashboard", dashboardRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));