// Official credentials and supervisor profiles for Mi Gusto
export const SUPERVISOR_ACCOUNTS = [
  {
    email: 'admin@migusto.com.ar',
    password: '123MiGusto.',
    supId: '__all',
    name: 'Administración Mi Gusto',
    role: 'Administrador General',
    avatarColor: 'from-amber-400 to-yellow-600',
  },
  {
    email: 'mariasalazar@migusto.com.ar',
    password: '123MiGusto.',
    supId: '__all',
    name: 'María Salazar',
    role: 'Administradora',
    avatarColor: 'from-amber-500 to-orange-600',
  },
  {
    email: 'elizabethcolman@migusto.com.ar',
    password: '123MiGusto.',
    supId: '__all',
    name: 'Elizabeth Colman',
    role: 'Administradora',
    avatarColor: 'from-purple-500 to-pink-600',
  },
  {
    email: 'selenehernandez@migusto.com.ar',
    password: 'MiGusto123.',
    supId: 'sup_selene',
    name: 'Selene Hernández',
    role: 'Supervisora Tienda Propia',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    email: 'sashaalfini@migusto.com.ar',
    password: 'MiGusto123.',
    supId: 'sup_sasha',
    name: 'Sasha Alfini',
    role: 'Supervisora Tienda Propia',
    avatarColor: 'from-purple-500 to-violet-600',
  },
  {
    email: 'martinsastre@migusto.com.ar',
    password: 'MiGusto123.',
    supId: 'sup_martin',
    name: 'Martín Sastre',
    role: 'Supervisor Tienda Propia',
    avatarColor: 'from-blue-500 to-cyan-600',
  },
  {
    email: 'damarisburgos@migusto.com.ar',
    password: 'MiGusto123.',
    supId: 'sup_damaris',
    name: 'Damaris Burgos',
    role: 'Supervisora de Tiendas',
    avatarColor: 'from-pink-500 to-rose-600',
  },
  {
    email: 'lidyatello@migusto.com.ar',
    password: '123MiGusto.',
    supId: '__all',
    name: 'Lidya Tello',
    role: 'Administradora',
    avatarColor: 'from-sky-500 to-indigo-600',
  },
  {
    email: 'evelyncedron@migusto.com.ar',
    password: 'MiGusto123.',
    supId: 'sup_evelyn',
    name: 'Evelyn Cedrón',
    role: 'Supervisora de Tiendas',
    avatarColor: 'from-teal-500 to-cyan-600',
  },
];

export function canUserDeleteRecords(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'lidyatello@migusto.com.ar'
  );
}

export function canUserEditRecords(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'lidyatello@migusto.com.ar'
  );
}

export function canUserManageStores(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'lidyatello@migusto.com.ar'
  );
}

export function canUserAccessHistory(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'lidyatello@migusto.com.ar'
  );
}

export function canUserViewLiveLocations(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'lidyatello@migusto.com.ar'
  );
}

export function canUserAccessSupervisionFromPlanificacion(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar' ||
    email === 'mariazalazar@migusto.com.ar' ||
    user?.role === 'Administrador General'
  );
}

export function isUserAdmin(user) {
  return canUserDeleteRecords(user) || user?.supId === '__all';
}

const LS_AUTH_KEY = 'mg_supervisor_session';

export function getStoredSession() {
  const raw = localStorage.getItem(LS_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveSession(user) {
  localStorage.setItem(LS_AUTH_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(LS_AUTH_KEY);
}

const LS_CUSTOM_PASSWORDS_KEY = 'mg_custom_passwords_cache';

export async function fetchCustomPasswords() {
  // Try loading from Supabase mg_config
  const { getSupabase } = await import('./supabase');
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('mg_config')
        .select('data')
        .eq('id', 'user_passwords')
        .maybeSingle();

      if (!error && data && data.data) {
        localStorage.setItem(LS_CUSTOM_PASSWORDS_KEY, JSON.stringify(data.data));
        return data.data;
      }
    } catch (err) {
      console.warn('Failed to fetch custom passwords from Supabase:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LS_CUSTOM_PASSWORDS_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    return {};
  }
}

export function getCachedCustomPasswords() {
  try {
    const cached = localStorage.getItem(LS_CUSTOM_PASSWORDS_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    return {};
  }
}

export async function updateUserPassword(email, currentPassword, newPassword) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCurrent = String(currentPassword || '').trim();
  const cleanNew = String(newPassword || '').trim();

  if (!cleanNew || cleanNew.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  // Find user account
  const account = SUPERVISOR_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === cleanEmail
  );
  if (!account) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  // Get current effective password
  const customPasswords = await fetchCustomPasswords();
  const expectedPassword = customPasswords[cleanEmail] || account.password;

  if (cleanCurrent !== expectedPassword) {
    return { success: false, error: 'La contraseña actual ingresada es incorrecta.' };
  }

  // Update in local cache
  const updatedMap = {
    ...customPasswords,
    [cleanEmail]: cleanNew,
  };
  localStorage.setItem(LS_CUSTOM_PASSWORDS_KEY, JSON.stringify(updatedMap));

  // Sync with Supabase mg_config
  const { getSupabase } = await import('./supabase');
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('mg_config').upsert({
        id: 'user_passwords',
        data: updatedMap,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Error saving password to Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to sync password with Supabase:', err);
    }
  }

  return { success: true };
}

export async function authenticateSupervisorAsync(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  const found = SUPERVISOR_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === cleanEmail
  );

  if (!found) {
    return {
      success: false,
      error: 'Correo o contraseña incorrectos. Verificá los datos.',
    };
  }

  // Try to get fresh passwords from Supabase, or fallback to cache
  let customMap = {};
  try {
    customMap = await fetchCustomPasswords();
  } catch (e) {
    customMap = getCachedCustomPasswords();
  }

  const effectivePassword = customMap[cleanEmail] || found.password;

  if (cleanPassword === effectivePassword) {
    const sessionUser = {
      email: found.email,
      supId: found.supId,
      name: found.name,
      role: found.role,
      avatarColor: found.avatarColor,
      loggedInAt: new Date().toISOString(),
    };
    saveSession(sessionUser);
    return { success: true, user: sessionUser };
  }

  return {
    success: false,
    error: 'Correo o contraseña incorrectos. Verificá los datos.',
  };
}

// Synchronous version for backwards compatibility
export function authenticateSupervisor(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  const found = SUPERVISOR_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === cleanEmail
  );

  if (found) {
    const customMap = getCachedCustomPasswords();
    const effectivePassword = customMap[cleanEmail] || found.password;

    if (cleanPassword === effectivePassword) {
      const sessionUser = {
        email: found.email,
        supId: found.supId,
        name: found.name,
        role: found.role,
        avatarColor: found.avatarColor,
        loggedInAt: new Date().toISOString(),
      };
      saveSession(sessionUser);
      return { success: true, user: sessionUser };
    }
  }

  return {
    success: false,
    error: 'Correo o contraseña incorrectos. Verificá los datos.',
  };
}
