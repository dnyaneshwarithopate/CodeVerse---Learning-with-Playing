
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
    // This is a placeholder. In a real app, you'd fetch wishlist items.
    const isEmpty = true;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>
                    {isEmpty ? (
                        <Card className="bg-card/50 border-border/50 text-center py-20">
                             <CardHeader>
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                                  <Heart className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-2xl">Your wishlist is empty</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Add courses to your wishlist to save them for later.</p>
                                <Button asChild className="mt-6">
                                    <Link href="/courses">Explore Courses</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div>
                            {/* This is where the list of wishlist items would go */}
                            <p>Wishlist items will be displayed here.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
