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
 * to /login, unless the caller opts out with `redirectOn401: false`
 * (used by public pages that simply degrade when there is no session).
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Read the JWT access token stored after login/register. */
const getToken = () => localStorage.getItem("token");

/** Remove the persisted session. */
const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Build a query string, dropping empty values so the URL stays readable
 * and the backend never receives `?especie=&genero=`.
 */
const queryString = (params = {}) => {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== "") query.append(clave, valor);
  }
  const texto = query.toString();
  return texto ? `?${texto}` : "";
};

/**
 * Turn any failed Response into a single, readable Error message.
 *
 * The backend answers with three different error shapes, so they are all
 * handled here instead of being re-implemented in every service method:
 *   1. Custom views:      { error: "..." } / { detail: "..." } / { message: "..." }
 *   2. DRF validation:    { fecha_visita: ["..."], nombre: ["..."] }
 *   3. Non-JSON (a Django HTML error page, an empty body, a gateway error)
 *
 * @param {Response} response      - the failed fetch Response
 * @param {string}   fallbackMessage - message used when the body says nothing useful
 * @returns {Promise<Error>}
 */
export const parseErrorResponse = async (response, fallbackMessage) => {
  const statusMessage = `Error ${response.status}: ${response.statusText || fallbackMessage}`;

  let body;
  try {
    body = await response.json();
  } catch {
    // Body was empty or not JSON at all
    return new Error(statusMessage);
  }

  if (!body || typeof body !== "object") {
    return new Error(statusMessage);
  }

  // 1. Single-message shapes
  const single = body.error || body.detail || body.message;
  if (typeof single === "string") {
    return new Error(single);
  }

  // 2. DRF field errors — surface the first one so the user sees something concrete
  for (const [field, value] of Object.entries(body)) {
    const text = Array.isArray(value) ? value[0] : value;
    if (typeof text === "string" && text.trim()) {
      // non_field_errors has no useful field name to show
      return new Error(field === "non_field_errors" ? text : `${text}`);
    }
  }

  return new Error(fallbackMessage || statusMessage);
};

/**
 * Resolve a Response into parsed data, or throw a readable Error.
 *
 * Also handles the empty body that Django returns on 204 No Content
 * (DELETE) so callers never have to think about it.
 *
 * @param {Response} response
 * @param {string}   fallbackMessage - used when the error body says nothing useful
 * @param {boolean}  unwrapResults   - true for list endpoints: returns `results`
 *                                     when DRF pagination is active
 */
const handleResponse = async (response, fallbackMessage, { unwrapResults = false } = {}) => {
  if (!response.ok) {
    throw await parseErrorResponse(response, fallbackMessage);
  }

  if (response.status === 204) {
    return { success: true };
  }

  const text = await response.text();
  if (!text) {
    return { success: true };
  }

  const data = JSON.parse(text);
  if (unwrapResults) {
    return Array.isArray(data) ? data : (data.results ?? data);
  }
  return data;
};

