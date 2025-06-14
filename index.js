require("dotenv").config();
const db = require("./config/config");
const express = require("express");
const cors = require("cors");

const PORT = process.env.APP_PORT;

db.sync()
    .then(() =>
        console.log("Database connection successful and tables synchronized.")
    )
    .catch((error) => console.error("Database connection failed:", error));


const app = express();

const corsOptions = {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Origin",
        "X-Requested-With",
        "Accept",
        "x-client-key",
        "x-client-token",
        "x-client-secret",
        "Authorization",
    ],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/slot", require("./routes/slot"));
app.use("/api/vehicle", require("./routes/vehicle"));
app.use("/api/booking", require("./routes/booking"));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }

    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    res.status(err.statusCode).json({
        message: err.message,
        code: err.code || 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: "Endpoint not found",
        code: "ENDPOINT_NOT_FOUND"
    });
});

app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
});