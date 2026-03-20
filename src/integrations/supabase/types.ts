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
      ai_analyses: {
        Row: {
          analysis_type: string
          cost_usd: number | null
          created_at: string | null
          id: string
          insights: Json | null
          meta_account_id: string | null
          model_used: string | null
          period_end: string | null
          period_start: string | null
          summary_text: string | null
          tokens_used_input: number | null
          tokens_used_output: number | null
        }
        Insert: {
          analysis_type: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          insights?: Json | null
          meta_account_id?: string | null
          model_used?: string | null
          period_end?: string | null
          period_start?: string | null
          summary_text?: string | null
          tokens_used_input?: number | null
          tokens_used_output?: number | null
        }
        Update: {
          analysis_type?: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          insights?: Json | null
          meta_account_id?: string | null
          model_used?: string | null
          period_end?: string | null
          period_start?: string | null
          summary_text?: string | null
          tokens_used_input?: number | null
          tokens_used_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_meta_account_id_fkey"
            columns: ["meta_account_id"]
            isOneToOne: false
            referencedRelation: "meta_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string
          body: string | null
          client_id: string | null
          created_at: string | null
          gestor_id: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          meta_account_id: string | null
          metadata: Json | null
          severity: string | null
          title: string
        }
        Insert: {
          alert_type: string
          body?: string | null
          client_id?: string | null
          created_at?: string | null
          gestor_id?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          meta_account_id?: string | null
          metadata?: Json | null
          severity?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          body?: string | null
          client_id?: string | null
          created_at?: string | null
          gestor_id?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          meta_account_id?: string | null
          metadata?: Json | null
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_meta_account_id_fkey"
            columns: ["meta_account_id"]
            isOneToOne: false
            referencedRelation: "meta_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          claude_calls: number | null
          claude_cost_usd: number | null
          claude_tokens_input: number | null
          claude_tokens_output: number | null
          gestor_id: string | null
          id: string
          meta_api_calls: number | null
          month_year: string
          updated_at: string | null
        }
        Insert: {
          claude_calls?: number | null
          claude_cost_usd?: number | null
          claude_tokens_input?: number | null
          claude_tokens_output?: number | null
          gestor_id?: string | null
          id?: string
          meta_api_calls?: number | null
          month_year: string
          updated_at?: string | null
        }
        Update: {
          claude_calls?: number | null
          claude_cost_usd?: number | null
          claude_tokens_input?: number | null
          claude_tokens_output?: number | null
          gestor_id?: string | null
          id?: string
          meta_api_calls?: number | null
          month_year?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cakto_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
        }
        Relationships: []
      }
      meta_accounts: {
        Row: {
          access_token_encrypted: string
          account_name: string | null
          ad_account_id: string
          client_id: string
          created_at: string | null
          currency: string | null
          gestor_id: string
          id: string
          is_active: boolean | null
          timezone: string | null
          token_expires_at: string | null
          token_last_refreshed_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token_encrypted: string
          account_name?: string | null
          ad_account_id: string
          client_id: string
          created_at?: string | null
          currency?: string | null
          gestor_id: string
          id?: string
          is_active?: boolean | null
          timezone?: string | null
          token_expires_at?: string | null
          token_last_refreshed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token_encrypted?: string
          account_name?: string | null
          ad_account_id?: string
          client_id?: string
          created_at?: string | null
          currency?: string | null
          gestor_id?: string
          id?: string
          is_active?: boolean | null
          timezone?: string | null
          token_expires_at?: string | null
          token_last_refreshed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_accounts_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_daily: {
        Row: {
          actions: Json | null
          ad_id: string | null
          adset_id: string | null
          campaign_id: string | null
          clicks: number | null
          cpc: number | null
          cpm: number | null
          cpp: number | null
          created_at: string | null
          ctr: number | null
          date: string
          frequency: number | null
          id: string
          impressions: number | null
          leads: number | null
          meta_account_id: string | null
          purchases: number | null
          reach: number | null
          revenue: number | null
          roas: number | null
          spend: number | null
        }
        Insert: {
          actions?: Json | null
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          cpp?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          meta_account_id?: string | null
          purchases?: number | null
          reach?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Update: {
          actions?: Json | null
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          cpp?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          meta_account_id?: string | null
          purchases?: number | null
          reach?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_daily_meta_account_id_fkey"
            columns: ["meta_account_id"]
            isOneToOne: false
            referencedRelation: "meta_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_credits_remaining: number | null
          avatar_url: string | null
          cakto_subscription_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          gestor_id: string | null
          id: string
          plan: string | null
          plan_expires_at: string | null
          plan_status: string | null
          role: string
          updated_at: string | null
          white_label_brand_name: string | null
          white_label_logo_url: string | null
        }
        Insert: {
          ai_credits_remaining?: number | null
          avatar_url?: string | null
          cakto_subscription_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gestor_id?: string | null
          id: string
          plan?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          role?: string
          updated_at?: string | null
          white_label_brand_name?: string | null
          white_label_logo_url?: string | null
        }
        Update: {
          ai_credits_remaining?: number | null
          avatar_url?: string | null
          cakto_subscription_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gestor_id?: string | null
          id?: string
          plan?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          role?: string
          updated_at?: string | null
          white_label_brand_name?: string | null
          white_label_logo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          client_id: string | null
          content_json: Json | null
          created_at: string | null
          gestor_id: string | null
          id: string
          meta_account_id: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          report_type: string | null
          status: string | null
          title: string | null
          white_label_applied: boolean | null
        }
        Insert: {
          client_id?: string | null
          content_json?: Json | null
          created_at?: string | null
          gestor_id?: string | null
          id?: string
          meta_account_id?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          report_type?: string | null
          status?: string | null
          title?: string | null
          white_label_applied?: boolean | null
        }
        Update: {
          client_id?: string | null
          content_json?: Json | null
          created_at?: string | null
          gestor_id?: string | null
          id?: string
          meta_account_id?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          report_type?: string | null
          status?: string | null
          title?: string | null
          white_label_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_meta_account_id_fkey"
            columns: ["meta_account_id"]
            isOneToOne: false
            referencedRelation: "meta_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_account_limit: { Args: { p_gestor_id: string }; Returns: boolean }
      is_admin_global: { Args: { _user_id: string }; Returns: boolean }
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
