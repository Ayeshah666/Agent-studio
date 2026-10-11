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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          agent_type: string
          allowed_domain: string | null
          business_name: string | null
          call_count: number
          chat_count: number
          chatbot: Json
          collect_fields: Json
          created_at: string
          first_message: string | null
          goal: string | null
          id: string
          industry: string | null
          language: string | null
          llm_model: string | null
          name: string
          settings: Json
          status: string
          system_prompt: string | null
          timezone: string | null
          updated_at: string
          voice_id: string | null
          website: string | null
        }
        Insert: {
          agent_type?: string
          allowed_domain?: string | null
          business_name?: string | null
          call_count?: number
          chat_count?: number
          chatbot?: Json
          collect_fields?: Json
          created_at?: string
          first_message?: string | null
          goal?: string | null
          id?: string
          industry?: string | null
          language?: string | null
          llm_model?: string | null
          name: string
          settings?: Json
          status?: string
          system_prompt?: string | null
          timezone?: string | null
          updated_at?: string
          voice_id?: string | null
          website?: string | null
        }
        Update: {
          agent_type?: string
          allowed_domain?: string | null
          business_name?: string | null
          call_count?: number
          chat_count?: number
          chatbot?: Json
          collect_fields?: Json
          created_at?: string
          first_message?: string | null
          goal?: string | null
          id?: string
          industry?: string | null
          language?: string | null
          llm_model?: string | null
          name?: string
          settings?: Json
          status?: string
          system_prompt?: string | null
          timezone?: string | null
          updated_at?: string
          voice_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          agent_id: string | null
          contact_id: string | null
          created_at: string
          direction: string | null
          duration_seconds: number | null
          from_number: string | null
          id: string
          recording_url: string | null
          summary: string | null
          to_number: string | null
          transcript: Json
        }
        Insert: {
          agent_id?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          recording_url?: string | null
          summary?: string | null
          to_number?: string | null
          transcript?: Json
        }
        Update: {
          agent_id?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          recording_url?: string | null
          summary?: string | null
          to_number?: string | null
          transcript?: Json
        }
        Relationships: [
          {
            foreignKeyName: "calls_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          agent_id: string | null
          company: string | null
          created_at: string
          data: Json
          email: string | null
          id: string
          name: string | null
          phone: string | null
        }
        Insert: {
          agent_id?: string | null
          company?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Update: {
          agent_id?: string | null
          company?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          channel: string
          contact_id: string | null
          created_at: string
          id: string
          messages: Json
          summary: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          summary?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          embedding: string
          id: string
          item_id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          embedding: string
          id?: string
          item_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          agent_id: string | null
          content: string | null
          created_at: string
          error: string | null
          id: string
          source_type: string
          source_url: string | null
          status: string
          title: string | null
        }
        Insert: {
          agent_id?: string | null
          content?: string | null
          created_at?: string
          error?: string | null
          id?: string
          source_type?: string
          source_url?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          agent_id?: string | null
          content?: string | null
          created_at?: string
          error?: string | null
          id?: string
          source_type?: string
          source_url?: string | null
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agent_id: string | null
          contact_id: string | null
          created_at: string
          data: Json
          id: string
          status: string | null
        }
        Insert: {
          agent_id?: string | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          status?: string | null
        }
        Update: {
          agent_id?: string | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_knowledge_chunks: {
        Args: { _agent_id: string; _count?: number; _embedding: string }
        Returns: {
          content: string
          similarity: number
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