/**
 * Wrapper around fetch that attaches the JWT token and handles
 * common error cases (401, non-JSON responses from Django error pages).
 *
 * @param {string} endpoint - API path, e.g. '/api/candidatos/'
 * @param {object} options  - Standard fetch options, plus:
 *                            redirectOn401 (default true) — send the user to
 *                            /login when the token is missing or expired.
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { redirectOn401 = true, headers: extraHeaders, ...fetchOptions } = options;
  const token = getToken();

  // With FormData the browser must set Content-Type itself, because it has to
  // append the multipart boundary. Setting it by hand breaks the upload.
  const esFormData = fetchOptions.body instanceof FormData;

  const headers = {
    ...(esFormData ? {} : { "Content-Type": "application/json" }),
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...fetchOptions, headers });

  // Expired or invalid token — clear the session and send the user to login.
  // Public pages pass redirectOn401: false and handle the 401 themselves.
  if (response.status === 401 && redirectOn401) {
    clearSession();
    window.location.href = "/login";
    throw new Error("Tu sesión expiró. Iniciá sesión de nuevo.");
  }

  return response;
};


// ---------------------------------------------------------------------------
// Auth service
// ---------------------------------------------------------------------------

export const authService = {
  /** Authenticate with email + password. Returns { token, refresh, user }. */
  login: async (email, password) => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      // A wrong password answers 401; redirecting would reload the login page
      // and swallow the error message.
      redirectOn401: false,
    });

    return handleResponse(response, "No pudimos iniciar sesión");
  },

  /** Create a new regular account. Returns { token, refresh, user }. */
  register: async (email, password, name) => {
    const response = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
      redirectOn401: false,
    });

    return handleResponse(response, "No pudimos crear la cuenta");
  },

  /** Search accounts by name or email, for the manual visit form. Admin only. */
  buscarUsuarios: async (q) => {
    const response = await apiRequest(`/api/auth/usuarios/buscar${queryString({ q })}`, {
      method: "GET",
    });
    return handleResponse(response, "Error al buscar usuarios");
  },

  /**
   * Create an account for a visitor. Admin only.
   * The response carries `password_temporal`: it is shown once and never again.
   */
  crearUsuario: async (email, nombre) => {
    const response = await apiRequest("/api/auth/usuarios/crear", {
      method: "POST",
      body: JSON.stringify({ email, nombre }),
    });
    return handleResponse(response, "No pudimos crear la cuenta");
  },
};


// ---------------------------------------------------------------------------
// Candidatos service
// ---------------------------------------------------------------------------

