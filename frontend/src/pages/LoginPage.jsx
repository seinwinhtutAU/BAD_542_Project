import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../authConfig';

const ROLE_REDIRECT = {
  STUDENT: '/student',
  DOCTOR: '/doctor',
  ADMIN: '/admin',
};

export default function LoginPage() {
  const { loginDev, loginWithAd, user } = useAuth();
  const { instance } = useMsal();
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

  async function handleAdLogin() {
    setError('');
    try {
      const result = await instance.loginPopup(loginRequest);
      await loginWithAd(result.idToken);
    } catch (err) {
      setError('Microsoft sign-in failed');
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
      <button type="button" onClick={handleAdLogin}>Log in with University AD</button>
    </div>
  );
}
