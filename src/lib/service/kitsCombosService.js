// kitsCombosService.js - Handles API operations for Kits & Combos

const KITS_API = '/api/kits';
const COMBOS_API = '/api/combos';

export class KitsCombosService {
  // ============= KITS =============
  static async getKits(id = null) {
    try {
      const url = id ? `${KITS_API}?id=${id}` : KITS_API;
      const res = await fetch(url);

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in getKits:', error);
      throw error;
    }
  }

  static async createKit(kitData) {
    try {
      const res = await fetch(KITS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in createKit:', error);
      throw error;
    }
  }

  static async deleteKit(id) {
    try {
      const res = await fetch(`${KITS_API}?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in deleteKit:', error);
      throw error;
    }
  }

  // ============= COMBOS =============
  static async getCombos(id = null) {
    try {
      const url = id ? `${COMBOS_API}?id=${id}` : COMBOS_API;
      const res = await fetch(url);

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in getCombos:', error);
      throw error;
    }
  }

  static async createCombo(comboData) {
    try {
      const res = await fetch(COMBOS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comboData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in createCombo:', error);
      throw error;
    }
  }

  static async deleteCombo(id) {
    try {
      const res = await fetch(`${COMBOS_API}?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in deleteCombo:', error);
      throw error;
    }
  }
}
