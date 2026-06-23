export function saveRegistrationData(key: string, data: unknown) {
  const serialized = JSON.stringify(data);
  let saved = false;

  try {
    sessionStorage.setItem(key, serialized);
    saved = true;
  } catch (error) {
    console.warn(`Could not save ${key} to sessionStorage`, error);
  }

  try {
    localStorage.setItem(key, serialized);
    saved = true;
  } catch (error) {
    console.warn(`Could not save ${key} to localStorage`, error);
  }

  return saved;
}

export function getRegistrationData(key: string) {
  try {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) return sessionValue;
  } catch (error) {
    console.warn(`Could not read ${key} from sessionStorage`, error);
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Could not read ${key} from localStorage`, error);
    return null;
  }
}

export function clearRegistrationData(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`Could not clear ${key} from sessionStorage`, error);
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Could not clear ${key} from localStorage`, error);
  }
}