export const candidatosService = {
  /**
   * Fetch one page of the catalogue.
   *
   * @param {object} params - search, especie, genero, adoptado, orden, page, page_size
   * @returns {Promise<{resultados: object[], total: number, hayMas: boolean}>}
   */
  getAll: async (params = {}, options = {}) => {
    const response = await apiRequest(`/api/candidatos/${queryString(params)}`, {
      method: "GET",
      ...options,
    });
    const data = await handleResponse(response, "Error al cargar los candidatos");

    // Without pagination the API returns a plain array; with it, an object.
    if (Array.isArray(data)) {
      return { resultados: data, total: data.length, hayMas: false };
    }
    return {
      resultados: data.results ?? [],
      total: data.count ?? 0,
      hayMas: Boolean(data.next),
    };
  },

  /** Distinct species present in the catalogue, for the filter dropdown. */
  getEspecies: async (options = {}) => {
    const response = await apiRequest("/api/candidatos/especies/", { method: "GET", ...options });
    return handleResponse(response, "Error al cargar las especies");
  },

  /** Fetch a single candidate by its primary key. */
  getById: async (id, options = {}) => {
    const response = await apiRequest(`/api/candidatos/${id}/`, { method: "GET", ...options });
    return handleResponse(response, "Error al cargar el candidato");
  },

  /** Create a new candidate. Requires admin privileges. */
  create: async (candidato) => {
    const response = await apiRequest("/api/candidatos/", {
      method: "POST",
      body: JSON.stringify(candidato),
    });
    return handleResponse(response, "Error al crear el candidato");
  },

  /** Update an existing candidate. Requires admin privileges. */
  update: async (id, candidato) => {
    const response = await apiRequest(`/api/candidatos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(candidato),
    });
    return handleResponse(response, "Error al actualizar el candidato");
  },

  /** Delete a candidate by ID. Requires admin privileges. */
  delete: async (id) => {
    const response = await apiRequest(`/api/candidatos/${id}/`, { method: "DELETE" });
    return handleResponse(response, "Error al eliminar el candidato");
  },

  /**
   * Toggle the adopted/available status of a candidate.
   * An adopted candidate is archived, not deleted. Requires admin privileges.
   */
  toggleAdopcion: async (id, datos = {}) => {
    const response = await apiRequest(`/api/candidatos/${id}/adoptar/`, {
      method: "PATCH",
      body: JSON.stringify(datos),
    });
    return handleResponse(response, "Error al actualizar el estado de adopción");
  },

  /**
   * Update only the fields passed. Requires admin privileges.
   *
   * The inline editors of the admin view send one or two fields at a time, so
   * PATCH is the right verb: a PUT would need the whole object and would wipe
   * whatever the form does not carry.
   */
  patch: async (id, campos) => {
    const response = await apiRequest(`/api/candidatos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(campos),
    });
    return handleResponse(response, "Error al guardar los cambios");
  },

  /**
   * Add a photo to a candidate's gallery. Admin only.
   * Pass { url } to link a photo, or { archivo: File } to upload one.
   */
  agregarFoto: async (id, { url, archivo, alt = "" }) => {
    let body;
    if (archivo) {
      body = new FormData();
      body.append("archivo", archivo);
      body.append("alt", alt);
    } else {
      body = JSON.stringify({ url, alt });
    }

    const response = await apiRequest(`/api/candidatos/${id}/fotos/`, { method: "POST", body });
    return handleResponse(response, "Error al agregar la foto");
  },

  /** Remove one photo from a candidate's gallery. Admin only. */
  borrarFoto: async (id, fotoId) => {
    const response = await apiRequest(`/api/candidatos/${id}/fotos/${fotoId}/`, {
      method: "DELETE",
    });
    return handleResponse(response, "Error al borrar la foto");
  },

  /** Requests and visits of one candidate, in a single call. Admin only. */
  getActividad: async (id) => {
    const response = await apiRequest(`/api/candidatos/${id}/actividad/`, { method: "GET" });
    return handleResponse(response, "Error al cargar la actividad del candidato");
  },

  // ── Reseñas de adopción ───────────────────────────────────────────────────

  /** Published reviews for the home page and /adopciones. Public. */
  getResenasPublicas: async (limite = 6, options = {}) => {
    const response = await apiRequest(`/api/candidatos/resenas/${queryString({ limite })}`, {
      method: "GET",
      ...options,
    });
    return handleResponse(response, "Error al cargar las reseñas");
  },

  /** Every review of one candidate, published or not. Admin only. */
  getResenas: async (id) => {
    const response = await apiRequest(`/api/candidatos/${id}/resenas/`, { method: "GET" });
    return handleResponse(response, "Error al cargar las reseñas");
  },

  /**
   * Write a review of an adopted animal. Admin only.
   * Pass { url } to link a photo, or { archivo: File } to upload one.
   */
  agregarResena: async (id, { autor, texto, url, archivo }) => {
    let body;
    if (archivo) {
      body = new FormData();
      body.append("autor", autor);
      body.append("texto", texto);
      body.append("archivo", archivo);
    } else {
      body = JSON.stringify({ autor, texto, url: url || null });
    }

    const response = await apiRequest(`/api/candidatos/${id}/resenas/`, { method: "POST", body });
    return handleResponse(response, "Error al guardar la reseña");
  },

  /** Edit a review, or publish and unpublish it. Admin only. */
  editarResena: async (id, resenaId, campos) => {
    const response = await apiRequest(`/api/candidatos/${id}/resenas/${resenaId}/`, {
      method: "PATCH",
      body: JSON.stringify(campos),
    });
    return handleResponse(response, "Error al actualizar la reseña");
  },

  /** Delete a review. Admin only. */
  borrarResena: async (id, resenaId) => {
    const response = await apiRequest(`/api/candidatos/${id}/resenas/${resenaId}/borrar/`, {
      method: "DELETE",
    });
    return handleResponse(response, "Error al borrar la reseña");
  },
};


// ---------------------------------------------------------------------------
// Adopciones service
// ---------------------------------------------------------------------------

