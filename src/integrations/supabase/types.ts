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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          age_max: number | null
          age_min: number | null
          condition: string | null
          consented_count: number
          created_at: string
          escrowed_amount: number
          geography: string | null
          id: string
          metadata_hash: string | null
          name: string
          researcher_id: string | null
          researcher_name: string | null
          reward_per_record: number
          sample_size: number
          status: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          condition?: string | null
          consented_count?: number
          created_at?: string
          escrowed_amount?: number
          geography?: string | null
          id?: string
          metadata_hash?: string | null
          name: string
          researcher_id?: string | null
          researcher_name?: string | null
          reward_per_record?: number
          sample_size?: number
          status?: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          condition?: string | null
          consented_count?: number
          created_at?: string
          escrowed_amount?: number
          geography?: string | null
          id?: string
          metadata_hash?: string | null
          name?: string
          researcher_id?: string | null
          researcher_name?: string | null
          reward_per_record?: number
          sample_size?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          campaign_id: string
          created_at: string
          data_hash: string | null
          id: string
          patient_id: string
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          data_hash?: string | null
          id?: string
          patient_id: string
          status?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          data_hash?: string | null
          id?: string
          patient_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_goals: {
        Row: {
          created_at: string
          current_value: string | null
          deadline: string | null
          goal_type: string
          id: string
          status: string
          target_value: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: string | null
          deadline?: string | null
          goal_type: string
          id?: string
          status?: string
          target_value: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: string | null
          deadline?: string | null
          goal_type?: string
          id?: string
          status?: string
          target_value?: string
          user_id?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          anonymized_json: Json | null
          created_at: string
          file_name: string
          file_url: string | null
          id: string
          quality_score: number | null
          status: string
          user_id: string
        }
        Insert: {
          anonymized_json?: Json | null
          created_at?: string
          file_name: string
          file_url?: string | null
          id?: string
          quality_score?: number | null
          status?: string
          user_id: string
        }
        Update: {
          anonymized_json?: Json | null
          created_at?: string
          file_name?: string
          file_url?: string | null
          id?: string
          quality_score?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_timeline: {
        Row: {
          created_at: string
          date: string
          description: string | null
          event_type: string
          id: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          event_type: string
          id?: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          event_type?: string
          id?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          badge: string | null
          campaigns_joined: number
          display_name: string | null
          id: string
          rank: number | null
          records_count: number
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badge?: string | null
          campaigns_joined?: number
          display_name?: string | null
          id?: string
          rank?: number | null
          records_count?: number
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badge?: string | null
          campaigns_joined?: number
          display_name?: string | null
          id?: string
          rank?: number | null
          records_count?: number
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          data_retention_days: number
          id: string
          marketplace_enabled: boolean
          share_conditions: boolean
          share_demographics: boolean
          share_lab_results: boolean
          share_medications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          data_retention_days?: number
          id?: string
          marketplace_enabled?: boolean
          share_conditions?: boolean
          share_demographics?: boolean
          share_lab_results?: boolean
          share_medications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          data_retention_days?: number
          id?: string
          marketplace_enabled?: boolean
          share_conditions?: boolean
          share_demographics?: boolean
          share_lab_results?: boolean
          share_medications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          contact_number: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          wallet_address: string | null
        }
        Insert: {
          age?: number | null
          contact_number?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          wallet_address?: string | null
        }
        Update: {
          age?: number | null
          contact_number?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_email: string
          referrer_id: string
          reward_amount: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_email: string
          referrer_id: string
          reward_amount?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_email?: string
          referrer_id?: string
          reward_amount?: number
          status?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
