import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function ConfirmEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-10"></div>
            <Card className="mx-auto w-full max-w-md bg-card/50 border-border/50 backdrop-blur-lg text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <MailCheck className="w-16 h-16 text-primary"/>
                    </div>
                    <CardTitle className="text-3xl font-bold">Confirm Your Email</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        We've sent a confirmation link to your email address. Please click the link to complete your registration.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">
                        Didn't receive an email? Check your spam folder or <Link href="/signup" className="underline text-primary">try signing up again</Link>.
                    </p>
                    <p className="text-sm mt-4">
                        Once confirmed, you can <Link href="/login" className="underline text-primary">log in to your account</Link>.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
