

'use server';

import { createClient } from "@/lib/supabase/server";
import type { CourseWithChaptersAndTopics, Topic, UserEnrollment, QuizWithQuestions, GameWithChaptersAndLevels, GameLevel, UserGameProgress, GameSettings, GameChapter, WebsiteSettings, Chat, UserProfile, ChatMessage, UserNote } from "../types";

// This function can be used in Server Components or Server Actions.
// It should not be used in Client Components.
// For client-side data fetching, you should create a client-side function
// that uses the client Supabase instance.

export async function getUserProfile(): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) {
        console.error("Error fetching user profile:", error.message);
        return null;
    }
    return data;
}

export async function getCoursesWithChaptersAndTopics(): Promise<CourseWithChaptersAndTopics[] | null> {
    const supabase = createClient();
    const { data: courses, error } = await supabase
        .from('courses')
        .select(`
            *,
            course_reviews(count),
            user_enrollments(count),
            chapters (
                *,
                topics (
                    *,
                    quizzes (
                        *,
                        questions (
                            *,
                            question_options (*)
                        )
                    )
                )
            )
        `)
        .order('created_at', { ascending: true })
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
        .order('order', { foreignTable: 'chapters.topics.quizzes.questions', ascending: true });


    if (error) {
        console.error("Error fetching courses:", error.message);
        return null;
    }
    
    // The type from Supabase might be slightly different, so we cast it.
    // This is safe as long as the query matches the desired structure.
    return courses as unknown as CourseWithChaptersAndTopics[];
}

export async function getCourseBySlug(slug: string): Promise<CourseWithChaptersAndTopics | null> {
    const supabase = createClient();
    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            chapters (
                *,
                topics (
                    *,
                    quizzes (
                        *,
                        questions (
                            *,
                            question_options (*)
                        )
                    )
                )
            ),
            related_courses!course_id(
                course_id,
                related_course_id,
                courses!related_course_id (
                  id,
                  name,
                  slug,
                  image_url,
                  description
                )
            ),
            games(slug, title),
            course_reviews(count),
            user_enrollments(count)
        `)
        .eq('slug', slug)
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
        .order('order', { foreignTable: 'chapters.topics.quizzes.questions', ascending: true })
        .single();
    
    if (error) {
        // If the error is that no rows are found, that's fine, we'll return null.
        // But if it's another error (like the join on 'games' fails), we should log it.
        if (error.code !== 'PGRST116') {
             console.error("Error fetching course by slug:", error.message);
        }
        return null;
    }
    
    if (!course) {
        return null;
    }
    
    // Check if the query returned a single game object or an array
    const gameData = Array.isArray(course.games) ? course.games[0] : course.games;

    const transformedCourse = {
        ...course,
        related_courses: course.related_courses?.map((rc: any) => rc.courses) || [],
        games: gameData || null
    };

    return transformedCourse as unknown as CourseWithChaptersAndTopics;
}

export async function getCourseAndTopicDetails(courseSlug: string, topicSlug: string) {
    const supabase = createClient();

    // 1. Fetch the course with all its chapters and topics, making sure quizzes and questions are included.
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
            id,
            name,
            slug,
            language,
            chapters (
                id,
                title,
                order,
                topics (
                    *,
                    quizzes (
                        id,
                        questions (
                            id,
                            question_text,
                            question_type,
                            "order",
                            question_options (
                                id,
                                option_text,
                                is_correct,
                                explanation
                            )
                        )
                    )
                )
            )
        `)
        .eq('slug', courseSlug)
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
        .order('order', { foreignTable: 'chapters.topics.quizzes.questions', ascending: true })
        .single();

    if (courseError || !course) {
        console.error('Error fetching course details:', courseError?.message);
        return { course: null, chapter: null, topic: null, prevTopic: null, nextTopic: null };
    }

    const typedCourse = course as unknown as CourseWithChaptersAndTopics;

    // 2. Flatten topics and find the current one
    const allTopics = typedCourse.chapters.flatMap(ch => ch.topics.map(t => ({...t, chapterId: ch.id})));
    const currentTopicIndex = allTopics.findIndex(t => t.slug === topicSlug);

    if (currentTopicIndex === -1) {
        return { course: typedCourse, chapter: null, topic: null, prevTopic: null, nextTopic: null };
    }

    const currentTopic = allTopics[currentTopicIndex];
    
    // 3. Find the chapter for the current topic
    const currentChapter = typedCourse.chapters.find(ch => ch.id === currentTopic.chapterId);

    // 4. Determine previous and next topics
    const prevTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
    const nextTopic = currentTopicIndex < allTopics.length - 1 ? allTopics[currentTopicIndex + 1] : null;
    
    return {
        course: typedCourse,
        chapter: currentChapter || null,
        topic: currentTopic as Topic & { quizzes: QuizWithQuestions[] },
        prevTopic: prevTopic as Topic | null,
        nextTopic: nextTopic as Topic | null,
    };
}


