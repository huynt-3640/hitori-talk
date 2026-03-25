export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          jlpt_level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null;
          user_level: number;
          xp: number;
          streak_count: number;
          last_practice_date: string | null;
          placement_test_completed: boolean;
          placement_test_result: Record<string, unknown> | null;
          preferences: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          jlpt_level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null;
          user_level?: number;
          xp?: number;
          streak_count?: number;
          last_practice_date?: string | null;
          placement_test_completed?: boolean;
          placement_test_result?: Record<string, unknown> | null;
          preferences?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      topics: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          is_custom: boolean;
          created_by_user_id: string | null;
          context_generation_prompt: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: string;
          is_custom?: boolean;
          created_by_user_id?: string | null;
          context_generation_prompt?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['topics']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string | null;
          context_scenario: string | null;
          context_details: Record<string, unknown> | null;
          duration_seconds: number | null;
          message_count: number;
          xp_earned: number;
          mistakes_count: number;
          status: 'active' | 'completed' | 'abandoned';
          metadata: Record<string, unknown>;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id?: string | null;
          context_scenario?: string | null;
          context_details?: Record<string, unknown> | null;
          duration_seconds?: number | null;
          message_count?: number;
          xp_earned?: number;
          mistakes_count?: number;
          status?: 'active' | 'completed' | 'abandoned';
          metadata?: Record<string, unknown>;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content_text: string;
          content_audio_url: string | null;
          corrections: Correction[] | null;
          translation: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content_text: string;
          content_audio_url?: string | null;
          corrections?: Correction[] | null;
          translation?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string | null;
          icon: string | null;
          xp_reward: number;
          requirement: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          xp_reward?: number;
          requirement: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
        };
        Update: never;
      };
      mistake_log: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          message_id: string;
          mistake_type: string | null;
          original_text: string | null;
          corrected_text: string | null;
          explanation: string | null;
          grammar_point: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id: string;
          message_id: string;
          mistake_type?: string | null;
          original_text?: string | null;
          corrected_text?: string | null;
          explanation?: string | null;
          grammar_point?: string | null;
        };
        Update: Partial<Database['public']['Tables']['mistake_log']['Insert']>;
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          conversations_count: number;
          messages_sent: number;
          xp_earned: number;
          mistakes_made: number;
          study_time_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          conversations_count?: number;
          messages_sent?: number;
          xp_earned?: number;
          mistakes_made?: number;
          study_time_seconds?: number;
        };
        Update: Partial<Database['public']['Tables']['daily_stats']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Re-export Correction type used in messages table
export interface Correction {
  type: string;
  original: string;
  corrected: string;
  explanation: string;
}
