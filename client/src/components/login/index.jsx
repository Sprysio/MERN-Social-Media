import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send login request
      const response = await axios.post('http://localhost:8888/api/auth/login', formData);
      // Store token in local storage
      localStorage.setItem('token', response.data.token);
      // Redirect to home page after successful login and reload
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Error logging in:', error);
      // Set error message for invalid login
      setError('Invalid username or password.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Display error message if login fails */}
      {error && <div className={styles.error}>{error}</div>}
      {/* Login form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Email input */}
        <input
          type="text"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className={styles.input}
        />
        {/* Password input */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className={styles.input}
        />
        {/* Submit button */}
        <button type="submit" className={styles.button}>Login</button>
      </form>
    </div>
  );
}

export default Login;
