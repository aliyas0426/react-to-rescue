export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          created_by: string | null
          disaster_type: Database["public"]["Enums"]["disaster_type"] | null
          expires_at: string | null
          id: string
          is_active: boolean
          location_lat: number | null
          location_lng: number | null
          message: string
          radius_km: number | null
          severity: Database["public"]["Enums"]["disaster_severity"]
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          disaster_type?: Database["public"]["Enums"]["disaster_type"] | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          location_lat?: number | null
          location_lng?: number | null
          message: string
          radius_km?: number | null
          severity?: Database["public"]["Enums"]["disaster_severity"]
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          disaster_type?: Database["public"]["Enums"]["disaster_type"] | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          location_lat?: number | null
          location_lng?: number | null
          message?: string
          radius_km?: number | null
          severity?: Database["public"]["Enums"]["disaster_severity"]
          title?: string
        }
        Relationships: []
      }
      disaster_reports: {
        Row: {
          created_at: string
          description: string
          disaster_type: Database["public"]["Enums"]["disaster_type"]
          id: string
          image_url: string | null
          location_lat: number
          location_lng: number
          location_name: string | null
          severity: Database["public"]["Enums"]["disaster_severity"]
          status: Database["public"]["Enums"]["disaster_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          disaster_type?: Database["public"]["Enums"]["disaster_type"]
          id?: string
          image_url?: string | null
          location_lat: number
          location_lng: number
          location_name?: string | null
          severity?: Database["public"]["Enums"]["disaster_severity"]
          status?: Database["public"]["Enums"]["disaster_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          disaster_type?: Database["public"]["Enums"]["disaster_type"]
          id?: string
          image_url?: string | null
          location_lat?: number
          location_lng?: number
          location_name?: string | null
          severity?: Database["public"]["Enums"]["disaster_severity"]
          status?: Database["public"]["Enums"]["disaster_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string
          description: string | null
          disaster_type: Database["public"]["Enums"]["disaster_type"]
          id: string
          location_lat: number
          location_lng: number
          location_name: string | null
          predicted_date: string | null
          probability: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          disaster_type: Database["public"]["Enums"]["disaster_type"]
          id?: string
          location_lat: number
          location_lng: number
          location_name?: string | null
          predicted_date?: string | null
          probability: number
        }
        Update: {
          created_at?: string
          description?: string | null
          disaster_type?: Database["public"]["Enums"]["disaster_type"]
          id?: string
          location_lat?: number
          location_lng?: number
          location_name?: string | null
          predicted_date?: string | null
          probability?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          location_lat: number
          location_lng: number
          name: string
          phone: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          location_lat: number
          location_lng: number
          name: string
          phone?: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          location_lat?: number
          location_lng?: number
          name?: string
          phone?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      disaster_severity: "low" | "medium" | "high" | "critical"
      disaster_status: "pending" | "approved" | "rejected" | "resolved"
      disaster_type:
        | "earthquake"
        | "flood"
        | "fire"
        | "hurricane"
        | "tornado"
        | "tsunami"
        | "landslide"
        | "drought"
        | "other"
      resource_type:
        | "hospital"
        | "shelter"
        | "food_center"
        | "fire_station"
        | "police_station"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      disaster_severity: ["low", "medium", "high", "critical"],
      disaster_status: ["pending", "approved", "rejected", "resolved"],
      disaster_type: [
        "earthquake",
        "flood",
        "fire",
        "hurricane",
        "tornado",
        "tsunami",
        "landslide",
        "drought",
        "other",
      ],
      resource_type: [
        "hospital",
        "shelter",
        "food_center",
        "fire_station",
        "police_station",
        "other",
      ],
    },
  },
} as const
