import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
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

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username: username, first_name: firstName, last_name: lastName, email: email, password: password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Registration failed");
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
            <h1>Register</h1>

            <form onSubmit={handleRegister}>
                {error && <div className="error">{error}</div>}

                <label htmlFor="username">Username
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </label>

                <label htmlFor="first_name">First name
                    <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </label>

                <label htmlFor="last_name">Last name
                    <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </label>

                <label htmlFor="email">Email
                    <input
                        id="email"
                        name="email"
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
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="6"
                        autoComplete="new-password"
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                </button>
            </form>

            <div className="auth-links">
                <p>Already have an account? <Link to="/login">Log in</Link></p>
                <p><Link to="/">Back to home</Link></p>
            </div>
        </div>
    );
}
