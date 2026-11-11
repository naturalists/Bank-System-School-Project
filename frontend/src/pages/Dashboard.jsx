import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTransferPopup, setShowTransferPopup] = useState(false);
    const [showResponsePopup, setShowResponsePopup] = useState(false);
    const [transferLoading, setTransferLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [transferResponse, setTransferResponse] = useState(null);
    const [transferForm, setTransferForm] = useState({
        username: "",
        message: "",
        amount: "",
    });

    const handleTransferChange = (event) => {
        const { name, value } = event.target;
        setTransferForm((currentForm) => ({ ...currentForm, [name]: value }));
    };

    const handleTransfer = async (event) => {
        event.preventDefault();
        setTransferLoading(true);

        try {
            const response = await fetch("http://localhost:8000/api/transfer", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    toUsername: transferForm.username,
                    message: transferForm.message,
                    amount: Number(transferForm.amount),
                }),
            });
            const data = await response.json();

            setTransferResponse({
                success: response.ok,
                message: data.message || (response.ok ? "Transfer complete" : "Transfer failed"),
            });
            setShowTransferPopup(false);
            setShowResponsePopup(true);

            if (response.ok) {
                setTransferForm({ username: "", amount: "" });
                window.location.reload();
            }
        } catch (requestError) {
            setTransferResponse({ success: false, message: "Could not connect to the server." });
            setShowTransferPopup(false);
            setShowResponsePopup(true);
        } finally {
            setTransferLoading(false);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);

        try {
            await fetch("http://localhost:8000/api/logout", {
                method: "POST",
                credentials: "include",
            });
        } finally {
            setLogoutLoading(false);
            navigate("/");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                let request_user = await fetch("http://localhost:8000/api/user", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json",
                    },
                });
                const data_user = await request_user.json();
                if (!request_user.ok) {
                    setError(data_user);
                    throw new Error(data_user.message || "Unable to load your account");
                } else {
                    setUser(data_user);
                }
                let request_transaction = await fetch("http://localhost:8000/api/transactions", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json",
                    },
                })
                const data_transaction = await request_transaction.json();
                if (!request_transaction.ok) {
                    setError(data_transaction);
                    throw new Error(data_transaction.message || "Unable to load your account");
                } else {
                    setTransactions(data_transaction);
                }
                setLoading(false);
            } catch (fetchError) {
                setError(fetchError);
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="page">
                <p>Loading...</p>
            </div>
        );
    }
    if (error) {
        if (error.message === "User isn't logged in") {
            navigate("/login");
            return null;
        }
        return (
            <div className="page">
                <div className="box">
                    <h2>Something went wrong</h2>
                    <p>{error.message || "An error occurred"}</p>
                    <Link to="/login" className="btn">Back to login</Link>
                </div>
            </div>
        );
    }

    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username;
    const balance = Number(user?.balance || 0);
    const formattedBalance = balance.toLocaleString("en-US", {
        style: "currency",
        currency: "EUR",
    });
    const createdDate = user?.created_at
        ? new Date(user.created_at.replace(" ", "T")).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "Not available";

    const formatMoney = (value) =>
        Number(value).toLocaleString("en-US", { style: "currency", currency: "EUR" });

    return (
        <div>
            <div className="navbar">
                <Link to="/" className="logo">Nexa Bank</Link>
                <div className="nav-right">
                    <span>Logged in as {user?.username}</span>
                    <button type="button" onClick={handleLogout} disabled={logoutLoading}>
                        {logoutLoading ? "Logging out..." : "Log out"}
                    </button>
                </div>
            </div>

            <div className="page">
                <h1>Hello, {user?.first_name || user?.username}</h1>

                <div className="box">
                    <h2>Balance</h2>
                    <div className="balance">{formattedBalance}</div>
                    <button type="button" onClick={() => setShowTransferPopup(true)}>Send money</button>
                </div>

                <div className="box">
                    <h2>Account info</h2>
                    <table className="info-table">
                        <tbody>
                            <tr><th>Name</th><td>{fullName}</td></tr>
                            <tr><th>Username</th><td>{user?.username}</td></tr>
                            <tr><th>Email</th><td>{user?.email}</td></tr>
                            <tr><th>Role</th><td>{user?.role || "User"}</td></tr>
                            <tr><th>Created</th><td>{createdDate}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div className="box">
                    <h2>Transactions</h2>
                    {transactions?.logs?.length === 0 ? (
                        <p>No transactions yet.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Who</th>
                                    <th>Message</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.logs.map((transaction, index) => {
                                    const sent = transaction.sender == user.username;
                                    return (
                                        <tr key={index}>
                                            <td>{transaction.created_at}</td>
                                            <td>{sent ? "To " + transaction.receiver : "From " + transaction.sender}</td>
                                            <td>{transaction.type}</td>
                                            <td className={sent ? "red" : "green"}>
                                                {sent ? "-" : "+"}{formatMoney(transaction.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showTransferPopup && (
                <div className="modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setShowTransferPopup(false);
                }}>
                    <div className="modal">
                        <h2>Send money</h2>
                        <form onSubmit={handleTransfer}>
                            <label htmlFor="username">Username<input id="username" name="username" value={transferForm.username} onChange={handleTransferChange} required /></label>
                            <label htmlFor="message">Message<input id="message" name="message" value={transferForm.message} onChange={handleTransferChange} required /></label>
                            <label htmlFor="amount">Amount<input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={transferForm.amount} onChange={handleTransferChange} required /></label>
                            <div className="modal-buttons">
                                <button type="submit" disabled={transferLoading}>{transferLoading ? "Sending..." : "Send"}</button>
                                <button type="button" className="btn-gray" onClick={() => setShowTransferPopup(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showResponsePopup && transferResponse && (
                <div className="modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setShowResponsePopup(false);
                }}>
                    <div className="modal">
                        <h2>{transferResponse.success ? "Transfer sent" : "Transfer failed"}</h2>
                        <p>{transferResponse.message}</p>
                        <button type="button" onClick={() => setShowResponsePopup(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
