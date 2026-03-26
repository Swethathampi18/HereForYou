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
      audit_log: {
        Row: {
          action: string
          agent_name: string | null
          confidence: number | null
          created_at: string
          human_override: boolean | null
          id: string
          input_summary: string | null
          output_summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          agent_name?: string | null
          confidence?: number | null
          created_at?: string
          human_override?: boolean | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          agent_name?: string | null
          confidence?: number | null
          created_at?: string
          human_override?: boolean | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crisis_events: {
        Row: {
          detected_at: string
          escalated_to: string | null
          id: string
          intake_session_id: string | null
          notes: string | null
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          detected_at?: string
          escalated_to?: string | null
          id?: string
          intake_session_id?: string | null
          notes?: string | null
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          detected_at?: string
          escalated_to?: string | null
          id?: string
          intake_session_id?: string | null
          notes?: string | null
          resolved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crisis_events_intake_session_id_fkey"
            columns: ["intake_session_id"]
            isOneToOne: false
            referencedRelation: "intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_links: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      intake_sessions: {
        Row: {
          completed_at: string | null
          confidence_score: number | null
          conversation_json: Json | null
          cpt_suggestion: string | null
          created_at: string
          crisis_flag: boolean | null
          human_review_required: boolean | null
          icd10_suggestion: string | null
          id: string
          severity_level: Database["public"]["Enums"]["severity_level"] | null
          started_at: string
          status: Database["public"]["Enums"]["intake_status"]
          structured_features: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          confidence_score?: number | null
          conversation_json?: Json | null
          cpt_suggestion?: string | null
          created_at?: string
          crisis_flag?: boolean | null
          human_review_required?: boolean | null
          icd10_suggestion?: string | null
          id?: string
          severity_level?: Database["public"]["Enums"]["severity_level"] | null
          started_at?: string
          status?: Database["public"]["Enums"]["intake_status"]
          structured_features?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          confidence_score?: number | null
          conversation_json?: Json | null
          cpt_suggestion?: string | null
          created_at?: string
          crisis_flag?: boolean | null
          human_review_required?: boolean | null
          icd10_suggestion?: string | null
          id?: string
          severity_level?: Database["public"]["Enums"]["severity_level"] | null
          started_at?: string
          status?: Database["public"]["Enums"]["intake_status"]
          structured_features?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          match_rationale: string | null
          match_score: number | null
          match_type: Database["public"]["Enums"]["match_type"]
          prior_auth_draft: string | null
          prior_auth_status:
            | Database["public"]["Enums"]["prior_auth_status"]
            | null
          therapist_id: string | null
          user_id: string
          waitlist_position: number | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          match_rationale?: string | null
          match_score?: number | null
          match_type: Database["public"]["Enums"]["match_type"]
          prior_auth_draft?: string | null
          prior_auth_status?:
            | Database["public"]["Enums"]["prior_auth_status"]
            | null
          therapist_id?: string | null
          user_id: string
          waitlist_position?: number | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          match_rationale?: string | null
          match_score?: number | null
          match_type?: Database["public"]["Enums"]["match_type"]
          prior_auth_draft?: string | null
          prior_auth_status?:
            | Database["public"]["Enums"]["prior_auth_status"]
            | null
          therapist_id?: string | null
          user_id?: string
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "therapy_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_checkins: {
        Row: {
          ai_flag: boolean | null
          created_at: string
          id: string
          notes: string | null
          score: number
          user_id: string
        }
        Insert: {
          ai_flag?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          score: number
          user_id: string
        }
        Update: {
          ai_flag?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          recipient_id: string
          sender_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          recipient_id: string
          sender_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          reason: string
          referred_to: string
          referring_therapist_id: string
          specialty: string | null
          status: string
          urgency: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          reason: string
          referred_to: string
          referring_therapist_id: string
          specialty?: string | null
          status?: string
          urgency?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          reason?: string
          referred_to?: string
          referring_therapist_id?: string
          specialty?: string | null
          status?: string
          urgency?: string
        }
        Relationships: []
      }
      sessions_log: {
        Row: {
          claims_status: Database["public"]["Enums"]["claims_status"] | null
          coded_diagnosis: string | null
          id: string
          match_id: string | null
          mismatch_flag: boolean | null
          mismatch_reason: string | null
          notes_text: string | null
          session_date: string
          status: string
          therapist_id: string | null
          user_id: string
        }
        Insert: {
          claims_status?: Database["public"]["Enums"]["claims_status"] | null
          coded_diagnosis?: string | null
          id?: string
          match_id?: string | null
          mismatch_flag?: boolean | null
          mismatch_reason?: string | null
          notes_text?: string | null
          session_date?: string
          status?: string
          therapist_id?: string | null
          user_id: string
        }
        Update: {
          claims_status?: Database["public"]["Enums"]["claims_status"] | null
          coded_diagnosis?: string | null
          id?: string
          match_id?: string | null
          mismatch_flag?: boolean | null
          mismatch_reason?: string | null
          notes_text?: string | null
          session_date?: string
          status?: string
          therapist_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_log_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      therapy_groups: {
        Row: {
          created_at: string
          current_count: number | null
          id: string
          is_active: boolean | null
          max_capacity: number | null
          name: string
          schedule_json: Json | null
          severity_range: Database["public"]["Enums"]["severity_level"] | null
          therapist_id: string | null
          type: Database["public"]["Enums"]["group_type"]
        }
        Insert: {
          created_at?: string
          current_count?: number | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name: string
          schedule_json?: Json | null
          severity_range?: Database["public"]["Enums"]["severity_level"] | null
          therapist_id?: string | null
          type: Database["public"]["Enums"]["group_type"]
        }
        Update: {
          created_at?: string
          current_count?: number | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name?: string
          schedule_json?: Json | null
          severity_range?: Database["public"]["Enums"]["severity_level"] | null
          therapist_id?: string | null
          type?: Database["public"]["Enums"]["group_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          notified: boolean | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          notified?: boolean | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          notified?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "therapy_groups"
            referencedColumns: ["id"]
          },
        ]
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
      is_guardian_of: {
        Args: { _guardian_id: string; _patient_id: string }
        Returns: boolean
      }
      is_therapist_for: {
        Args: { _patient_id: string; _therapist_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "guardian" | "therapist" | "supervisor" | "admin"
      claims_status: "pending" | "validated" | "flagged" | "submitted"
      group_type:
        | "cbt_anxiety"
        | "alcohol_recovery"
        | "workplace_burnout"
        | "teen_anxiety"
        | "gad_mindfulness"
      intake_status: "in_progress" | "completed" | "escalated"
      match_type: "group" | "individual"
      prior_auth_status:
        | "pending"
        | "drafted"
        | "submitted"
        | "approved"
        | "rejected"
      severity_level: "low" | "moderate" | "high"
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
      app_role: ["patient", "guardian", "therapist", "supervisor", "admin"],
      claims_status: ["pending", "validated", "flagged", "submitted"],
      group_type: [
        "cbt_anxiety",
        "alcohol_recovery",
        "workplace_burnout",
        "teen_anxiety",
        "gad_mindfulness",
      ],
      intake_status: ["in_progress", "completed", "escalated"],
      match_type: ["group", "individual"],
      prior_auth_status: [
        "pending",
        "drafted",
        "submitted",
        "approved",
        "rejected",
      ],
      severity_level: ["low", "moderate", "high"],
    },
  },
} as const