export const adopcionesService = {
  /** Aggregated stats: totals, breakdown by species and by month. Public. */
  getResumen: async (options = {}) => {
    const response = await apiRequest("/api/adopciones/resumen", { method: "GET", ...options });
    return handleResponse(response, "Error al cargar el resumen de adopciones");
  },

  /** Animals that already found a home, most recent first. Public. */
  getHistorial: async (options = {}) => {
    const response = await apiRequest("/api/adopciones/historial", { method: "GET", ...options });
    return handleResponse(response, "Error al cargar el historial de adopciones");
  },
};


// ---------------------------------------------------------------------------
// Visitas service
// ---------------------------------------------------------------------------

export const visitasService = {
  /**
   * Fetch scheduled visits. Admin only.
   * @param {object} params - candidato, historial
   */
  getAll: async (params = {}) => {
    const response = await apiRequest(`/api/visitas/${queryString(params)}`, { method: "GET" });
    return handleResponse(response, "Error al cargar las visitas", { unwrapResults: true });
  },

  /** Fetch a single visit by ID. */
  getById: async (id) => {
    const response = await apiRequest(`/api/visitas/${id}/`, { method: "GET" });
    return handleResponse(response, "Error al cargar la visita");
  },

  /** Schedule a new visit. Requires admin privileges. */
  create: async (visita) => {
    const response = await apiRequest("/api/visitas/", {
      method: "POST",
      body: JSON.stringify(visita),
    });
    return handleResponse(response, "Error al crear la visita");
  },

  /** Delete a visit by ID. Requires admin privileges. */
  delete: async (id) => {
    const response = await apiRequest(`/api/visitas/${id}/`, { method: "DELETE" });
    return handleResponse(response, "Error al eliminar la visita");
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
    return handleResponse(response, "Error al agregar el comentario");
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
  getAll: async (params = {}) => {
    const response = await apiRequest(`/api/visitas/solicitudes/${queryString(params)}`, {
      method: "GET",
    });
    return handleResponse(response, "Error al cargar las solicitudes", { unwrapResults: true });
  },

  /** Submit a new visit request. Any authenticated user. */
  create: async (solicitud) => {
    const response = await apiRequest("/api/visitas/solicitudes/", {
      method: "POST",
      body: JSON.stringify(solicitud),
    });
    return handleResponse(response, "Error al enviar la solicitud");
  },

  /** Accept a request and book the visit. Admin only. */
  aceptar: async (id, fecha_visita) => {
    const response = await apiRequest(`/api/visitas/solicitudes/${id}/aceptar/`, {
      method: "PATCH",
      body: JSON.stringify({ fecha_visita }),
    });
    return handleResponse(response, "Error al aceptar la solicitud");
  },

  /** Turn down a request. Admin only. */
  rechazar: async (id) => {
    const response = await apiRequest(`/api/visitas/solicitudes/${id}/rechazar/`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    return handleResponse(response, "Error al rechazar la solicitud");
  },
};


// ---------------------------------------------------------------------------
// Colaboraciones service (voluntariado y hogar de tránsito)
// ---------------------------------------------------------------------------

export const colaboracionesService = {
  /** Submit an offer to help. Public — no account required. */
  create: async (colaboracion) => {
    const response = await apiRequest("/api/colaboraciones/", {
      method: "POST",
      body: JSON.stringify(colaboracion),
      redirectOn401: false,
    });
    return handleResponse(response, "No pudimos enviar tu postulación");
  },

  /** List offers, optionally filtered by tipo or estado. Admin only. */
  getAll: async (params = {}) => {
    const response = await apiRequest(`/api/colaboraciones/${queryString(params)}`, {
      method: "GET",
    });
    return handleResponse(response, "Error al cargar las postulaciones", { unwrapResults: true });
  },

  /** Move an offer through the pipeline or leave an internal note. Admin only. */
  update: async (id, cambios) => {
    const response = await apiRequest(`/api/colaboraciones/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(cambios),
    });
    return handleResponse(response, "Error al actualizar la postulación");
  },
};
