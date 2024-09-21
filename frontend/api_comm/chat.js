import axios from 'axios';

class ChatComm {
  baseUrl = 'http://192.168.1.60:4000/chats';

  async getChatForUsers(participant1, participant2) {
    try {
      const response = await axios.get(`${this.baseUrl}/getChatForUsers?participant1=${participant1}&participant2=${participant2}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async getChatsForUser(username) {
    try {
      const response = await axios.get(`${this.baseUrl}/getChatsForUser?username=${username}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

export default ChatComm;
