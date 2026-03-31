
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
      chapters: {
        Row: {
          course_id: string
          created_at: string
          id: string
          image_url: string | null
          order: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          order: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_analysis: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_analysis_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: true
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: Json
          created_at: string
          id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: Json
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          chat_id?: string
          content?: Json
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_gifts: {
        Row: {
          course_id: string
          created_at: string
          gifter_user_id: string
          id: string
          recipient_user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          gifter_user_id: string
          id?: string
          recipient_user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          gifter_user_id?: string
          id?: string
          recipient_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_gifts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_gifts_gifter_user_id_fkey"
            columns: ["gifter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_gifts_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number | null
          review_text: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating?: number | null
          review_text?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number | null
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_paid: boolean
          language: string | null
          name: string
          notes_url: string | null
          preview_video_url: string | null
          price: number | null
          rating: number | null
          slug: string
          students_enrolled: number | null
          tags: Json | null
          total_duration_hours: number | null
          what_you_will_learn: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean
          language?: string | null
          name: string
          notes_url?: string | null
          preview_video_url?: string | null
          price?: number | null
          rating?: number | null
          slug: string
          students_enrolled?: number | null
          tags?: Json | null
          total_duration_hours?: number | null
          what_you_will_learn?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean
          language?: string | null
          name?: string
          notes_url?: string | null
          preview_video_url?: string | null
          price?: number | null
          rating?: number | null
          slug?: string
          students_enrolled?: number | null
          tags?: Json | null
          total_duration_hours?: number | null
          what_you_will_learn?: string[] | null
        }
        Relationships: []
      }
      game_chapters: {
        Row: {
          created_at: string
          game_id: string
          id: string
          image_url: string | null
          order: number
          title: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          image_url?: string | null
          order: number
          title: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          image_url?: string | null
          order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_chapters_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_levels: {
        Row: {
          chapter_id: string
          correct_feedback: string | null
          created_at: string
          expected_output: string | null
          id: string
          incorrect_feedback: string | null
          intro_text: string | null
          objective: string
          order: number
          reward_xp: number
          slug: string
          starter_code: string | null
          title: string
        }
        Insert: {
          chapter_id: string
          correct_feedback?: string | null
          created_at?: string
          expected_output?: string | null
          id?: string
          incorrect_feedback?: string | null
          intro_text?: string | null
          objective: string
          order: number
          reward_xp: number
          slug: string
          starter_code?: string | null
          title: string
        }
        Update: {
          chapter_id?: string
          correct_feedback?: string | null
          created_at?: string
          expected_output?: string | null
          id?: string
          incorrect_feedback?: string | null
          intro_text?: string | null
          objective?: string
          order?: number
          reward_xp?: number
          slug?: string
          starter_code?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_levels_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "game_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      game_settings: {
        Row: {
          id: number
          placeholder_image_url: string | null
          rocket_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          placeholder_image_url?: string | null
          rocket_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          placeholder_image_url?: string | null
          rocket_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      games: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          is_free: boolean
          language: string | null
          slug: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          language?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          language?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string
          id: string
          last_played_at: string | null
          learning_at: string
          role: string
          streak: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name: string
          id: string
          last_played_at?: string | null
          learning_at: string
          role?: string
          streak?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_played_at?: string | null
          learning_at?: string
          role?: string
          streak?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          is_correct: boolean
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          id: string
          order: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: true
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      related_courses: {
        Row: {
          course_id: string
          created_at: string
          related_course_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          related_course_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          related_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_courses_related_course_id_fkey"
            columns: ["related_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          chapter_id: string
          content: string | null
          created_at: string
          duration_minutes: number | null
          explanation: string | null
          id: string
          is_free: boolean
          order: number
          slug: string
          summary: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          chapter_id: string
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          explanation?: string | null
          id?: string
          is_free?: boolean
          order: number
          slug: string
          summary?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          chapter_id?: string
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          explanation?: string | null
          id?: string
          is_free?: boolean
          order?: number
          slug?: string
          summary?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_gifted: boolean
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_gifted?: boolean
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_gifted?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_progress: {
        Row: {
          completed_at: string
          completed_level_id: string
          game_id: string
          id: number
          is_perfect: boolean
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_level_id: string
          game_id: string
          id?: number
          is_perfect?: boolean
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_level_id?: string
          game_id?: string
          id?: number
          is_perfect?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_game_progress_completed_level_id_fkey"
            columns: ["completed_level_id"]
            isOneToOne: false
            referencedRelation: "game_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_progress_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          created_at: string
          id: string
          note_content: string | null
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_content?: string | null
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_content?: string | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          id?: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: number
          topic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: number
          topic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: number
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_topic_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wishlist: {
        Row: {
          course_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wishlist_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      website_settings: {
        Row: {
          chat_bot_avatar_url: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          chat_bot_avatar_url?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          chat_bot_avatar_url?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: {
        Args: {
          user_id_in: string
          xp_to_add: number
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type Composites<
  PublicCompositeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeName extends PublicCompositeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeNameOrOptions["schema"]]["CompositeTypes"][CompositeName]
  : PublicCompositeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][CompositeName]
    : never
    

    
    

