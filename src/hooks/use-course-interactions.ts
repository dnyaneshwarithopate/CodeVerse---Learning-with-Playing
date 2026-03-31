

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import { toggleWishlist as toggleWishlistAction } from '@/lib/supabase/actions';
import { useRouter } from 'next/navigation';

export function useCourseInteractions(courseId?: string) {
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [compareItems, setCompareItems] = useState<CourseWithChaptersAndTopics[]>([]);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isInCompare, setIsInCompare] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data, error } = await supabase
                    .from('user_wishlist')
                    .select('course_id')
                    .eq('user_id', user.id);
                
                if (!error && data) {
                    setWishlist(new Set(data.map(item => item.course_id)));
                }
            }

            try {
                const storedCompare = localStorage.getItem('compareItems');
                if (storedCompare) {
                    setCompareItems(JSON.parse(storedCompare));
                }
            } catch (error) {
                console.error("Could not parse compare items from localStorage", error);
            }
            
            setLoading(false);
        };
        fetchInitialData();
    }, [supabase]);

    useEffect(() => {
        if (courseId) {
            setIsWishlisted(wishlist.has(courseId));
            setIsInCompare(compareItems.some(item => item.id === courseId));
        }
    }, [courseId, wishlist, compareItems]);

    // Update localStorage when compareItems change
    useEffect(() => {
        try {
            localStorage.setItem('compareItems', JSON.stringify(compareItems));
        } catch (error) {
            console.error("Could not save compare items to localStorage", error);
        }
    }, [compareItems]);


    const toggleWishlist = useCallback(async (course: CourseWithChaptersAndTopics) => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Please log in',
                description: 'You need to be logged in to add items to your wishlist.',
            });
            return;
        }

        const currentlyWishlisted = wishlist.has(course.id);
        const optimisticWishlist = new Set(wishlist);
        if (currentlyWishlisted) {
            optimisticWishlist.delete(course.id);
        } else {
            optimisticWishlist.add(course.id);
        }
        setWishlist(optimisticWishlist);

        const { success, error } = await toggleWishlistAction(course.id, currentlyWishlisted);

        if (!success) {
            // Revert optimistic update
            setWishlist(wishlist);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error || 'Could not update wishlist.',
            });
        } else {
            toast({
                title: currentlyWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
                description: `"${course.name}" has been ${currentlyWishlisted ? 'removed from' : 'added to'} your wishlist.`,
            });
        }
    }, [user, wishlist, toast]);

    const toggleCompare = useCallback((course: CourseWithChaptersAndTopics) => {
        setCompareItems(prev => {
            const isInCompareList = prev.some(item => item.id === course.id);
            if (isInCompareList) {
                toast({ title: 'Removed from Compare', description: `"${course.name}" has been removed from the comparison.` });
                return prev.filter(item => item.id !== course.id);
            } else {
                if (prev.length >= 4) {
                    toast({ variant: 'destructive', title: 'Compare List Full', description: 'You can compare up to 4 courses at a time.' });
                    return prev;
                }
                toast({ title: 'Added to Compare', description: `"${course.name}" has been added to the comparison.` });
                return [...prev, course];
            }
        });
    }, [toast]);
    
    const removeFromCompare = (courseId: string) => {
        setCompareItems(prev => prev.filter(item => item.id !== courseId));
    };

    return {
        user,
        loading,
        wishlist,
        compareItems,
        isWishlisted,
        isInCompare,
        toggleWishlist,
        toggleCompare,
        removeFromCompare,
    };
}
