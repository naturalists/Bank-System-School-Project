const crypto = require("crypto");

function hashPassword(input) {
	return crypto.createHash("sha256").update(input || "").digest("hex")
}

module.exports = {
	hashPassword
};