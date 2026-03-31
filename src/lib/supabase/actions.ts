

'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';
import type { QuizWithQuestions, QuestionWithOptions, QuestionOption, Topic, Chapter, Course, Game, GameLevel, GameChapter, Chat, ChatMessage, UserProfile, UserNote } from '@/lib/types';
import placeholderGames from '@/lib/placeholder-games.json';
import { redirect } from 'next/navigation';
import { analyzeChatConversation } from '@/ai/flows/analyze-chat-conversation';

interface TopicData extends Omit<Topic, 'id' | 'created_at' | 'chapter_id' | 'order' | 'explanation'> {
    id?: string; // id is present when updating
    order: number;
    explanation?: string | null;
    quizzes?: QuizState[];
}

interface ChapterData extends Omit<Chapter, 'id' | 'created_at' | 'course_id' | 'order'> {
    id?: string; // id is present when updating
    order: number;
    topics: TopicData[];
    image_url?: string | null;
    image_file?: File | null;
}

interface CourseData extends Omit<Course, 'id' | 'created_at' > {
    chapters: ChapterData[];
    related_courses?: string[];
}

// Represents the state of a quiz from the client-side editor
interface QuizState extends Partial<QuizWithQuestions> {
    id: string;
    questions: QuestionState[];
}

// Represents the state of a question from the client-side editor
interface QuestionState extends Partial<QuestionWithOptions> {
    id: string;
    question_text: string;
    question_type: 'single' | 'multiple';
    order: number;
    question_options: OptionState[];
}

// Represents the state of an option from the client-side editor
interface OptionState extends Partial<QuestionOption> {
    id: string;
    option_text: string;
    is_correct: boolean;
    explanation?: string | null;
}