export async function getUserEnrollments(userId: string): Promise<{ enrolledCourses: CourseWithChaptersAndTopics[], enrollments: UserEnrollment[] } | null> {
    const supabase = createClient();
    const { data: enrollments, error } = await supabase
        .from('user_enrollments')
        .select(`
            *,
            courses (
                *,
                chapters (
                    *,
                    topics (*)
                )
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching user enrollments:", error.message);
        return null;
    }

    const enrolledCourses = enrollments.map(e => e.courses) as unknown as CourseWithChaptersAndTopics[];

    return { enrolledCourses, enrollments: enrollments as UserEnrollment[] };
}


export async function getAllCoursesMinimal() {
    const supabase = createClient();
    const { data, error } = await supabase.from('courses').select('id, name');
    if (error) {
        console.error("Error fetching minimal courses:", error);
        return [];
    }
    return data;
}

export async function getRelatedCourseIds(courseId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from('related_courses').select('related_course_id').eq('course_id', courseId);
    if(error) {
        console.error("Error fetching related course ids", error);
        return [];
    }
    return data.map(r => r.related_course_id);
}

export async function getIsUserEnrolled(courseId: string, userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error checking enrollment:", error);
        return false;
    }

    return !!data;
}

export async function getAllGames(): Promise<GameWithChaptersAndLevels[] | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('games')
        .select(`
            *,
            game_chapters (
                *,
                game_levels (
                    *
                )
            )
        `)
        .order('created_at', { ascending: true })
        .order('order', { foreignTable: 'game_chapters', ascending: true })
        .order('order', { foreignTable: 'game_chapters.game_levels', ascending: true });


    if (error) {
        console.error("Error fetching games:", error.message);
        return null;
    }

    return data as GameWithChaptersAndLevels[];
}


export async function getGameBySlug(slug: string): Promise<GameWithChaptersAndLevels | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('games')
        .select(`
            *,
            game_chapters (
                *,
                game_levels (
                    *
                )
            )
        `)
        .eq('slug', slug)
        .order('order', { foreignTable: 'game_chapters', ascending: true })
        .order('order', { foreignTable: 'game_chapters.game_levels', ascending: true })
        .maybeSingle();
    
    if (error) {
        console.error("Error fetching game by slug:", error.message);
        return null;
    }

    return data as GameWithChaptersAndLevels;
}

export async function getGameAndLevelDetails(gameSlug: string, levelSlug: string) {
    const supabase = createClient();
    
    const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
            *,
            game_chapters (
                *,
                game_levels (
                    *
                )
            )
        `)
        .eq('slug', gameSlug)
        .order('order', { foreignTable: 'game_chapters', ascending: true })
        .order('order', { foreignTable: 'game_chapters.game_levels', ascending: true })
        .single();
    
    if(gameError || !gameData) {
        console.error("Error fetching game details:", gameError?.message);
        return { game: null, level: null, chapter: null, prevLevel: null, nextLevel: null };
    }
    
    const game = gameData as GameWithChaptersAndLevels;
    const allLevels = game.game_chapters.flatMap(c => c.game_levels);
    
    const currentLevelIndex = allLevels.findIndex(l => l.slug === levelSlug);

    if (currentLevelIndex === -1) {
        console.error(`Level with slug "${levelSlug}" not found in game "${gameSlug}"`);
        return { game: game, level: null, chapter: null, prevLevel: null, nextLevel: null };
    }

    const currentLevel = allLevels[currentLevelIndex];
    const currentChapter = game.game_chapters.find(c => c.id === currentLevel.chapter_id);
    const prevLevel = currentLevelIndex > 0 ? allLevels[currentLevelIndex - 1] : null;
    const nextLevel = currentLevelIndex < allLevels.length - 1 ? allLevels[currentLevelIndex + 1] : null;

    return { game, level: currentLevel, chapter: currentChapter || null, prevLevel, nextLevel };
}


