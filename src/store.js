import { create } from 'zustand';

export const useMapStore = create((set, get) => ({
  features: [],
  addFeature: (feature) => set({ features: [...get().features, feature] }),
  updateFeature: (id, changes) =>
    set({
      features: get().features.map((f) =>
        f.id === id ? { ...f, ...changes } : f
      ),
    }),
  removeFeature: (id) =>
    set({ features: get().features.filter((f) => f.id !== id) }),
  toggleLayerGroup: (group) =>
    set({
      features: get().features.map((f) =>
        f.layerGroup === group ? { ...f, visible: !f.visible } : f
      ),
    }),
  saveMap: () => {
    localStorage.setItem('mapData', JSON.stringify(get().features));
    alert('Map saved!');
  },
  loadMap: () => {
    const data = localStorage.getItem('mapData');
    console.log('Loaded data:', data);
    if (data) set({ features: JSON.parse(data) });
  },
}));
