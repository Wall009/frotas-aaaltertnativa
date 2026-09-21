import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentProfile() {
  const { data, isLoading } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
  return { profile: data ?? null, isAdmin: data?.role === "admin", isLoading };
}
