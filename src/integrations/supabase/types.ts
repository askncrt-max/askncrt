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
      achievements: {
        Row: {
          code: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          title_custom: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          title_custom?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          title_custom?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          exam_date: string
          id: string
          name: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          id?: string
          name: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          id?: string
          name?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["goal_kind"]
          period_start: string
          subject: string | null
          target_min: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["goal_kind"]
          period_start?: string
          subject?: string | null
          target_min?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["goal_kind"]
          period_start?: string
          subject?: string | null
          target_min?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json
          client_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json
          client_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          parts?: Json
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json
          client_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          user_id?: string
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
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planner_tasks: {
        Row: {
          created_at: string
          duration_min: number
          exam_id: string | null
          id: string
          is_revision: boolean
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          scheduled_for: string
          scheduled_time: string | null
          status: Database["public"]["Enums"]["task_status"]
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          exam_id?: string | null
          id?: string
          is_revision?: boolean
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          scheduled_for: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          exam_id?: string | null
          id?: string
          is_revision?: boolean
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          scheduled_for?: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_tasks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          board: string | null
          class_level: string | null
          created_at: string
          display_name: string | null
          goals: string | null
          id: string
          language: string
          learning_style: string | null
          subjects: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          created_at?: string
          display_name?: string | null
          goals?: string | null
          id: string
          language?: string
          learning_style?: string | null
          subjects?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          created_at?: string
          display_name?: string | null
          goals?: string | null
          id?: string
          language?: string
          learning_style?: string | null
          subjects?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          duration_sec: number | null
          id: string
          quiz_id: string
          score: number
          total: number
          user_id: string
          weak_topics: string[]
        }
        Insert: {
          answers?: Json
          completed_at?: string
          duration_sec?: number | null
          id?: string
          quiz_id: string
          score?: number
          total?: number
          user_id: string
          weak_topics?: string[]
        }
        Update: {
          answers?: Json
          completed_at?: string
          duration_sec?: number | null
          id?: string
          quiz_id?: string
          score?: number
          total?: number
          user_id?: string
          weak_topics?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          idx: number
          options: Json
          question: string
          quiz_id: string
          sub_topic: string | null
          user_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation?: string | null
          id?: string
          idx: number
          options: Json
          question: string
          quiz_id: string
          sub_topic?: string | null
          user_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          idx?: number
          options?: Json
          question?: string
          quiz_id?: string
          sub_topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          class_level: string | null
          created_at: string
          difficulty: string
          id: string
          question_count: number
          subject: string | null
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_level?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          question_count?: number
          subject?: string | null
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_level?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          question_count?: number
          subject?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_at: string
          id: string
          notify_at: string | null
          push_enabled: boolean
          reminder_type: string
          repeat: Database["public"]["Enums"]["reminder_repeat"]
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          notify_at?: string | null
          push_enabled?: boolean
          reminder_type?: string
          repeat?: Database["public"]["Enums"]["reminder_repeat"]
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          notify_at?: string | null
          push_enabled?: boolean
          reminder_type?: string
          repeat?: Database["public"]["Enums"]["reminder_repeat"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_min: number
          ended_at: string | null
          id: string
          kind: string
          started_at: string
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          ended_at?: string | null
          id?: string
          kind?: string
          started_at?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          ended_at?: string | null
          id?: string
          kind?: string
          started_at?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          category: Database["public"]["Enums"]["memory_category"]
          created_at: string
          id: string
          key: string
          source: Database["public"]["Enums"]["memory_source"]
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["memory_category"]
          created_at?: string
          id?: string
          key: string
          source?: Database["public"]["Enums"]["memory_source"]
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          category?: Database["public"]["Enums"]["memory_category"]
          created_at?: string
          id?: string
          key?: string
          source?: Database["public"]["Enums"]["memory_source"]
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_kind: "weekly" | "monthly"
      memory_category: "profile" | "preference" | "goal" | "fact"
      memory_source: "manual" | "inferred"
      reminder_repeat: "none" | "daily" | "weekly"
      task_priority: "low" | "med" | "high"
      task_status: "pending" | "done" | "missed"
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
      goal_kind: ["weekly", "monthly"],
      memory_category: ["profile", "preference", "goal", "fact"],
      memory_source: ["manual", "inferred"],
      reminder_repeat: ["none", "daily", "weekly"],
      task_priority: ["low", "med", "high"],
      task_status: ["pending", "done", "missed"],
    },
  },
} as const
