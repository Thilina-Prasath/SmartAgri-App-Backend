const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user');

// Signup logic
exports.signup = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Signup failed. Email may already exist." });
    }
};

// Login logic
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "JWT_SECRET", { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Login failed" });
    }
};

exports.update = async (req, res) => {
    try {
        const { userId, name, password } = req.body;
        const updateData = { name };
        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        res.json({ message: "Updated", user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
}