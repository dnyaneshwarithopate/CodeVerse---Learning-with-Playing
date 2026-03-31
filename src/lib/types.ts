

import type { Database } from './supabase/database.types';

export interface UserProfile {
  id: string; // Corresponds to Supabase auth.users.id
  email?: string;
  full_name: string;
  avatar_url?: string;
  learning_at: string;
  xp: number;
  streak: number;
  role: 'user' | 'admin';
}

export interface Tag {
  text: string;
  color: string;
}

// Re-exporting Supabase generated types for convenience
export type Course = Database['public']['Tables']['courses']['Row'] & {
    preview_video_url?: string | null;
    what_you_will_learn?: string[] | null;
    students_enrolled?: number | null;
    language?: string | null;
    notes_url?: string | null;
    total_duration_hours?: number | null;
    tags?: Tag[] | null;
    game_id?: string | null; // Added to link to a game
};
export type Chapter = Database['public']['Tables']['chapters']['Row'] & {
    image_url?: string | null;
};
export type Topic = Database['public']['Tables']['topics']['Row'] & {
    duration_minutes?: number | null;
};
export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type QuestionOption = Database['public']['Tables']['question_options']['Row'] & {
    explanation?: string | null;
};
export type UserEnrollment = Database['public']['Tables']['user_enrollments']['Row'] & {
  is_gifted?: boolean;
};
export type CourseReview = Database['public']['Tables']['course_reviews']['Row'] & {
    profiles: Pick<UserProfile, 'full_name' | 'avatar_url'> | null;
};
export type CourseGift = Database['public']['Tables']['course_gifts']['Row'];
export type Game = Database['public']['Tables']['games']['Row'] & {
    course_id?: string | null;
};
export type GameChapter = Database['public']['Tables']['game_chapters']['Row'] & {
    image_url?: string | null;
};
export type GameLevel = Database['public']['Tables']['game_levels']['Row'] & {
    intro_text?: string | null;
    correct_feedback?: string | null;
    incorrect_feedback?: string | null;
};
export type Chat = Database['public']['Tables']['chats']['Row'];
export type ChatMessage = Omit<Database['public']['Tables']['chat_messages']['Row'], 'content'> & {
    content: string;
};
export type UserTopicProgress = Database['public']['Tables']['user_topic_progress']['Row'];
export type UserQuizAttempt = Database['public']['Tables']['user_quiz_attempts']['Row'];
export type UserNote = Database['public']['Tables']['user_notes']['Row'];

// This was added for the wishlist feature
export type UserWishlist = Database['public']['Tables']['user_wishlist']['Row'] & {
  courses: Course;
};


// The type from the DB has a different column name
export type UserGameProgress = Database['public']['Tables']['user_game_progress']['Row'];

export type GameSettings = Database['public']['Tables']['game_settings']['Row'];
export type WebsiteSettings = Database['public']['Tables']['website_settings']['Row'];

export type ChatAnalysis = Database['public']['Tables']['chat_analysis']['Row'];


// Custom combined types for nested data fetching
export type QuestionWithOptions = Question & {
    question_options: QuestionOption[];
}
export type QuizWithQuestions = Quiz & {
    questions: QuestionWithOptions[];
}
export type TopicWithContent = Topic & {
    quizzes: QuizWithQuestions[] | null; // A topic can have one quiz, represented as an array of 1
    explanation?: string | null;
}
export type ChapterWithTopics = Chapter & {
  topics: TopicWithContent[];
};

export type CourseWithChaptersAndTopics = Course & {
  chapters: ChapterWithTopics[];
  related_courses?: Course[];
  games?: Game | null;
  course_reviews: { count: number }[];
  user_enrollments: { count: number }[];
  user_topic_progress?: UserTopicProgress[];
};

// This was the old flat structure, it has been replaced by GameWithChaptersAndLevels
export type GameWithLevels = Game & {
    game_levels: GameLevel[];
};

export type GameChapterWithLevels = GameChapter & {
    game_levels: GameLevel[];
};

export type GameWithChaptersAndLevels = Game & {
    game_chapters: GameChapterWithLevels[];
};


declare module 'next/navigation' {
    interface Params {
        gameSlug?: string;
        levelSlug?: string;
    }
}
