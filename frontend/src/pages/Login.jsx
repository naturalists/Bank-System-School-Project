import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch("http://localhost:8000/api/user",{
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json",
            },
        })
        .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setUser(data);
                }
            })
    }, []);

    if(user) {
        navigate("/dashboard");
        return null;
    }


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Login failed");
                setLoading(false);
                return;
            }

            navigate("/dashboard");
        } catch (err) {
            setError("Could not connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-box">
            <h1>Log in</h1>

            <form onSubmit={handleLogin}>
                {error && <div className="error">{error}</div>}

                <label htmlFor="email">Email
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </label>

                <label htmlFor="password">Password
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Log in"}
                </button>
            </form>

            <div className="auth-links">
                <p>No account yet? <Link to="/register">Register here</Link></p>
                <p><Link to="/">Back to home</Link></p>
            </div>
        </div>
    );
}
