const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// ===============================
// SUPABASE
// ===============================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);


// ===============================
// FRONTEND
// ===============================

app.use(express.static(path.join(__dirname, "public")));


// ===============================
// AUTH MIDDLEWARE
// ===============================

function authenticate(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
}


// ===============================
// SIGNUP
// ===============================

app.post("/api/auth/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const { data: existingUser, error: findError } =
            await supabase
                .from("users")
                .select("id")
                .eq("email", cleanEmail)
                .maybeSingle();

        if (findError) {
            throw findError;
        }

        if (existingUser) {
            return res.status(400).json({
                message: "An account with this email already exists."
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 10);

        const { data: user, error } =
            await supabase
                .from("users")
                .insert({
                    name: name.trim(),
                    email: cleanEmail,
                    password_hash: passwordHash
                })
                .select("id,name,email")
                .single();

        if (error) {
            throw error;
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            user,
            token
        });

    } catch (error) {

        console.error("SIGNUP ERROR:", error);

        res.status(500).json({
            message: "Signup failed."
        });

    }

});


// ===============================
// LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const cleanEmail =
            email.trim().toLowerCase();

        const { data: user, error } =
            await supabase
                .from("users")
                .select("*")
                .eq("email", cleanEmail)
                .maybeSingle();

        if (error) {
            throw error;
        }

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordValid =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Login failed."
        });

    }

});


// ===============================
// GET CURRENT USER
// ===============================

app.get("/api/auth/me", authenticate, (req, res) => {

    res.json({
        user: req.user
    });

});


// ===============================
// SAVED SERVICES
// ===============================

app.get("/api/saved", authenticate, async (req, res) => {

    try {

        const { data, error } =
            await supabase
                .from("saved_services")
                .select("service_id")
                .eq("user_id", req.user.id);

        if (error) {
            throw error;
        }

        res.json(
            data.map(item => item.service_id)
        );

    } catch (error) {

        console.error("GET SAVED ERROR:", error);

        res.status(500).json({
            message: "Could not load saved services."
        });

    }

});


app.post("/api/saved/:serviceId", authenticate, async (req, res) => {

    try {

        const { error } =
            await supabase
                .from("saved_services")
                .insert({
                    user_id: req.user.id,
                    service_id: req.params.serviceId
                });

        // Duplicate is okay
        if (error && error.code !== "23505") {
            throw error;
        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error("SAVE ERROR:", error);

        res.status(500).json({
            message: "Could not save service."
        });

    }

});


app.delete("/api/saved/:serviceId", authenticate, async (req, res) => {

    try {

        const { error } =
            await supabase
                .from("saved_services")
                .delete()
                .eq("user_id", req.user.id)
                .eq("service_id", req.params.serviceId);

        if (error) {
            throw error;
        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error("DELETE SAVED ERROR:", error);

        res.status(500).json({
            message: "Could not remove saved service."
        });

    }

});


// ===============================
// CIVICPATH PROGRESS
// ===============================

app.get("/api/progress", authenticate, async (req, res) => {

    try {

        const { data, error } =
            await supabase
                .from("progress")
                .select("*")
                .eq("user_id", req.user.id);

        if (error) {
            throw error;
        }

        res.json(data);

    } catch (error) {

        console.error("GET PROGRESS ERROR:", error);

        res.status(500).json({
            message: "Could not load progress."
        });

    }

});


app.post("/api/progress", authenticate, async (req, res) => {

    try {

        const {
            goal,
            stepId,
            state
        } = req.body;

        const { error } =
            await supabase
                .from("progress")
                .insert({
                    user_id: req.user.id,
                    goal: goal,
                    step_id: stepId,
                    state: state
                });

        // Duplicate completion is okay
        if (error && error.code !== "23505") {
            throw error;
        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error("PROGRESS ERROR:", error);

        res.status(500).json({
            message: "Could not save progress."
        });

    }

});


// ===============================
// FRONTEND FALLBACK
// ===============================

app.use((req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `CivicFlow server running at http://localhost:${PORT}`
    );

});