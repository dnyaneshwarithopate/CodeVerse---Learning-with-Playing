
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
    // This is a placeholder. In a real app, you'd fetch cart items.
    const isEmpty = true;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
                    {isEmpty ? (
                        <Card className="bg-card/50 border-border/50 text-center py-20">
                            <CardHeader>
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-2xl">Your cart is empty</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Looks like you haven't added any courses to your cart yet.</p>
                                <Button asChild className="mt-6">
                                    <Link href="/courses">Explore Courses</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div>
                            {/* This is where the list of cart items would go */}
                            <p>Cart items will be displayed here.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
