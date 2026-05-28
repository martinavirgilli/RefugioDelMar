/**
 * API service layer.
 *
 * All HTTP requests to the Django REST backend go through this module.
 * The base URL is read from the VITE_API_URL environment variable so
 * local development points to localhost:8000 while production points to
 * the deployed Render backend URL.
 *
 * The JWT access token is attached automatically to every request via the
 * Authorization header. A 401 response clears the session and redirects
 * to /login so the user can re-authenticate.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Read the JWT access token stored after login/register. */
const getToken = () => localStorage.getItem("token");

/**
 * Wrapper around fetch that attaches the JWT token and handles
 * common error cases (401, non-JSON responses from Django error pages).
 *
 * @param {string} endpoint - API path, e.g. '/api/candidatos/'
 * @param {object} options  - Standard fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = { ...options, headers };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Expired or invalid token — clear session and redirect to login
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }

    // Django error pages return HTML instead of JSON — surface a clear message
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      const text = await response.text();
      if (text.trim().startsWith("<!DOCTYPE")) {
        throw new Error(
          `Server error: the API returned HTML instead of JSON. ` +
          `Check that endpoint ${endpoint} exists and is working correctly.`
        );
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};


// ---------------------------------------------------------------------------
// Candidatos service
// ---------------------------------------------------------------------------

export const candidatosService = {
  /** Fetch all candidates, optionally filtered via query params. */
  getAll: async () => {
    const response = await apiRequest("/api/candidatos/", { method: "GET" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error fetching candidates");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    // DRF returns results in a `results` key when pagination is active
    return Array.isArray(data) ? data : (data.results || data);
  },

  /** Fetch a single candidate by its primary key. */
  getById: async (id) => {
    const response = await apiRequest(`/api/candidatos/${id}/`, { method: "GET" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error fetching candidate");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },

  /** Create a new candidate. Requires admin privileges. */
  create: async (candidato) => {
    const response = await apiRequest("/api/candidatos/", {
      method: "POST",
      body: JSON.stringify(candidato),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error creating candidate");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },

  /** Update an existing candidate. Requires admin privileges. */
  update: async (id, candidato) => {
    const response = await apiRequest(`/api/candidatos/${id}`, {
      method: "PUT",
      body: JSON.stringify(candidato),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error updating candidate");
    }

    return response.json();
  },

  /** Delete a candidate by ID. Requires admin privileges. */
  delete: async (id) => {
    const response = await apiRequest(`/api/candidatos/${id}/`, { method: "DELETE" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error deleting candidate");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    // Django returns 204 No Content on successful delete — handle the empty body
    if (response.status === 204 || response.status === 200) {
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    }

    return response.json();
  },

  /**
   * Toggle the adopted/available status of a candidate.
   * Uses a custom PATCH action defined on the ViewSet.
   */
  toggleAdopcion: async (id) => {
    const response = await apiRequest(`/api/candidatos/${id}/adoptar/`, { method: "PATCH" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error updating adoption status");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },
};


// ---------------------------------------------------------------------------
// Adopciones service
// ---------------------------------------------------------------------------

export const adopcionesService = {
  /** Fetch aggregated stats: total, adopted, and available counts. */
  getResumen: async () => {
    const response = await apiRequest("/api/adopciones/resumen", { method: "GET" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error fetching adoption summary");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },

  /** Fetch the list of all adopted candidates ordered by most recent. */
  getHistorial: async () => {
    const response = await apiRequest("/api/adopciones/historial", { method: "GET" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error fetching adoption history");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },
};


// ---------------------------------------------------------------------------
// Visitas service
// ---------------------------------------------------------------------------

export const visitasService = {
  /** Fetch all upcoming (future) visits. Admin only. */
  getAll: async () => {
    const response = await apiRequest("/api/visitas/", { method: "GET" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error fetching visits");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || data);
  },

  /** Fetch a single visit by ID. */
  getById: async (id) => {
    const response = await apiRequest(`/api/visitas/${id}/`, { method: "GET" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error fetching visit");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },

  /** Schedule a new visit. Requires admin privileges. */
  create: async (visita) => {
    const response = await apiRequest("/api/visitas/", {
      method: "POST",
      body: JSON.stringify(visita),
    });

    if (!response.ok) {
      try {
        const error = await response.json();

        // DRF validation errors are keyed by field name — surface the first one
        if (error.fecha_visita) {
          const msg = Array.isArray(error.fecha_visita)
            ? error.fecha_visita[0]
            : error.fecha_visita;
          throw new Error(msg || "Visit date must be in the future");
        }

        const firstFieldError = Object.keys(error).find(
          (key) => Array.isArray(error[key]) && error[key].length > 0
        );
        if (firstFieldError) {
          const msg = Array.isArray(error[firstFieldError])
            ? error[firstFieldError][0]
            : error[firstFieldError];
          throw new Error(msg);
        }

        throw new Error(error.error || error.message || error.detail || "Error creating visit");
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message) throw parseError;
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },

  /** Delete a visit by ID. Requires admin privileges. */
  delete: async (id) => {
    const response = await apiRequest(`/api/visitas/${id}/`, { method: "DELETE" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error deleting visit");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    if (response.status === 204 || response.status === 200) {
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    }

    return response.json();
  },

  /**
   * Add a final comment to a visit and mark it as completed.
   * Uses a custom PATCH action on the ViewSet.
   */
  agregarComentario: async (id, comentario) => {
    const response = await apiRequest(`/api/visitas/${id}/agregar_comentario/`, {
      method: "PATCH",
      body: JSON.stringify({ comentario_final: comentario }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error adding comment");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },
};


// ---------------------------------------------------------------------------
// Solicitudes de visita service
// ---------------------------------------------------------------------------

export const solicitudesService = {
  /**
   * Fetch visit requests.
   * Admins receive all requests; regular users receive only their own.
   */
  getAll: async () => {
    const response = await apiRequest("/api/visitas/solicitudes/", { method: "GET" });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error fetching requests");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || data);
  },

  /** Submit a new visit request. Any authenticated user. */
  create: async (solicitud) => {
    const response = await apiRequest("/api/visitas/solicitudes/", {
      method: "POST",
      body: JSON.stringify(solicitud),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        const firstField = Object.keys(error).find(
          (k) => Array.isArray(error[k]) && error[k].length > 0
        );
        if (firstField) throw new Error(Array.isArray(error[firstField]) ? error[firstField][0] : error[firstField]);
        throw new Error(error.error || error.message || error.detail || "Error submitting request");
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message) throw parseError;
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },

  /** Accept a visit request and set the visit date. Admin only. */
  aceptar: async (id, fecha_visita) => {
    const response = await apiRequest(`/api/visitas/solicitudes/${id}/aceptar/`, {
      method: "PATCH",
      body: JSON.stringify({ fecha_visita }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error accepting request");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },

  /** Reject a visit request. Admin only. */
  rechazar: async (id) => {
    const response = await apiRequest(`/api/visitas/solicitudes/${id}/rechazar/`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || error.message || error.detail || "Error rejecting request");
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  },
};
