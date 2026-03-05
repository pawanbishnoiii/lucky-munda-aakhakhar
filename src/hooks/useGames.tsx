import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGames = () => {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .order("result_time");
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    gcTime: 60000,
  });
};

export const useAllGames = () => {
  return useQuery({
    queryKey: ["all-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("result_time");
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
};

export const useGameResults = (days = 5) => {
  return useQuery({
    queryKey: ["game-results", days],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      const dateStr = daysAgo.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("game_results")
        .select("*, games(name, name_hindi, result_time)")
        .gte("result_date", dateStr)
        .order("result_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      return map;
    },
    staleTime: 60000,
  });
};

export const getStatus = (resultTime: string) => {
  const now = new Date();
  const [h, m] = resultTime.split(":").map(Number);
  const gameTime = new Date();
  gameTime.setHours(h, m, 0);
  const diff = gameTime.getTime() - now.getTime();
  if (diff < 0) return "closed" as const;
  if (diff < 3600000) return "live" as const;
  return "upcoming" as const;
};