export async function getUserGameProgress(gameId: string): Promise<UserGameProgress[] | null> {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return []; // Return empty array if no user
        }

        const { data, error } = await supabase
            .from('user_game_progress')
            .select('completed_level_id')
            .eq('user_id', user.id)
            .eq('game_id', gameId);

        if (error) {
            // Log a more informative error, but don't crash the server.
            console.error("Error fetching user game progress:", error.message || "Unknown error");
            return null;
        }

        return data as UserGameProgress[];
    } catch (e: any) {
        console.error("Caught an exception in getUserGameProgress:", e.message);
        return null;
    }
}

export async function getGameSettings(): Promise<GameSettings | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching game settings:", error.message);
        return null;
    }
    return data;
}

export async function getWebsiteSettings(): Promise<WebsiteSettings | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching website settings:", error.message);
        return null;
    }
    return data;
}

export async function getUserChats(): Promise<Chat[] | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching user chats:", error.message);
        return null;
    }
    return data;
}

export async function getChat(chatId: string): Promise<{ chat: Chat | null, messages: ChatMessage[] | null }> {
    const supabase = createClient();
     const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { chat: null, messages: null };

    const { data: chat, error: chatError } = await supabase.from('chats').select('*').eq('id', chatId).eq('user_id', user.id).single();
    if (chatError) {
        console.error("Error fetching chat:", chatError);
        return { chat: null, messages: null };
    }

    const { data: messages, error: messagesError } = await supabase.from('chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
     if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return { chat, messages: null };
    }

    return { chat, messages };
}

export async function getUserNoteForTopic(topicId: string): Promise<UserNote | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user note:", error.message);
    }

    return data;
}

export async function getInProgressGames(userId: string): Promise<GameWithChaptersAndLevels[]> {
    const supabase = createClient();
    
    // Get unique game_ids the user has made progress in, ordered by most recent
    const { data: progressData, error: progressError } = await supabase
        .from('user_game_progress')
        .select('game_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (progressError) {
        console.error("Error fetching in-progress games:", progressError.message);
        return [];
    }

    if (!progressData || progressData.length === 0) {
        return [];
    }

    // Get unique game IDs, maintaining the order of most recently played
    const uniqueGameIds = [...new Map(progressData.map(item => [item.game_id, item])).values()].map(item => item.game_id);

    // Fetch the full details for those games
    const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
            *,
            game_chapters (
                *,
                game_levels (
                    *
                )
            )
        `)
        .in('id', uniqueGameIds)
        .order('order', { foreignTable: 'game_chapters', ascending: true })
        .order('order', { foreignTable: 'game_chapters.game_levels', ascending: true });

    if (gamesError) {
        console.error("Error fetching game details for in-progress games:", gamesError.message);
        return [];
    }

    // Sort the final gamesData array based on the order from uniqueGameIds
    const sortedGames = uniqueGameIds.map(id => gamesData.find(game => game.id === id)).filter(Boolean) as GameWithChaptersAndLevels[];

    return sortedGames;
}


// Admin-specific queries
export async function getUsersWithChatCount(): Promise<(UserProfile & { chat_count: number })[] | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            chats (
                id
            )
        `);

    if (error) {
        console.error("Error fetching users with chat count:", error);
        return null;
    }

    return data.map(profile => ({
        ...profile,
        chat_count: profile.chats.length
    }));
}


export async function getChatsForUser(userId: string): Promise<{ user: UserProfile | null, chats: Chat[] | null }> {
    const supabase = createClient();
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (userError) {
        console.error("Error fetching user for admin:", userError);
        return { user: null, chats: null };
    }

    const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
     if (chatsError) {
        console.error("Error fetching chats for user:", chatsError);
        return { user, chats: null };
    }
    
    return { user, chats };
}


export async function getChatForAdmin(chatId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('chats')
        .select(`
            *,
            profiles (id, full_name, avatar_url, email),
            chat_messages (*)
        `)
        .eq('id', chatId)
        .order('created_at', { foreignTable: 'chat_messages', ascending: true })
        .single();

    if (error) {
        console.error("Error fetching chat for admin:", error);
        return { chat: null };
    }

    return { chat: data };
}

    