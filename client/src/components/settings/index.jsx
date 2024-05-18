import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.css';

function Settings() {
  // State variables
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  // Navigation hook
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found.');
          return;
        }
        const userFromToken = JSON.parse(atob(token.split('.')[1]));

        const response = await axios.get(`http://localhost:8888/api/user/${userFromToken._id}`);
        const formattedDateOfBirth = new Date(response.data.dateOfBirth).toISOString().split('T')[0];
        setUser({ ...response.data, dateOfBirth: formattedDateOfBirth });

        setCurrentProfilePicture(`http://localhost:8888/profile_pictures/${response.data.profile_picture}`);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.response.data.message);
      }
    };

    fetchUserData();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setUser({ ...user, profile_picture: selectedFile });

    // Set current profile picture preview
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentProfilePicture(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle form submission for updating user settings
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validation checks
      if (user.username.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        setError('Invalid email address');
        return;
      }

      if (!user.dateOfBirth) {
        setError('Date of birth is required');
        return;
      }
      
      // Additional validation for profile picture
      if (user.profile_picture instanceof File && user.profile_picture.type) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(user.profile_picture.type)) {
          setError('Invalid file type. Only JPG, PNG, and GIF files are allowed');
          return;
        }
      }
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found.');
        return;
      }

      const userFromToken = JSON.parse(atob(token.split('.')[1]));

      // Send request to update user settings
      await axios.post('http://localhost:8888/api/user/settings', { ...user, userId: userFromToken._id }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      alert('User profile updated successfully!');
      window.location.href= `/user/${userFromToken._id}`;
    } catch (error) {
      console.error('Error updating user settings:', error);
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      // Password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$^!%*?&#])[A-Za-z\d@$^!%*?&#]{7,}$/;
      if (!passwordRegex.test(newPassword)) {
        setError('Password must meet the criteria');
        return;
      }

      if (newPassword !== repeatPassword) {
        setError('Passwords do not match');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found.');
        return;
      }

      const userFromToken = JSON.parse(atob(token.split('.')[1]));

      // Send request to change password
      await axios.post('http://localhost:8888/api/user/change-password', { userId: userFromToken._id, newPassword }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      alert('Password changed successfully!');
      window.location.href= `/user/${userFromToken._id}`;
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found.');
        return;
      }

      const confirmed = window.confirm('Are you sure you want to delete this account?');
      if (!confirmed) {
        return;
      }

      const userFromToken = JSON.parse(atob(token.split('.')[1]));

      // Send request to delete account
      await axios.delete(`http://localhost:8888/api/user/${userFromToken._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      localStorage.removeItem('token');
      alert('Account deleted successfully!');
      window.location.href= `/`
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className={styles.userSettings}>
      <h2>User Settings</h2>
      {user && (
        <form onSubmit={handleFormSubmit}>
          <div className={styles.formGroup}>
            <label>Username:</label>
            <input type="text" name="username" value={user.username} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Email:</label>
            <input type="email" name="email" value={user.email} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Date of Birth:</label>
            <input type="date" name="dateOfBirth" value={user.dateOfBirth} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Gender:</label>
            <select name="gender" value={user.gender} onChange={handleChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Profile Picture:</label>
            {currentProfilePicture && <img src={currentProfilePicture} alt="Current Profile" />}
            <input type="file" name="profile_picture" onChange={handleFileChange} />
          </div>
          <button type="submit" className={styles.saveButton}>Save</button>
        </form>
      )}
      <h2>Change Password</h2>
      <form onSubmit={handlePasswordChange}>
        <div className={styles.formGroup}>
          <label>New Password:</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Repeat New Password:</label>
          <input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
        </div>
        <button type="submit" className={styles.changePasswordButton}>Change Password</button>
      </form>
      {error && <div>{error}</div>}
      <button onClick={handleDeleteAccount} className={styles.deleteAccountButton}>Delete Account</button>
    </div>
  );
  
};

export default Settings;