export async function createCourse(courseData: CourseData) {
    const supabase = createClient();
    
    const { chapters, related_courses, ...restOfCourseData } = courseData;

    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            name: restOfCourseData.name,
            slug: restOfCourseData.slug,
            description: restOfCourseData.description,
            image_url: restOfCourseData.image_url,
            is_paid: restOfCourseData.is_paid,
            price: restOfCourseData.price,
            rating: restOfCourseData.rating,
            what_you_will_learn: restOfCourseData.what_you_will_learn,
            preview_video_url: restOfCourseData.preview_video_url,
            language: restOfCourseData.language,
            notes_url: restOfCourseData.notes_url,
            total_duration_hours: restOfCourseData.total_duration_hours,
            tags: restOfCourseData.tags,
        })
        .select()
        .single();

    if (courseError) {
        console.error('Error creating course:', courseError);
        return { success: false, error: courseError.message };
    }

    if (related_courses && related_courses.length > 0) {
        const relationsToInsert = related_courses.map(relatedId => ({
            course_id: course.id,
            related_course_id: relatedId
        }));
        await supabase.from('related_courses').insert(relationsToInsert);
    }

    for (const [chapterIndex, chapterData] of chapters.entries()) {
        const { topics, ...restOfChapterData } = chapterData;
        const { data: chapter, error: chapterError } = await supabase
            .from('chapters')
            .insert({
                ...restOfChapterData,
                course_id: course.id,
                order: chapterIndex + 1,
            })
            .select()
            .single();

        if (chapterError) {
            console.error('Error creating chapter:', chapterError);
            continue;
        }

        for (const [topicIndex, topicData] of topics.entries()) {
            const { quizzes, ...restOfTopicData } = topicData;
            const { data: topic, error: topicError } = await supabase
                .from('topics')
                .insert({
                    ...restOfTopicData,
                    chapter_id: chapter.id,
                    order: topicIndex + 1,
                })
                .select()
                .single();

            if (topicError) {
                console.error('Error creating topic:', topicError.message);
                continue;
            }

            if (quizzes && quizzes.length > 0) {
                try {
                    await upsertQuiz(quizzes[0], topic.id);
                } catch (error: any) {
                    return { success: false, error: error.message };
                }
            }
        }
    }

    revalidatePath('/');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseData.slug}`);
    revalidatePath('/admin/courses');

    return { success: true, courseId: course.id };
}

async function upsertQuiz(quizData: QuizState, topicId: string) {
    const supabase = createClient();
    
    const isNewQuiz = quizData.id?.startsWith('quiz-');
    let quizIdForUpsert = isNewQuiz ? undefined : (quizData.id || (await supabase.from('quizzes').select('id').eq('topic_id', topicId).single()).data?.id);

    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .upsert({ id: quizIdForUpsert, topic_id: topicId })
        .select()
        .single();
    
    if (quizError) throw new Error(`Quiz upsert failed: ${quizError.message}`);
    const finalQuizId = quiz.id;

    const { data: existingQuestions } = await supabase.from('questions').select('id').eq('quiz_id', finalQuizId);
    const incomingQuestionIds = quizData.questions.map(q => q.id).filter(id => id && !id.startsWith('q-'));
    const questionsToDelete = existingQuestions?.filter(q => !incomingQuestionIds.includes(q.id)).map(q => q.id) || [];
    
    if (questionsToDelete.length > 0) {
        await supabase.from('questions').delete().in('id', questionsToDelete);
    }

    for (const questionData of quizData.questions) {
        const isNewQuestion = questionData.id?.startsWith('q-');
        const questionPayload: any = {
            quiz_id: finalQuizId,
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            order: questionData.order,
        };
        if (!isNewQuestion) {
            questionPayload.id = questionData.id;
        }

        const { data: question, error: questionError } = await supabase.from('questions').upsert(questionPayload).select().single();
        if (questionError) throw new Error(`Question upsert failed: ${questionError.message}`);
        const finalQuestionId = question.id;

        const { data: existingOptions } = await supabase.from('question_options').select('id').eq('question_id', finalQuestionId);
        const incomingOptionIds = questionData.question_options.map(o => o.id).filter(id => id && !id.startsWith('opt-'));
        const optionsToDelete = existingOptions?.filter(o => !incomingOptionIds.includes(o.id)).map(o => o.id) || [];
        
        if (optionsToDelete.length > 0) {
            await supabase.from('question_options').delete().in('id', optionsToDelete);
        }

        const optionsToUpsert = questionData.question_options.map(opt => {
            const optionPayload: any = {
                question_id: finalQuestionId,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                explanation: opt.explanation,
            };

            // Only include the ID if it's a real, existing UUID, not a temporary one.
            if (typeof opt.id === 'string' && !opt.id.startsWith('opt-')) {
                optionPayload.id = opt.id;
            }
            
            return optionPayload;
        });

        if (optionsToUpsert.length > 0) {
            const { error: optionsError } = await supabase.from('question_options').upsert(optionsToUpsert);
            if (optionsError) throw new Error(`Options upsert failed: ${optionsError.message}`);
        }
    }
}


export async function updateCourse(courseId: string, courseData: CourseData) {
    const supabase = createClient();
    
    const { chapters, related_courses, ...restOfCourseData } = courseData;

    // Handle course image upload
    let imageUrl = restOfCourseData.image_url;
    // Assuming image is a base64 string if it's a new upload.
    if (imageUrl && imageUrl.startsWith('data:image')) {
        const fileExt = imageUrl.substring(imageUrl.indexOf('/') + 1, imageUrl.indexOf(';'));
        const filePath = `${courseId}/thumbnail.${fileExt}`;
        const buffer = Buffer.from(imageUrl.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        
        const { error: uploadError } = await supabase.storage
            .from('course_materials')
            .upload(filePath, buffer, { 
                contentType: `image/${fileExt}`, 
                upsert: true 
            });

        if (uploadError) {
            return { success: false, error: `Image upload failed: ${uploadError.message}` };
        }
        
        const { data: { publicUrl } } = supabase.storage.from('course_materials').getPublicUrl(filePath);
        imageUrl = publicUrl;
    }


    const { error: courseError } = await supabase
        .from('courses')
        .update({
            name: restOfCourseData.name,
            slug: restOfCourseData.slug,
            description: restOfCourseData.description,
            image_url: imageUrl,
            is_paid: restOfCourseData.is_paid,
            price: restOfCourseData.price,
            what_you_will_learn: restOfCourseData.what_you_will_learn,
            preview_video_url: restOfCourseData.preview_video_url,
            language: restOfCourseData.language,
            notes_url: restOfCourseData.notes_url,
            total_duration_hours: restOfCourseData.total_duration_hours,
            tags: restOfCourseData.tags,
        })
        .eq('id', courseId);

    if (courseError) {
        console.error('Error updating course:', courseError);
        return { success: false, error: courseError.message };
    }

    // Handle related courses
    await supabase.from('related_courses').delete().eq('course_id', courseId);
    if (related_courses && related_courses.length > 0) {
        const relationsToInsert = related_courses.map(relatedId => ({
            course_id: courseId,
            related_course_id: relatedId
        }));
        await supabase.from('related_courses').insert(relationsToInsert);
    }


    const { data: existingCourse } = await supabase
        .from('courses')
        .select('id, chapters(id, topics(id))')
        .eq('id', courseId)
        .single();
    
    if(!existingCourse) return { success: false, error: 'Course not found' };

    const existingChapterIds = existingCourse.chapters.map(c => c.id);
    const existingTopicIds = existingCourse.chapters.flatMap(c => c.topics.map(t => t.id));
    
    const incomingChapterIds = courseData.chapters.map(c => c.id).filter(id => id && !id.startsWith('ch-'));
    const incomingTopicIds = courseData.chapters.flatMap(c => c.topics).map(t => t.id).filter(id => id && !id.startsWith('t-'));

    const chaptersToDelete = existingChapterIds.filter(id => !incomingChapterIds.includes(id));
    if (chaptersToDelete.length > 0) {
        await supabase.from('chapters').delete().in('id', chaptersToDelete);
    }
    
    const topicsToDelete = existingTopicIds.filter(id => !incomingTopicIds.includes(id));
    if (topicsToDelete.length > 0) {
        await supabase.from('topics').delete().in('id', topicsToDelete);
    }

    for (const chapterData of courseData.chapters) {
        let chapterImageUrl = chapterData.image_url;
        if (chapterData.image_file) {
             const filePath = `${courseId}/chapters/${crypto.randomUUID()}-${chapterData.image_file.name}`;
             const { error: uploadError } = await supabase.storage
                .from('chapter_images')
                .upload(filePath, chapterData.image_file, { upsert: true });
            
            if (uploadError) return { success: false, error: `Chapter image upload failed: ${uploadError.message}` };
            
            chapterImageUrl = supabase.storage.from('chapter_images').getPublicUrl(filePath).data.publicUrl;
        }

        const isNewChapter = chapterData.id?.startsWith('ch-');
        const chapterToUpsert: any = {
            title: chapterData.title,
            order: chapterData.order,
            course_id: courseId,
            image_url: chapterImageUrl,
        };
        if(!isNewChapter) {
            chapterToUpsert.id = chapterData.id;
        }

        const { data: upsertedChapter, error: chapterUpsertError } = await supabase
            .from('chapters')
            .upsert(chapterToUpsert)
            .select()
            .single();
    
        if (chapterUpsertError) return { success: false, error: `Chapter upsert failed: ${chapterUpsertError.message}` };
        
        for (const topicData of chapterData.topics) {
            const { quizzes, ...topicDetails } = topicData;
            const isNewTopic = topicDetails.id?.startsWith('t-');
            const topicToUpsert: any = {
                ...topicDetails,
                chapter_id: upsertedChapter.id,
            };
            delete topicToUpsert.uploadProgress; // Don't save uploadProgress to DB

            if(isNewTopic) {
                delete topicToUpsert.id;
            }
            
            const { data: upsertedTopic, error: topicUpsertError } = await supabase
                .from('topics')
                .upsert(topicToUpsert)
                .select().single();
            
            if (topicUpsertError) return { success: false, error: `Topic upsert failed: ${topicUpsertError.message}` };

            if (quizzes && quizzes.length > 0) {
                try {
                     await upsertQuiz(quizzes[0], upsertedTopic.id);
                } catch(error: any) {
                     return { success: false, error: error.message };
                }
            } else {
                 const { data: existingQuiz } = await supabase.from('quizzes').select('id').eq('topic_id', upsertedTopic.id).single();
                 if (existingQuiz) {
                     await supabase.from('quizzes').delete().eq('id', existingQuiz.id);
                 }
            }
        }
    }

    revalidatePath('/');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseData.slug}`);
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/edit/${courseId}`);
    
    return { success: true };
}


export async function deleteCourse(courseId: string) {
    const supabase = createClient();

    const { error } = await supabase.from('courses').delete().eq('id', courseId);

    if (error) {
        console.error('Error deleting course:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath('/courses');

    return { success: true };
}

export async function createQuizForTopic(topicId: string, quizData: QuizWithQuestions) {
  const supabase = createClient();

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({ topic_id: topicId })
    .select()
    .single();

  if (quizError) {
    console.error('Error creating quiz:', quizError);
    if (quizError.code === '23505') { 
        return { success: false, error: 'A quiz already exists for this topic.'};
    }
    return { success: false, error: 'Failed to create quiz entry.' };
  }

  const questionsToInsert = quizData.questions.map((q, index) => ({
    quiz_id: quiz.id,
    question_text: q.question_text,
    question_type: q.question_type || 'single',
    order: index + 1,
  }));
  
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)
    .select();

  if (questionsError) {
    console.error('Error creating questions:', questionsError);
    await supabase.from('quizzes').delete().eq('id', quiz.id);
    return { success: false, error: 'Failed to save quiz questions.' };
  }

  const optionsToInsert = [];
  for (let i = 0; i < quizData.questions.length; i++) {
    const originalQuestion = quizData.questions[i];
    const savedQuestion = questions.find(q => q.order === i + 1);

    if (savedQuestion) {
      for (const option of originalQuestion.question_options) {
        optionsToInsert.push({
          question_id: savedQuestion.id,
          option_text: option.option_text,
          is_correct: option.is_correct,
          explanation: option.explanation,
        });
      }
    }
  }

  if (optionsToInsert.length > 0) {
    const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert as any);

    if (optionsError) {
        console.error('Error creating options:', optionsError);
        return { success: false, error: 'Failed to save quiz options.' };
    }
  }

  return { success: true, quizId: quiz.id };
}

export async function enrollInCourse(courseId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be logged in to enroll." };
    }

    const { error } = await supabase.from('user_enrollments').insert({
        user_id: user.id,
        course_id: courseId,
    });

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            return { success: true, message: "Already enrolled." };
        }
        console.error("Error enrolling user in course:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseId}`); // Revalidate specific course page

    return { success: true };
}


