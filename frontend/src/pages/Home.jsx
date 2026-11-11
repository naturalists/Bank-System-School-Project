import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch("http://localhost:8000/api/user", {
            credentials: "include",
            headers: { Accept: "application/json" },
        })
            .then(async (response) => {
                if (response.ok) setUser(await response.json());
            })
            .catch(() => setUser(null));
    }, []);

    return (
        <div>
            <div className="navbar">
                <Link to="/" className="logo">Nexa Bank</Link>
                <div className="nav-right">
                    {user ? (
                        <Link to="/dashboard">Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login">Log in</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </div>

            <div className="page">
                <div className="box">
                    <h1>Welcome to Nexa Bank</h1>
                    <p>
                        This is a small bank project. You can make an account, see your
                        balance, send money to other users and look at your transactions.
                    </p>
                    <div className="home-buttons">
                        {user ? (
                            <Link to="/dashboard" className="btn">Go to dashboard</Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn">Create account</Link>
                                <Link to="/login" className="btn btn-gray">Log in</Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="box">
                    <h2>What you can do</h2>
                    <ul>
                        <li>Check your balance</li>
                        <li>Send money to another user with their username</li>
                        <li>See your transaction history</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
