import axios from 'axios';

class UserComm {
  baseUrl = 'http://192.168.1.60:4000/users'; 

  async register(username, password, repeatPassword, email) {
    try {
      const response = await axios.post(`${this.baseUrl}/register`, {
        username,
        password,
        repeatPassword,
        email,
      });
      return response.data;
    } catch (error) {
      console.error('Error during registration:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/login`, {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Error during login:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async updateUsername(username, newUsername) {
    try {
      const response = await axios.post(`${this.baseUrl}/updateUsername`, {
        username,
        newUsername,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating username:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async updateEmail(username, newEmail) {
    try {
      const response = await axios.post(`${this.baseUrl}/updateEmail`, {
        username,
        newEmail,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating email:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async changePassword(username, oldPassword, newPassword, repeatNewPassword) {
    try {
      const response = await axios.post(`${this.baseUrl}/changePassword`, {
        username,
        oldPassword,
        newPassword,
        repeatNewPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async getAllUsersWithUnreadMessages(username) {
    try {
      const response = await axios.post(`${this.baseUrl}/getAllUsersWithUnreadMessages`, {
        username
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users with unread messages:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const response = await axios.get(`${this.baseUrl}/getUserByUsername?username=${username}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

export default UserComm;
