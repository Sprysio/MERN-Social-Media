import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar/index';
import Home from './components/home/index';
import Profile from './components/profile/index';
import Login from './components/login/index';
import Register from './components/register/index';
import PostForm from './components/postForm/index';
import PostDetail from './components/postDetail/index';
import Settings from './components/settings/index';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-post" element={<PostForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/:userId" element={<Profile />} />
          <Route path="/posts/:postId"  element={<PostDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/edit-post/:postId" element={<PostForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