export async function giftCourseToUser(courseId: string, recipientEmail: string) {
    const supabase = createClient();
    const { data: { user: gifterUser } } = await supabase.auth.getUser();

    if (!gifterUser) {
        return { success: false, error: "You must be logged in to gift a course." };
    }

    // Find the recipient user by email
    const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();
    
    if (profileError || !recipientProfile) {
        return { success: false, error: `Could not find a user with the email: ${recipientEmail}. Please make sure they have a CodeVerse account.` };
    }

    const recipientId = recipientProfile.id;

    // Enroll the user in the course with the gifted flag
    const { error: enrollError } = await supabase.from('user_enrollments').insert({
        user_id: recipientId,
        course_id: courseId,
        is_gifted: true,
    });

     if (enrollError) {
        if (enrollError.code === '23505') { // Unique constraint violation
            return { success: false, error: `This user is already enrolled in the course.` };
        }
        console.error("Error enrolling user in gifted course:", enrollError);
        return { success: false, error: `Failed to enroll the user: ${enrollError.message}` };
    }

    // Record the gift transaction
    const { error: giftRecordError } = await supabase.from('course_gifts').insert({
        course_id: courseId,
        gifter_user_id: gifterUser.id,
        recipient_user_id: recipientId,
    });

     if (giftRecordError) {
        // This is not a critical failure, but should be logged. The user has the course.
        console.error("Critical: Failed to record gift transaction after enrollment:", giftRecordError);
    }
    
    return { success: true, message: `Successfully gifted the course to ${recipientEmail}!` };
}

