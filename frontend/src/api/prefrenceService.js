const API_URL = 'http://localhost:3005';

export const preferenceService = {
  // sve preferencije
  async getPreferences() {
    try {
      const response = await fetch(`${API_URL}/preferences`);
      if (!response.ok) throw new Error('Greška pri dohvatu preferencija');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // like izvora ( rss izvor )
  async likeSource(source) {
    try {
      const response = await fetch(`${API_URL}/preferences/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source })
      });
      if (!response.ok) throw new Error('Greška pri like-anju');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // dislike izvora ( rss izvor )
  async dislikeSource(source) {
    try {
      const response = await fetch(`${API_URL}/preferences/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source })
      });
      if (!response.ok) throw new Error('Greška pri dislike-anju');
      return await response.json();
    } catch (error) {
      console.error('Error disliking source:', error);
      throw error;
    }
  },

  // kompletan reset 
  async resetPreferences() {
    try {
      const response = await fetch(`${API_URL}/preferences/reset`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Greška pri resetiranju');
      return await response.json();
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }
};
