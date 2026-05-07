import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  rooms: [],
  currentRoom: null,
  currentSong: null,
  isPlaying: false,
  lyrics: null,
  members: [],
  
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setLyrics: (lyrics) => set({ lyrics }),
  setMembers: (members) => set({ members }),
  
  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
  removeRoom: (roomId) => set((state) => ({
    rooms: state.rooms.filter(r => r.id !== roomId)
  })),
  
  reset: () => set({
    rooms: [],
    currentRoom: null,
    currentSong: null,
    isPlaying: false,
    lyrics: null,
    members: []
  })
}));