export async function completeTopicAction(formData: FormData) {
    const topicId = formData.get('topicId') as string;
    const courseId = formData.get('courseId') as string;
    const nextUrl = formData.get('nextUrl') as string;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && topicId && courseId) {
        await supabase.from('user_topic_progress').upsert({
            user_id: user.id,
            topic_id: topicId,
            course_id: courseId,
            completed_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,topic_id,course_id'
        });
        revalidatePath('/dashboard');
        revalidatePath(`/courses/${courseId}`);
    }

    if (nextUrl) {
        redirect(nextUrl);
    }
}

export async function saveQuizAttempt(quizId: string, score: number, totalQuestions: number) {
    'use server';
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    // Get the latest attempt number for this user and quiz
    const { data: latestAttempt, error: attemptError } = await supabase
        .from('user_quiz_attempts')
        .select('attempt_number')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .single();
    
    if (attemptError && attemptError.code !== 'PGRST116') { // Ignore "no rows found" error
        console.error('Error fetching latest quiz attempt:', attemptError);
        return { success: false, error: 'Could not fetch previous attempts.' };
    }

    const nextAttemptNumber = (latestAttempt?.attempt_number || 0) + 1;

    const { error: insertError } = await supabase.from('user_quiz_attempts').insert({
        user_id: user.id,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
        attempt_number: nextAttemptNumber,
    });

    if (insertError) {
        console.error('Error saving quiz attempt:', insertError);
        return { success: false, error: 'Failed to save quiz result.' };
    }

    return { success: true };
}


