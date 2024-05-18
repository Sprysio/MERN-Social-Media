import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.css';

function Register() {
  // State variables
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    dateOfBirth: '',
    gender: 'male',
    profile_picture: null
  });
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null);
  const [error, setError] = useState('');

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFormData({ ...formData, profile_picture: selectedFile });

    // Set current profile picture preview
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentProfilePicture(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Username validation
      if (formData.username.length < 3) {
        setError("Username must be at least 3 characters long");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Invalid email address");
        return;
      }

      // Password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$^!%*?&#])[A-Za-z\d@$^!%*?&#]{7,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError("Password must be at least 7 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character");
        return;
      }

      // Date of birth validation
      if (!formData.dateOfBirth) {
        setError("Date of birth is required");
        return;
      }
      const dob = new Date(formData.dateOfBirth);
      const age = Math.floor((new Date() - dob) / (1000 * 60 * 60 * 24 * 365));
      if (age < 13) {
        setError("You must be at least 13 years old to register");
        return;
      }

      // Profile picture validation
      if (!formData.profile_picture) {
        setError("Profile picture is required");
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif','image/jpg'];
      if (!allowedTypes.includes(formData.profile_picture.type)) {
        setError("Invalid file type. Only JPG, PNG, and GIF files are allowed");
        return;
      }

      // Clear error state
      setError("");

      // Send registration request to the server
      const response = await axios.post('http://localhost:8888/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      // Store token in local storage upon successful registration
      localStorage.setItem('token', response.data.token);
      console.log('User registered successfully');

      // Navigate to home page and reload window
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Error registering user:', error);
      setError(error.response.data.message);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="date"
          name="dateOfBirth"
          onChange={handleChange}
          className={styles.input}
        />
        <select name="gender" onChange={handleChange} className={styles.input}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input
          type="file"
          name="profile_picture"
          required
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {currentProfilePicture && (
          <div className={styles.currentPictureContainer}>
            <p className={styles.currentPictureLabel}>Current Picture:</p>
            <img src={currentProfilePicture} alt="Current Profile" className={styles.currentPicture} />
          </div>
        )}
        <button type="submit" className={styles.button}>Register</button>
      </form>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default Register;
