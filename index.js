const app = require('express')();
const database = require("./Backend/Database");
const axios = require('axios');
const session = require("express-session");
const Database = require("better-sqlite3");
const cors = require('cors');

const SqliteStore = require("better-sqlite3-session-store")(session);

const sessionDb = new Database("./Sessions.db");

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(session({
	store: new SqliteStore({
		client: sessionDb,
		expired: {
			clear: true,
			intervalMs: 900000
		}
	}),
	secret: "very-massive-secret",
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		secure: false, // due to site beinghttp if its https set it to true
		maxAge: 365 * 24 * 60 * 60 * 1000
	}
}));

app.use(require('express').json());
database.start();

app.get("/api/user", (req, res) => {
	if(!req.session.userId)
		return res.status(401).json({ success: false, message: "User isn't logged in" })
	let account = database.getAccount(req.session.userId)
	if(account.success === false)
		return res.status(400).send(account)
	res.json(database.getAccount(req.session.userId))
})

app.get("/api/transactions", (req, res) => {
	if(!req.session.userId)
		return res.status(401).json({ success: false, message: "User isn't logged in" })
	let account = database.getAccount(req.session.userId)
	if(account.success === false)
		return res.status(400).send(account)
	res.json(database.getTransactionLogs(req.session.userId))
})


app.post("/api/register", (req, res) => {
	const { email, username, password, first_name, last_name } = req.body;
	if (!email || !username || !password || !first_name || !last_name)
		return res.status(400).json({ success: false, message: "Invalid form" });
	let request = database.createAccount(email, username, password, first_name, last_name)
	if(!request.success)
		return res.status(400).send(request);
	req.session.userId = request.id
	res.status(201).json({success: true, message: "Account created"})
});

app.post("/api/login", (req, res) => {
	const { email, password } = req.body;
	if (!email || !password)
		return res.status(400).json({ success: false, message: "Invalid form" });
	let request = database.validateLogin(email, password)
	if(!request.success)
		return res.status(401).send(request);
	req.session.userId = request.account.id
	res.status(201).json({success: true, message: "Logged in"})
});

app.post("/api/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err)
			return res.status(500).json({ success: false, message: "Logout failed" });
		res.clearCookie("connect.sid");
		res.json({ success: true, message: "Logged out" });
	});
})


app.post("/api/transfer", (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ success: false, message: "User isn't logged in" });
	}
	const amount = req.body.amount;
	const toUsername = req.body.toUsername;
	const message = req.body.message || "Transfer";
	if (typeof amount != "number" || amount <= 0.01) {
		return res.status(400).json({ success: false, message: "Invalid amount" });
	}
	const fromRequest = database.getAccount(req.session.userId);
	const toRequest = database.getAccountFromUser(toUsername);
	if (fromRequest.success === false) {
		return res.status(400).json({ success: false, message: "Sender account error" });
	}
	if (toRequest.success === false) {
		return res.status(400).json({ success: false, message: "Receiver account not found" });
	}
	if (fromRequest.id == toRequest.id) {
		return res.status(400).json({ success: false, message: "Cannot transfer to yourself" });
	}
	if (fromRequest.balance < amount) {
		return res.status(400).json({ success: false, message: "You don't have the amount to transfer" });
	}
	database.updateBalance(fromRequest.id, fromRequest.balance - amount);
	database.updateBalance(toRequest.id, toRequest.balance + amount);
	database.addToTransactionLog(fromRequest.id, toRequest.id, message, amount);
	res.json({ success: true, message: "Transfer complete" });
});

app.listen(8000, () => {});