export async function upsertUserNote(topicId: string, content: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase.from('user_notes').upsert({
        user_id: user.id,
        topic_id: topicId,
        note_content: content
    }, {
        onConflict: 'user_id,topic_id'
    });

    if (error) {
        console.error("Error upserting note:", error);
        return { success: false, error: "Could not save your note." };
    }

    revalidatePath(`/courses/[languageSlug]/[topicSlug]`, 'page');
    return { success: true };
}



interface LevelData extends Omit<GameLevel, 'id' | 'created_at' | 'chapter_id' | 'order' | 'slug'> {
    id: string; // Temporary client-side ID
    order: number;
    slug: string;
}
interface GameChapterData extends Omit<GameChapter, 'id' | 'created_at' | 'game_id' | 'order'> {
    id: string; // Temporary client-side ID
    order: number;
    image_url?: string | null;
    image_file?: File | null;
    game_levels: LevelData[];
}
interface GameData extends Omit<Game, 'id' | 'created_at'> {
    game_chapters: GameChapterData[];
}

export async function createGame(gameData: GameData, thumbnailFile: File | null, chapterImageFiles: {id: string, file: File | null}[]) {
    const supabase = createClient();
    const { game_chapters, ...restOfGameData } = gameData;
    
    // Create the game record first
    const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert({ ...restOfGameData, thumbnail_url: '' })
        .select()
        .single();

    if (gameError) {
        return { success: false, error: `Game creation failed: ${gameError.message}` };
    }

    let finalThumbnailUrl = '';
    if (thumbnailFile) {
        const filePath = `${newGame.id}/thumbnail-${thumbnailFile.name}`;
        const { error: uploadError } = await supabase.storage.from('game_thumbnails').upload(filePath, thumbnailFile, { upsert: true });
        if (uploadError) return { success: false, error: `Thumbnail upload failed: ${uploadError.message}` };
        finalThumbnailUrl = supabase.storage.from('game_thumbnails').getPublicUrl(filePath).data.publicUrl;
    }
    
    // Update game with thumbnail URL
    const { error: updateError } = await supabase.from('games').update({ thumbnail_url: finalThumbnailUrl }).eq('id', newGame.id);
    if(updateError) console.error("Failed to update game with thumbnail URL", updateError);


    for (const chapterData of game_chapters) {
        const { game_levels, image_file, ...restOfChapterData } = chapterData;
        let chapterImageUrl = '';
        const chapterImageInfo = chapterImageFiles.find(f => f.id === chapterData.id);
        if (chapterImageInfo?.file) {
            const filePath = `${newGame.id}/chapters/${crypto.randomUUID()}-${chapterImageInfo.file.name}`;
            const { error: uploadError } = await supabase.storage.from('game_chapter_images').upload(filePath, chapterImageInfo.file, { upsert: true });
            if (uploadError) console.error(`Chapter image upload failed: ${uploadError.message}`);
            else chapterImageUrl = supabase.storage.from('game_chapter_images').getPublicUrl(filePath).data.publicUrl;
        }

        const chapterPayload = {
            title: restOfChapterData.title,
            order: restOfChapterData.order,
            game_id: newGame.id,
            image_url: chapterImageUrl,
        };
        const { data: newChapter, error: chapterError } = await supabase.from('game_chapters').insert(chapterPayload).select().single();
        if (chapterError) {
            await supabase.from('games').delete().eq('id', newGame.id);
            return { success: false, error: chapterError.message };
        }

        if (game_levels && game_levels.length > 0) {
             const levelsToInsert = game_levels.map(level => {
                const { id, ...restOfLevel } = level; 
                return { ...restOfLevel, chapter_id: newChapter.id };
            });
            const { error: levelsError } = await supabase.from('game_levels').insert(levelsToInsert as any);
            if (levelsError) {
                await supabase.from('games').delete().eq('id', newGame.id);
                return { success: false, error: levelsError.message };
            }
        }
    }
    
    revalidatePath('/admin/games');
    revalidatePath('/playground');

    return { success: true, gameId: newGame.id };
}


