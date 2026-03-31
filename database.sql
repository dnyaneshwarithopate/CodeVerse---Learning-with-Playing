-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cart_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  order integer NOT NULL,
  course_id uuid NOT NULL,
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chapters_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.chat_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL UNIQUE,
  summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT chat_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT chat_analysis_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.coding_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL UNIQUE,
  question text NOT NULL,
  starter_code text,
  solution_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coding_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT coding_challenges_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.compare_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT compare_items_pkey PRIMARY KEY (id),
  CONSTRAINT compare_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT compare_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.course_gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  gifter_user_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_gifts_pkey PRIMARY KEY (id),
  CONSTRAINT course_gifts_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_gifts_gifter_user_id_fkey FOREIGN KEY (gifter_user_id) REFERENCES public.profiles(id),
  CONSTRAINT course_gifts_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.course_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  review_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT course_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT course_reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  is_paid boolean NOT NULL DEFAULT false,
  price numeric DEFAULT 0.00,
  rating numeric CHECK (rating >= 1.0 AND rating <= 5.0),
  total_duration_hours numeric,
  preview_video_url text,
  language text,
  notes_url text,
  what_you_will_learn ARRAY,
  students_enrolled integer DEFAULT 0,
  tags jsonb,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.game_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL,
  title text NOT NULL,
  order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  image_url text,
  CONSTRAINT game_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT game_chapters_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.game_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order integer NOT NULL,
  title text NOT NULL,
  objective text NOT NULL,
  starter_code text,
  expected_output text,
  ai_hint_prompt text,
  reward_xp integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now(),
  chapter_id uuid,
  slug text NOT NULL UNIQUE,
  intro_text text,
  correct_feedback text,
  incorrect_feedback text,
  CONSTRAINT game_levels_pkey PRIMARY KEY (id),
  CONSTRAINT game_levels_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.game_chapters(id)
);
CREATE TABLE public.game_settings (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  placeholder_image_url text,
  rocket_image_url text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  is_free boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  language text,
  slug text UNIQUE,
  course_id uuid,
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  learning_at text,
  xp integer DEFAULT 0,
  streak integer DEFAULT 0,
  role text DEFAULT 'user'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.question_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  explanation text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT question_options_pkey PRIMARY KEY (id),
  CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type character varying NOT NULL DEFAULT 'single'::character varying,
  order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.related_courses (
  course_id uuid NOT NULL,
  related_course_id uuid NOT NULL,
  CONSTRAINT related_courses_pkey PRIMARY KEY (course_id, related_course_id),
  CONSTRAINT related_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT related_courses_related_course_id_fkey FOREIGN KEY (related_course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.topics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL,
  video_url text,
  is_free boolean NOT NULL DEFAULT false,
  order integer NOT NULL,
  chapter_id uuid NOT NULL,
  content text,
  summary text,
  explanation text,
  duration_minutes integer,
  CONSTRAINT topics_pkey PRIMARY KEY (id),
  CONSTRAINT topics_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.user_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  progress jsonb,
  completed_at timestamp with time zone,
  is_gifted boolean DEFAULT false,
  CONSTRAINT user_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT user_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.user_game_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id uuid NOT NULL,
  completed_level_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_game_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_game_progress_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT user_game_progress_completed_level_id_fkey FOREIGN KEY (completed_level_id) REFERENCES public.game_levels(id),
  CONSTRAINT user_game_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  topic_id uuid NOT NULL,
  note_content text,
  CONSTRAINT user_notes_pkey PRIMARY KEY (id),
  CONSTRAINT user_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_notes_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.user_quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  CONSTRAINT user_quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT user_quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT user_quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.website_settings (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  chat_bot_avatar_url text,
  updated_at timestamp with time zone,
  CONSTRAINT website_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wishlist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_items_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlist_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);