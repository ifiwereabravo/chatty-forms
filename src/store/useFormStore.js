import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const API_URL = chattyFormsData?.apiUrl || '/wp-json/chatty-forms/v1';
const NONCE = chattyFormsData?.nonce || '';

const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': NONCE,
            ...options.headers,
        },
        ...options,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
};

const useFormStore = create((set, get) => ({
    // --- Form List State ---
    forms: [],
    isLoadingForms: false,

    // --- Editor State ---
    form: { id: null, title: 'Untitled Form', status: 'draft' },
    fields: [],
    settings: {},
    selectedFieldId: null,
    isDragging: false,
    isSaving: false,
    hasUnsavedChanges: false,

    // === Form List Actions ===
    fetchForms: async () => {
        set({ isLoadingForms: true });
        try {
            const forms = await apiFetch('/forms');
            set({ forms, isLoadingForms: false });
        } catch (e) {
            console.error('Failed to fetch forms:', e);
            set({ isLoadingForms: false });
        }
    },

    deleteForm: async (id) => {
        try {
            await apiFetch(`/forms/${id}`, { method: 'DELETE' });
            set((state) => ({ forms: state.forms.filter((f) => f.id !== id) }));
        } catch (e) {
            console.error('Failed to delete form:', e);
        }
    },

    // === Editor Actions ===
    loadForm: async (id) => {
        try {
            const form = await apiFetch(`/forms/${id}`);
            set({
                form: { id: form.id, title: form.title, status: form.status },
                fields: form.fields || [],
                settings: form.settings || {},
                selectedFieldId: null,
                hasUnsavedChanges: false,
            });
        } catch (e) {
            console.error('Failed to load form:', e);
        }
    },

    newForm: () => {
        set({
            form: { id: null, title: 'Untitled Form', status: 'draft' },
            fields: [],
            settings: {},
            selectedFieldId: null,
            hasUnsavedChanges: false,
        });
    },

    saveForm: async () => {
        const { form, fields, settings } = get();
        set({ isSaving: true });
        try {
            if (form.id) {
                // Update existing
                await apiFetch(`/forms/${form.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ title: form.title, fields, settings, status: form.status }),
                });
            } else {
                // Create new
                const result = await apiFetch('/forms', {
                    method: 'POST',
                    body: JSON.stringify({ title: form.title, fields, settings, status: form.status }),
                });
                set((state) => ({
                    form: { ...state.form, id: result.id },
                }));
            }
            set({ isSaving: false, hasUnsavedChanges: false });
        } catch (e) {
            console.error('Failed to save form:', e);
            set({ isSaving: false });
        }
    },

    setFormTitle: (title) => set((state) => ({
        form: { ...state.form, title },
        hasUnsavedChanges: true,
    })),

    setForm: (form) => set({ form }),

    updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
        hasUnsavedChanges: true,
    })),

    addField: (type, index = null) => set((state) => {
        const newField = {
            id: uuidv4(),
            type,
            label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
            placeholder: '',
            required: false,
        };
        const newFields = [...state.fields];
        if (index !== null) {
            newFields.splice(index, 0, newField);
        } else {
            newFields.push(newField);
        }
        return { fields: newFields, selectedFieldId: newField.id, hasUnsavedChanges: true };
    }),

    removeField: (id) => set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
        hasUnsavedChanges: true,
    })),

    updateField: (id, updates) => set((state) => ({
        fields: state.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        hasUnsavedChanges: true,
    })),

    moveField: (dragIndex, hoverIndex) => set((state) => {
        const newFields = [...state.fields];
        const [removed] = newFields.splice(dragIndex, 1);
        newFields.splice(hoverIndex, 0, removed);
        return { fields: newFields, hasUnsavedChanges: true };
    }),

    selectField: (id) => set({ selectedFieldId: id }),
    setIsDragging: (isDragging) => set({ isDragging }),

    // === Clone ===
    cloneForm: async (id) => {
        try {
            const result = await apiFetch(`/forms/${id}/clone`, { method: 'POST' });
            // Refresh form list
            await get().fetchForms();
            return result;
        } catch (e) {
            console.error('Failed to clone form:', e);
            return null;
        }
    },

    // === Export / Import ===
    exportForms: async (ids = []) => {
        try {
            const result = await apiFetch('/forms/export', {
                method: 'POST',
                body: JSON.stringify({ ids }),
            });
            return result;
        } catch (e) {
            console.error('Failed to export forms:', e);
            return null;
        }
    },

    importForms: async (data) => {
        try {
            const result = await apiFetch('/forms/import', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            await get().fetchForms();
            return result;
        } catch (e) {
            console.error('Failed to import forms:', e);
            return null;
        }
    },

    // === Templates ===
    createFromTemplate: async (template) => {
        try {
            const result = await apiFetch('/forms', {
                method: 'POST',
                body: JSON.stringify({
                    title: template.title,
                    fields: template.fields,
                    settings: template.settings || {},
                    status: 'draft',
                }),
            });
            return result;
        } catch (e) {
            console.error('Failed to create from template:', e);
            return null;
        }
    },
}));

// Built-in form templates
export const FORM_TEMPLATES = [
    {
        id: 'contact',
        title: 'Contact Us',
        description: 'Simple contact form with name, email, and message.',
        icon: '✉️',
        fields: [
            { id: 'f1', type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
            { id: 'f2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
            { id: 'f3', type: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567', required: false },
            { id: 'f4', type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true },
        ],
        settings: { submitText: 'Send Message', successMessage: 'Thanks for reaching out! We\'ll get back to you soon.' },
    },
    {
        id: 'quote',
        title: 'Request a Quote',
        description: 'Lead form for service businesses with project details.',
        icon: '💰',
        fields: [
            { id: 'f1', type: 'text', label: 'Full Name', placeholder: 'Your name', required: true },
            { id: 'f2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
            { id: 'f3', type: 'phone', label: 'Phone', placeholder: '(555) 123-4567', required: true },
            { id: 'f4', type: 'select', label: 'Service Type', required: true, options: ['General Inquiry', 'New Installation', 'Repair', 'Maintenance', 'Other'] },
            { id: 'f5', type: 'textarea', label: 'Project Details', placeholder: 'Tell us about your project...', required: false },
        ],
        settings: { submitText: 'Get My Quote', successMessage: 'Your quote request has been submitted! We\'ll contact you within 24 hours.' },
    },
    {
        id: 'feedback',
        title: 'Feedback',
        description: 'Collect customer feedback and ratings.',
        icon: '⭐',
        fields: [
            { id: 'f1', type: 'text', label: 'Name', placeholder: 'Optional', required: false },
            { id: 'f2', type: 'email', label: 'Email', placeholder: 'Optional', required: false },
            { id: 'f3', type: 'select', label: 'How would you rate your experience?', required: true, options: ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'] },
            { id: 'f4', type: 'textarea', label: 'Tell us more', placeholder: 'What did you like or how can we improve?', required: false },
        ],
        settings: { submitText: 'Submit Feedback', successMessage: 'Thank you for your feedback!' },
    },
    {
        id: 'newsletter',
        title: 'Newsletter Signup',
        description: 'Simple email capture form for newsletters.',
        icon: '📰',
        fields: [
            { id: 'f1', type: 'text', label: 'First Name', placeholder: 'Your first name', required: true },
            { id: 'f2', type: 'email', label: 'Email Address', placeholder: 'you@example.com', required: true },
        ],
        settings: { submitText: 'Subscribe', successMessage: 'You\'re subscribed! Check your inbox for a confirmation.' },
    },
    {
        id: 'event',
        title: 'Event Registration',
        description: 'Registration form for events and webinars.',
        icon: '🎟️',
        fields: [
            { id: 'f1', type: 'text', label: 'Full Name', placeholder: 'Your name', required: true },
            { id: 'f2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
            { id: 'f3', type: 'phone', label: 'Phone', placeholder: '(555) 123-4567', required: false },
            { id: 'f4', type: 'text', label: 'Company / Organization', placeholder: 'Optional', required: false },
            { id: 'f5', type: 'select', label: 'How did you hear about us?', required: false, options: ['Social Media', 'Email', 'Friend/Colleague', 'Search Engine', 'Other'] },
        ],
        settings: { submitText: 'Register Now', successMessage: 'You\'re registered! We\'ll send you event details shortly.' },
    },
];

export default useFormStore;