export async function seedDemoGames() {
    const supabase = createClient();

    const { data: existingGames, error: fetchError } = await supabase
        .from('games')
        .select('title');

    if (fetchError) {
        return { success: false, error: `Failed to check for existing games: ${fetchError.message}` };
    }

    const existingTitles = existingGames.map(g => g.title);
    const gamesToInsert = placeholderGames.filter(g => !existingTitles.includes(g.title));

    if (gamesToInsert.length === 0) {
        return { success: true, message: 'Demo games have already been seeded.' };
    }

    for (const game of gamesToInsert) {
        const { chapters, ...gameData } = game;
        
        const { data: newGame, error: gameError } = await supabase
            .from('games')
            .insert(gameData as any)
            .select()
            .single();

        if (gameError) {
            console.error(`Error inserting game "${game.title}":`, gameError);
            return { success: false, error: `Failed to insert game "${game.title}": ${gameError.message}` };
        }

        for (const chapter of chapters) {
            const { levels, ...chapterData } = chapter;
            const { data: newChapter, error: chapterError } = await supabase
                .from('game_chapters')
                .insert({ ...chapterData, game_id: newGame.id })
                .select().single();

            if (chapterError) {
                 await supabase.from('games').delete().eq('id', newGame.id);
                 return { success: false, error: `Failed to insert chapter for "${game.title}": ${chapterError.message}` };
            }

            const levelsToInsert = levels.map((level: any, index: number) => {
                const baseSlug = level.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                // Append a short hash to ensure uniqueness, just in case titles are identical
                const uniqueId = Math.random().toString(36).substring(2, 8);
                return {
                    ...level,
                    slug: `${baseSlug}-${uniqueId}`,
                    chapter_id: newChapter.id,
                    order: index + 1
                };
            });

            if (levelsToInsert.length > 0) {
                const { error: levelsError } = await supabase
                    .from('game_levels')
                    .insert(levelsToInsert);
                if (levelsError) {
                    await supabase.from('games').delete().eq('id', newGame.id);
                    return { success: false, error: `Failed to insert levels for "${game.title}": ${levelsError.message}` };
                }
            }
        }
    }
    
    revalidatePath('/admin/games');
    revalidatePath('/playground');

    return { success: true };
}

export async function deleteGame(gameId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('games').delete().eq('id', gameId);
    if (error) {
        return { success: false, error: `Failed to delete game: ${error.message}` };
    }
    revalidatePath('/admin/games');
    revalidatePath('/playground');
    return { success: true };
}

export async function deleteMultipleGames(gameIds: string[]) {
    const supabase = createClient();
    const { error } = await supabase.from('games').delete().in('id', gameIds);
    if (error) {
        return { success: false, error: `Failed to delete games: ${error.message}` };
    }
    revalidatePath('/admin/games');
    revalidatePath('/playground');
    return { success: true };
}

export async function completeGameLevel(levelId: string, gameId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("User not authenticated for completeGameLevel");
        return { success: false, error: 'User not authenticated' };
    }
    
    const { error: progressError } = await supabase.from('user_game_progress').insert({
        user_id: user.id,
        game_id: gameId,
        completed_level_id: levelId,
        completed_at: new Date().toISOString(),
    });

    if (progressError && progressError.code !== '23505') { // Ignore if already completed
        console.error("Error saving game progress:", progressError);
        return { success: false, error: `Failed to save progress: ${progressError.message}` };
    }

    revalidatePath(`/playground/${gameId}`);
    revalidatePath('/dashboard');
    
    return { success: true };
}

export async function recalculateAllUserXp(): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient();
    try {
        // Fetch all levels to get their XP values
        const { data: levels, error: levelsError } = await supabase.from('game_levels').select('id, reward_xp');
        if (levelsError) throw new Error(`Failed to fetch levels: ${levelsError.message}`);
        const levelXpMap = new Map(levels.map(l => [l.id, l.reward_xp]));

        // Fetch all progress records
        const { data: progress, error: progressError } = await supabase.from('user_game_progress').select('user_id, completed_level_id');
        if (progressError) throw new Error(`Failed to fetch progress: ${progressError.message}`);

        // Calculate total XP for each user
        const userXpTotals = new Map<string, number>();
        for (const p of progress) {
            const xp = levelXpMap.get(p.completed_level_id) || 0;
            userXpTotals.set(p.user_id, (userXpTotals.get(p.user_id) || 0) + xp);
        }

        // Prepare bulk update
        const updates = Array.from(userXpTotals.entries()).map(([userId, totalXp]) => ({
            id: userId,
            xp: totalXp
        }));

        if (updates.length > 0) {
            const { error: updateError } = await supabase.from('profiles').upsert(updates);
            if (updateError) throw new Error(`Failed to update profiles: ${updateError.message}`);
        }
        
        revalidatePath('/'); // For homepage leaderboard
        revalidatePath('/admin/games/leaderboard');

        return { success: true };
    } catch (e: any) {
        console.error("Error in recalculateAllUserXp:", e);
        return { success: false, error: e.message };
    }
}


