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
      ad_settings: {
        Row: {
          clicks: number
          created_at: string
          enabled: boolean
          frequency: number
          id: string
          impressions: number
          placement: string
          revenue_inr: number
          show_to_free: boolean
          show_to_premium: boolean
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          enabled?: boolean
          frequency?: number
          id?: string
          impressions?: number
          placement: string
          revenue_inr?: number
          show_to_free?: boolean
          show_to_premium?: boolean
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          enabled?: boolean
          frequency?: number
          id?: string
          impressions?: number
          placement?: string
          revenue_inr?: number
          show_to_free?: boolean
          show_to_premium?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      admin_questions: {
        Row: {
          answer: string | null
          ask_count: number
          chapter: string | null
          class_level: number | null
          created_at: string
          difficulty: string
          id: string
          question: string
          report_reason: string | null
          reported: boolean
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          answer?: string | null
          ask_count?: number
          chapter?: string | null
          class_level?: number | null
          created_at?: string
          difficulty?: string
          id?: string
          question: string
          report_reason?: string | null
          reported?: boolean
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string | null
          ask_count?: number
          chapter?: string | null
          class_level?: number | null
          created_at?: string
          difficulty?: string
          id?: string
          question?: string
          report_reason?: string | null
          reported?: boolean
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          created_at: string
          daily_request_limit: number | null
          enabled: boolean
          id: string
          max_retries: number
          model: string
          name: string
          priority: number
          timeout_ms: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_request_limit?: number | null
          enabled?: boolean
          id?: string
          max_retries?: number
          model: string
          name: string
          priority?: number
          timeout_ms?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_request_limit?: number | null
          enabled?: boolean
          id?: string
          max_retries?: number
          model?: string
          name?: string
          priority?: number
          timeout_ms?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input_tokens: number
          kind: string
          model: string
          output_tokens: number
          provider: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input_tokens?: number
          kind?: string
          model: string
          output_tokens?: number
          provider?: string
          success?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input_tokens?: number
          kind?: string
          model?: string
          output_tokens?: number
          provider?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          previous_value: Json | null
          result: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          result?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          result?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          name: string
          published: boolean
          sort_order: number
          subject_id: string
          topics: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          published?: boolean
          sort_order?: number
          subject_id: string
          topics?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          published?: boolean
          sort_order?: number
          subject_id?: string
          topics?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          level: number
          name: string
          published: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          name: string
          published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          name?: string
          published?: boolean
          sort_order?: number
          updated_at?: string
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
      emergency_settings: {
        Row: {
          ai_disabled: boolean
          id: boolean
          maintenance_mode: boolean
          message: string
          ocr_disabled: boolean
          registrations_disabled: boolean
          updated_at: string
          uploads_disabled: boolean
        }
        Insert: {
          ai_disabled?: boolean
          id?: boolean
          maintenance_mode?: boolean
          message?: string
          ocr_disabled?: boolean
          registrations_disabled?: boolean
          updated_at?: string
          uploads_disabled?: boolean
        }
        Update: {
          ai_disabled?: boolean
          id?: boolean
          maintenance_mode?: boolean
          message?: string
          ocr_disabled?: boolean
          registrations_disabled?: boolean
          updated_at?: string
          uploads_disabled?: boolean
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
      feature_flags: {
        Row: {
          created_at: string
          daily_limit: number | null
          description: string | null
          enabled: boolean
          id: string
          key: string
          label: string
          maintenance: boolean
          min_plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          label: string
          maintenance?: boolean
          min_plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          label?: string
          maintenance?: boolean
          min_plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          count: number
          created_at: string
          feature_key: string
          id: string
          user_id: string | null
        }
        Insert: {
          count?: number
          created_at?: string
          feature_key: string
          id?: string
          user_id?: string | null
        }
        Update: {
          count?: number
          created_at?: string
          feature_key?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          category: string
          created_at: string
          id: string
          mime_type: string | null
          name: string
          size_kb: number
          url: string | null
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          size_kb?: number
          url?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_kb?: number
          url?: string | null
          user_id?: string | null
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
      notifications: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          kind: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_user_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ocr_requests: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          file_name: string | null
          file_size_kb: number | null
          id: string
          mime_type: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          id?: string
          mime_type?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          id?: string
          mime_type?: string | null
          success?: boolean
          user_id?: string | null
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
      plans: {
        Row: {
          active: boolean
          ads_enabled: boolean
          ai_daily_limit: number
          code: string
          created_at: string
          features: Json
          id: string
          name: string
          ocr_daily_limit: number
          price_inr: number
          quiz_daily_limit: number
          sort_order: number
          storage_mb_limit: number
          updated_at: string
          upload_mb_limit: number
        }
        Insert: {
          active?: boolean
          ads_enabled?: boolean
          ai_daily_limit?: number
          code: string
          created_at?: string
          features?: Json
          id?: string
          name: string
          ocr_daily_limit?: number
          price_inr?: number
          quiz_daily_limit?: number
          sort_order?: number
          storage_mb_limit?: number
          updated_at?: string
          upload_mb_limit?: number
        }
        Update: {
          active?: boolean
          ads_enabled?: boolean
          ai_daily_limit?: number
          code?: string
          created_at?: string
          features?: Json
          id?: string
          name?: string
          ocr_daily_limit?: number
          price_inr?: number
          quiz_daily_limit?: number
          sort_order?: number
          storage_mb_limit?: number
          updated_at?: string
          upload_mb_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          board: string | null
          class_level: string | null
          created_at: string
          display_name: string | null
          email: string | null
          goals: string | null
          id: string
          language: string
          last_active_at: string | null
          learning_style: string | null
          plan: string
          status: string
          subjects: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          goals?: string | null
          id: string
          language?: string
          last_active_at?: string | null
          learning_style?: string | null
          plan?: string
          status?: string
          subjects?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          goals?: string | null
          id?: string
          language?: string
          last_active_at?: string | null
          learning_style?: string | null
          plan?: string
          status?: string
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
      security_events: {
        Row: {
          created_at: string
          detail: string | null
          email: string | null
          event_type: string
          id: string
          ip: string | null
          reviewed: boolean
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          email?: string | null
          event_type: string
          id?: string
          ip?: string | null
          reviewed?: boolean
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          email?: string | null
          event_type?: string
          id?: string
          ip?: string | null
          reviewed?: boolean
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      study_material: {
        Row: {
          body: string
          chapter: string | null
          class_level: number | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          language: string
          published: boolean
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          chapter?: string | null
          class_level?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          language?: string
          published?: boolean
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          chapter?: string | null
          class_level?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          language?: string
          published?: boolean
          subject?: string | null
          title?: string
          updated_at?: string
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
      subjects: {
        Row: {
          board: string
          class_id: string
          created_at: string
          id: string
          language: string
          name: string
          published: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          board?: string
          class_id: string
          created_at?: string
          id?: string
          language?: string
          name: string
          published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          board?: string
          class_id?: string
          created_at?: string
          id?: string
          language?: string
          name?: string
          published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_code: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_code?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_code?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
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
          role: Database["public"]["Enums"]["app_role"]
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin"
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
    Enums: {
      app_role: ["super_admin"],
      goal_kind: ["weekly", "monthly"],
      memory_category: ["profile", "preference", "goal", "fact"],
      memory_source: ["manual", "inferred"],
      reminder_repeat: ["none", "daily", "weekly"],
      task_priority: ["low", "med", "high"],
      task_status: ["pending", "done", "missed"],
    },
  },
} as const
