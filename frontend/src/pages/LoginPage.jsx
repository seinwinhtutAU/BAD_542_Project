import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_REDIRECT = {
  STUDENT: '/student',
  DOCTOR: '/doctor',
  ADMIN: '/admin',
};

export default function LoginPage() {
  const { loginDev, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await loginDev(email, password);
    } catch (err) {
      setError('Invalid credentials');
    }
  }

  if (user) {
    navigate(ROLE_REDIRECT[user.role] || '/', { replace: true });
  }

  return (
    <div>
      <h1>Campus Health Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Log in</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled>Log in with University AD (coming soon)</button>
    </div>
  );
}
