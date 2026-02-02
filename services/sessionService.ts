import { CustomerSession } from '../types';

const SESSION_KEY = 'pehanawa_customer_session';

/**
 * Convert File to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Convert base64 string back to File
 */
const base64ToFile = (base64: string, mimeType: string, fileName: string = 'customer.jpg'): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
};

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Save customer photo to session storage
 */
export const saveCustomerPhoto = async (file: File): Promise<string> => {
    const base64 = await fileToBase64(file);
    const sessionId = generateSessionId();

    const session: CustomerSession = {
        sessionId,
        customerImageBase64: base64,
        customerImageType: file.type,
        createdAt: Date.now(),
    };

    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return sessionId;
    } catch (error) {
        // If sessionStorage fails (quota exceeded), try localStorage
        console.warn('SessionStorage failed, trying localStorage:', error);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return sessionId;
    }
};

/**
 * Get customer photo from session storage
 */
export const getCustomerPhoto = (): File | null => {
    try {
        const sessionData = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);

        if (!sessionData) return null;

        const session: CustomerSession = JSON.parse(sessionData);
        return base64ToFile(session.customerImageBase64, session.customerImageType);
    } catch (error) {
        console.error('Error retrieving customer photo:', error);
        return null;
    }
};

/**
 * Check if a customer session exists
 */
export const hasCustomerSession = (): boolean => {
    return !!(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY));
};

/**
 * Clear customer session
 */
export const clearCustomerSession = (): void => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
};

/**
 * Get session info (without the full image data)
 */
export const getSessionInfo = (): { sessionId: string; createdAt: number } | null => {
    try {
        const sessionData = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);

        if (!sessionData) return null;

        const session: CustomerSession = JSON.parse(sessionData);
        return {
            sessionId: session.sessionId,
            createdAt: session.createdAt,
        };
    } catch {
        return null;
    }
};
