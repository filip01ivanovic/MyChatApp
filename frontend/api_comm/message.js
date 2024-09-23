import axios from 'axios';

class MessageComm {
  baseUrl = 'http://192.168.1.60:4000/messages';

    async getMessagesForChat(participant1, participant2) {
        try {
            const response = await axios.get(`${this.baseUrl}/getMessagesForChat`, {
                params: {
                    participant1: participant1,
                    participant2: participant2
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async setMessagesToRead(participant1, participant2) {
        try {
            const response = await axios.post(`${this.baseUrl}/setMessagesToRead`, {
            participant1,
            participant2,
            });
            return response.data;
        } catch (error) {
            console.error('Error setting messages to read:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async setOneMessageToRead(_id) {
        try {
            const response = await axios.post(`${this.baseUrl}/setOneMessageToRead`, {
            _id
            });
            return response.data;
        } catch (error) {
            console.error('Error setting message to read:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

export default MessageComm;
