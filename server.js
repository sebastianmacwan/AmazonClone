// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const express = require("express");
const cors = require("cors"); // For Cross-Origin Resource Sharing
const bodyParser = require("body-parser"); // For parsing request bodies
const bcrypt = require("bcrypt"); // For password hashing
const nodemailer = require("nodemailer"); // For sending emails (contact form, password reset)
const multer = require("multer"); // For handling multipart/form-data (file uploads)
const path = require("path"); // For handling file paths
const crypto = require("crypto"); // For generating secure tokens - THIS IS THE MODULE IN QUESTION

// Database connection pool (assuming db.js exports a pg.Pool instance)
const connectDB = require("./config/db");
const User = require("./models/User"); // You'll create this model
connectDB(); // Connect to MongoDB


// Configure Multer for file uploads (used in contact form)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize Express app
const app = express();
app.use(express.json({ limit: "5mb" })); // ⬅ Important for base64 image size

// --- Middleware Configuration ---

app.use(cors({
  origin: 'https://amazon-mongo.netlify.app', // frontend origin
  credentials: true
}));
// Parse incoming request bodies in JSON format
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, "public")));

// --- Nodemailer Transporter Configuration ---
// This transporter will be used for sending all emails (contact form, password reset)
const transporter = nodemailer.createTransport({
    service: "gmail", // You can use other services or SMTP
    auth: {
        user: process.env.MAIL_USER, // Your Gmail email address (or other service email)
        pass: process.env.MAIL_PASS, // Your Gmail app password (or other service password)
    },
});

// --- Route Imports ---
// Import your product routes
const productsRouter = require("./routes/products");
// Import your cart routes
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');
app.use('/api', adminRoutes);


// --- Route Mounting ---
// Mount the products router under the /api path.
// If productsRouter handles '/products', the full path will be /api/products.
app.use("/api", productsRouter);
// Mount the cart router under the /api/cart path.
app.use('/api/cart', cartRoutes);


// ==========================
// Signup Route
// ==========================
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // const newUser = new User({ username, email, password: hashedPassword });
    const newUser = new User({ username, email, password: hashedPassword, role: 'user' }); // ✅ Add role

    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
});