export async function deleteChat(chatId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    let query;
    if (profile?.role === 'admin') {
        // Admin can delete any chat
        query = supabase.from('chats').delete().eq('id', chatId);
    } else {
        // Regular user can only delete their own chat
        query = supabase.from('chats').delete().eq('id', chatId).eq('user_id', user.id);
    }
    
    const { error } = await query;
    if (error) {
        console.error('Error deleting chat:', error);
        return { success: false, error: error.message };
    }
    
    revalidatePath('/chat', 'layout');
    revalidatePath('/admin/users', 'page');
    revalidatePath('/admin/chats', 'page');

    return { success: true, error: null };
}

export async function createNewChat(title: string): Promise<Chat | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('chats')
        .insert({ user_id: user.id, title: title.substring(0, 50) })
        .select()
        .single();
    
    if (error) {
        console.error("Failed to create new chat", error);
        return null;
    }
    
    revalidatePath('/chat', 'layout');
    return data;
}

export async function saveChat(chatId: string, messages: Partial<ChatMessage>[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
         return { success: false, error: "User not authenticated" };
    }

    const { count, error: countError } = await supabase.from('chats').select('*', { count: 'exact', head: true }).eq('id', chatId).eq('user_id', user.id);
    if (countError || count === 0) {
        return { success: false, error: "User does not own chat or chat does not exist."};
    }
    
    await supabase.from('chat_messages').delete().eq('chat_id', chatId);

    const messagesToInsert = messages.map(msg => ({
        chat_id: chatId,
        role: msg.role!,
        content: msg.content || ''
    }));

    const { error: insertError } = await supabase.from('chat_messages').insert(messagesToInsert);
     if(insertError) {
        console.error("Failed to save new messages", insertError);
        return { success: false, error: "Failed to save messages." };
    }

    // Generate and save conversation summary, even after the first message
    if (messages.length >= 1) {
        const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        try {
            // This is an async call but we don't wait for it to finish,
            // allowing the UI to feel faster. It runs in the background.
            analyzeChatConversation({ transcript }).then(analysis => {
                if (analysis.summary) {
                    supabase.from('chat_analysis').upsert({
                        chat_id: chatId,
                        summary: analysis.summary,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'chat_id' }).then(({ error }) => {
                        if (error) console.error("Failed to update chat analysis in background:", error);
                    });
                }
            });
        } catch (e) {
            // Log this error but don't fail the whole operation
            console.error("Failed to trigger chat analysis generation:", e);
        }
    }
    
    revalidatePath(`/chat/${chatId}`);
    return { success: true };
}


export async function updateChat(chatId: string, updates: Partial<Chat>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase.from('chats').update(updates).eq('id', chatId).eq('user_id', user.id);
    if (error) {
        console.error("Failed to update chat:", error);
        return { success: false, error: error.message };
    }
    
    revalidatePath('/chat', 'layout');
    return { success: true, error: null };
}


export async function toggleWishlist(courseId: string, isWishlisted: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be logged in to modify your wishlist." };
    }
    
    if (isWishlisted) {
        // Remove from wishlist
        const { error } = await supabase.from('user_wishlist').delete().match({ user_id: user.id, course_id: courseId });
        if (error) {
            console.error("Error removing from wishlist:", error);
            return { success: false, error: error.message };
        }
    } else {
        // Add to wishlist
        const { error } = await supabase.from('user_wishlist').insert({ user_id: user.id, course_id: courseId });
        if (error) {
             console.error("Error adding to wishlist:", error);
            return { success: false, error: error.message };
        }
    }
    
    revalidatePath('/wishlist');
    revalidatePath('/courses/explore');
    revalidatePath('/');
    
    return { success: true };
}
