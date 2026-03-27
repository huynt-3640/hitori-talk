export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          name_ja: string
          xp_reward: number
        }
        Insert: {
          category?: string
          condition_type: string
          condition_value: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          name_ja: string
          xp_reward?: number
        }
        Update: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          name_ja?: string
          xp_reward?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_role: string
          context_details: Json
          created_at: string
          ended_at: string | null
          id: string
          message_count: number
          started_at: string
          status: string
          title: string
          topic_id: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          ai_role?: string
          context_details?: Json
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number
          started_at?: string
          status?: string
          title?: string
          topic_id?: string | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          ai_role?: string
          context_details?: Json
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number
          started_at?: string
          status?: string
          title?: string
          topic_id?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          conversations_count: number
          corrections_applied: number
          created_at: string
          date: string
          id: string
          messages_count: number
          mistakes_count: number
          practice_minutes: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          conversations_count?: number
          corrections_applied?: number
          created_at?: string
          date?: string
          id?: string
          messages_count?: number
          mistakes_count?: number
          practice_minutes?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          conversations_count?: number
          corrections_applied?: number
          created_at?: string
          date?: string
          id?: string
          messages_count?: number
          mistakes_count?: number
          practice_minutes?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          conversation_id: string
          corrections: Json | null
          created_at: string
          id: string
          role: string
          token_count: number | null
          translation: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          conversation_id: string
          corrections?: Json | null
          created_at?: string
          id?: string
          role: string
          token_count?: number | null
          translation?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          conversation_id?: string
          corrections?: Json | null
          created_at?: string
          id?: string
          role?: string
          token_count?: number | null
          translation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mistake_log: {
        Row: {
          conversation_id: string | null
          corrected_text: string
          created_at: string
          explanation: string | null
          id: string
          is_reviewed: boolean
          message_id: string | null
          mistake_type: string
          original_text: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          corrected_text: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_reviewed?: boolean
          message_id?: string | null
          mistake_type: string
          original_text: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          corrected_text?: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_reviewed?: boolean
          message_id?: string | null
          mistake_type?: string
          original_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mistake_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mistake_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mistake_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          daily_goal: number
          display_name: string
          id: string
          jlpt_level: string
          level: number
          longest_streak: number
          onboarding_completed: boolean
          preferred_language: string
          total_conversations: number
          total_messages: number
          total_xp: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          daily_goal?: number
          display_name?: string
          id: string
          jlpt_level?: string
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          preferred_language?: string
          total_conversations?: number
          total_messages?: number
          total_xp?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          daily_goal?: number
          display_name?: string
          id?: string
          jlpt_level?: string
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          preferred_language?: string
          total_conversations?: number
          total_messages?: number
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          category: string
          context_generation_prompt: string
          created_at: string
          description: string
          example_phrases: { ja: string; vi: string }[]
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          tips: string[]
          title: string
          title_ja: string
        }
        Insert: {
          category: string
          context_generation_prompt: string
          created_at?: string
          description: string
          example_phrases?: { ja: string; vi: string }[]
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          tips?: string[]
          title: string
          title_ja: string
        }
        Update: {
          category?: string
          context_generation_prompt?: string
          created_at?: string
          description?: string
          example_phrases?: { ja: string; vi: string }[]
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          tips?: string[]
          title?: string
          title_ja?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          earned_at: string | null
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          earned_at?: string | null
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          earned_at?: string | null
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