// ==========================
// Login Route
// ==========================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
         role: user.role  ,
         avatar: user.avatar // ✅ include avatar URL
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// Forgot Password Route
// (Request to send reset link)
// ==========================
app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    console.log("Forgot password request received for email:", email); // Debug log

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) {
            console.log("User not found for forgot password request:", email); // Debug log
            return res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
        }

        // --- DEEPER DIAGNOSTIC LOGS FOR crypto MODULE ---
        console.log('DEBUG: Type of crypto variable:', typeof crypto);
        if (typeof crypto === 'object' && crypto !== null) {
            console.log('DEBUG: Is crypto an empty object?', Object.keys(crypto).length === 0);
            console.log('DEBUG: Does crypto have randomBytes property?', 'randomBytes' in crypto);
            console.log('DEBUG: Type of crypto.randomBytes property:', typeof crypto.randomBytes);
            // If crypto.randomBytes is there, but not a function, let's see its value
            if (typeof crypto.randomBytes !== 'function' && 'randomBytes' in crypto) {
                console.log('DEBUG: Value of crypto.randomBytes:', crypto.randomBytes);
            }
        }
        // --- END DEEPER DIAGNOSTIC LOGS ---


        // Generate a unique token
        // THIS IS LINE 131
        const resetToken = crypto.randomBytes(32).toString("hex");
        // Set token expiry (e.g., 1 hour from now)
        const resetExpires = Date.now() + 3600000; // 1 hour in milliseconds
        console.log("Generated reset token:", resetToken, "Expires:", new Date(resetExpires)); // Debug log

        // Save token and expiry to the user in the database
        await db.query(
            "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3",
            [resetToken, resetExpires, user.id]
        );
        console.log("Updated user with reset token in DB for user ID:", user.id); // Debug log

        // Construct the reset URL for the frontend
        // Ensure process.env.FRONTEND_URL is correctly set in your .env file
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
        console.log("Reset URL generated:", resetUrl); // Debug log

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: user.email,
            subject: "Password Reset Request for Amazon Clone",
            html: `
                <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent to:", user.email); // Debug log

        res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (err) {
        console.error("Forgot password error in catch block:", err); // Improved error log
        res.status(500).json({ message: "Failed to send password reset email." });
    }
});

// ==========================
// Reset Password Route
// (Verify token and set new password)
// ==========================
app.post("/api/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    console.log("Reset password request received for token (first few chars):", token ? token.substring(0, 10) + "..." : "N/A"); // Debug log

    if (!token || !newPassword) {
        console.warn("Reset password: Missing token or new password."); // Debug log
        return res.status(400).json({ message: "Token and new password are required." });
    }

    try {
        const currentTime = Date.now();
        console.log("Current timestamp for expiry check:", currentTime); // Debug log

        const result = await db.query(
            "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2",
            [token, currentTime]
        );
        const user = result.rows[0];

        if (!user) {
            console.warn("Reset password: Token not found or expired for token:", token); // Debug log
            return res.status(400).json({ message: "Password reset token is invalid or has expired." });
        }

        console.log("User found for reset password:", user.email); // Debug log

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        console.log("New password hashed."); // Debug log

        // Update password and clear reset token fields
        await db.query(
            "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2",
            [hashedNewPassword, user.id]
        );

        console.log("Password successfully reset and token cleared for user:", user.email); // Debug log
        res.status(200).json({ message: "Password has been reset successfully." });
    } catch (err) {
        console.error("Reset password error in catch block:", err); // Improved error log
        res.status(500).json({ message: "Failed to reset password." });
    }
});


// ==========================
// Update Email Route
// ==========================
app.put("/api/user/update-email", async (req, res) => {
  const { id, newEmail } = req.body;

  if (!id || !newEmail)
    return res.status(400).json({ message: "User ID and new email required." });

  try {
    await User.findByIdAndUpdate(id, { email: newEmail });
    res.json({ message: "Email updated successfully." });
  } catch (err) {
    console.error("Update email error:", err);
    res.status(500).json({ message: "Failed to update email." });
  }
});


// ==========================
// Update Password Route
// ==========================
app.put("/api/user/update-password", async (req, res) => {
    const { id, oldPassword, newPassword } = req.body;

    if (!id || !oldPassword || !newPassword)
        return res.status(400).json({ message: "All fields are required." });

    try {
        const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: "User not found." });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
            return res.status(401).json({ message: "Old password is incorrect." });

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNewPassword, id]);

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Update password error:", err);
        res.status(500).json({ message: "Failed to update password." });
    }
});

// ==========================
// Contact Form Route
// ==========================
app.post("/api/send_mail", upload.single("file"), async (req, res) => { // Changed to /api/send_mail
    const { name, email, subject, message } = req.body;
    const file = req.file;

    if (!name || !email || !subject || !message)
        return res.status(400).json({ error: "All fields are required." });

    try {
        // Transporter is now configured globally at the top
        const mailOptions = {
            from: `"${name}" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_RECEIVER, // Ensure this environment variable is set
            subject: subject,
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong><br>${message}</p>
            `,
            attachments: file
                ? [{ filename: file.originalname, content: file.buffer }]
                : [],
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("Email error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

// ==========================
// Fallback for SPA Routes
// ==========================
// This should be the very last route definition.
// It sends 'index.html' for any request that doesn't match previous routes,
// which is common for Single Page Applications (SPAs).
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
//profile update route
app.post('/api/update-avatar', async (req, res) => {
  const { userId, avatarUrl } = req.body;

  if (!userId || !avatarUrl) {
    return res.status(400).json({ success: false, error: "Missing userId or avatarUrl" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// --- Global Error Handling Middleware ---
// This middleware catches any errors that were not handled by specific routes.
app.use((err, req, res, next) => {
    console.error("Unhandled server error:", err.stack); // Log the stack trace
    res.status(500).send('Something broke on the server!'); // Send a generic error response
});


// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});





