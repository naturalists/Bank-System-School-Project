const fs = require("fs");
const Database = require("better-sqlite3");
const { hashPassword } = require("./Auth");

class DatabaseService {
    constructor() {
        this.dbFile = "./Database.db";
        this.db = null;
    }

    start() {
        const dbExists = fs.existsSync(this.dbFile);

        try {
            this.db = new Database(this.dbFile);

            console.log(
                dbExists ? "Database opened." : "Database created."
            );

            this.db.exec(`
                CREATE TABLE IF NOT EXISTS bank_accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    role TEXT NOT NULL DEFAULT 'User',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
			
			this.db.exec(`CREATE TABLE IF NOT EXISTS transaction_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sender_id INTEGER,
                    receiver_id INTEGER,
                    type TEXT NOT NULL, 
                    amount DECIMAL(15,2) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sender_id) REFERENCES bank_accounts(id),
                    FOREIGN KEY (receiver_id) REFERENCES bank_accounts(id)
                );`);

        } catch (err) {
            console.error("Failed to open database:", err);
            throw err;
        }
    }
	
    createAccount(email, username, password, first_name, last_name, role = "User") {
		try {
			const stmt = this.db.prepare(`INSERT INTO bank_accounts(email, username, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)`);
			const result = stmt.run(email, username, hashPassword(password), first_name, last_name, role);
			return {success: true, id: result.lastInsertRowid };
		} catch (err) {
			if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
				return {success: false, message: "Email is already registered" };
			}
			return {success: false, message: "Failed to create account"};
		}
	}
	
	validateLogin(email, password) {
		const account = this.db.prepare(`SELECT * FROM bank_accounts WHERE email = ?`).get(email);
		if(!account)
			return {success: false, message: "Invalid Email / Password"}
		if(hashPassword(password) != account.password)
			return {success: false, message: "Invalid Email / Password"}
		return {success: true, account: account}
	}
	
	getAccount(id) {
		const account = this.db.prepare(`SELECT * FROM bank_accounts WHERE id = ?`).get(id);
		if(!account)
			return {success: false, message: "Account doesn't exist"}
		delete account.password;
		return account 
	}

	getAccountFromUser(username) {
		const account = this.db.prepare(`SELECT * FROM bank_accounts WHERE username = ?`).get(username);
		if(!account)
			return {success: false, message: "Account doesn't exist"}
		delete account.password;
		return account
	}
	
	updateBalance(id, balance) {
		try {
			if(typeof(balance) != "number")
				return {success: false, message: "Invalid amount"}
			const account = this.db.prepare(`SELECT * FROM bank_accounts WHERE id = ?`).get(id);
			if(!account)
				return { success: false, message: "Account doesn't exist" };
			this.db.prepare(`UPDATE bank_accounts SET balance = ? WHERE id = ?`).run(balance, id);
			return { success: true, message: "Balance updated" };
		} catch(err) {
			return { success: false, message: "Failed to update balance" };
		}
	}

	addToTransactionLog(senderId, receiverId, type, amount) {
		try {
			const stmt = this.db.prepare(`INSERT INTO transaction_logs(sender_id, receiver_id, type, amount) VALUES (?, ?, ?, ?)`);
			stmt.run(senderId, receiverId, type, amount);
			return { success: true, message: "Transaction logged" };
		}
		catch (err) {
			return { success: false, message: "Failed to log transaction" };
		}
	}

	getTransactionLogs(accountId) {
		try {
			const logs = this.db.prepare(`SELECT * FROM transaction_logs WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at DESC`).all(accountId, accountId);
			var formattedLogs = logs.map(log => {
				return {
					sender: this.getAccount(log.sender_id).username,
					receiver: this.getAccount(log.receiver_id).username,
					type: log.type,
					amount: log.amount,
					created_at: log.created_at
				};
			});
			return { success: true, logs: formattedLogs };
		}
		catch (err) {
			return { success: false, message: "Failed to retrieve transaction logs" };
		}
	}
}

module.exports = new DatabaseService();