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
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
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
}));

export default useFormStore;
