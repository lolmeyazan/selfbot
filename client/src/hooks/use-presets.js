import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from "@shared/routes.js";

// ============================================
// Message Templates
// ============================================
export function useMessageTemplates() {
  return useQuery({
    queryKey: [api.messageTemplates.list.path],
    queryFn: async () => {
      const res = await fetch(api.messageTemplates.list.path);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return api.messageTemplates.list.responses[200].parse(await res.json());
    }
  });
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(api.messageTemplates.create.path, {
        method: api.messageTemplates.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create template');
      return api.messageTemplates.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messageTemplates.list.path] });
    }
  });
}

// ============================================
// Presence Presets
// ============================================
export function usePresencePresets() {
  return useQuery({
    queryKey: [api.presencePresets.list.path],
    queryFn: async () => {
      const res = await fetch(api.presencePresets.list.path);
      if (!res.ok) throw new Error('Failed to fetch presets');
      return api.presencePresets.list.responses[200].parse(await res.json());
    }
  });
}

export function useCreatePresencePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(api.presencePresets.create.path, {
        method: api.presencePresets.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create preset');
      return api.presencePresets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.presencePresets.list.path] });
    }
  });
}
