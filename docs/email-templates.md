
# Email Templates for CodeVerse

Here are the modern, dark-themed HTML email templates for your Supabase project.

## How to Use

1.  Go to your Supabase project dashboard.
2.  Navigate to **Authentication** -> **Email Templates**.
3.  For each template (`Confirm signup`, `Magic Link`, `Reset password`), click on it to edit.
4.  Copy the HTML code provided below for the corresponding template.
5.  Paste the HTML into the body of the email template editor in Supabase.
6.  Save your changes.

---

## 1. Confirm Signup Template

Use this for the **Confirm signup** email.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your CodeVerse Account</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body {
            background-color: #18181b;
            color: #d4d4d8;
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #c084fc; /* purple-400 */
            font-size: 28px;
            margin: 0;
        }
        .card {
            background-color: #27272a;
            border-radius: 12px;
            padding: 30px;
            border: 1px solid #3f3f46;
        }
        .card p {
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #7c3aed; /* violet-600 */
            color: #ffffff;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 25px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #71717a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CodeVerse</h1>
        </div>
        <div class="card">
            <h2>Welcome to CodeVerse, {{ .Email }}!</h2>
            <p>We're excited to have you on board. Please confirm your email address to complete your registration and start your coding adventure.</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Your Email</a>
            </p>
            <p>If you didn't sign up for an account, you can safely ignore this email.</p>
            <br>
            <p>Happy coding!</p>
            <p><strong>The CodeVerse Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; {{ .SiteURL }}</p>
        </div>
    </div>
</body>
</html>
```

---

## 2. Reset Password (OTP) Template

Use this for the **Reset password** email. This is an OTP-based template.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your CodeVerse Password Reset Code</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body {
            background-color: #18181b;
            color: #d4d4d8;
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #c084fc; /* purple-400 */
            font-size: 28px;
            margin: 0;
        }
        .card {
            background-color: #27272a;
            border-radius: 12px;
            padding: 30px;
            border: 1px solid #3f3f46;
        }
        .card p {
            font-size: 16px;
            line-height: 1.6;
        }
        .otp-code {
            background-color: #18181b;
            color: #c084fc;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 10px;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border: 1px dashed #3f3f46;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #71717a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CodeVerse</h1>
        </div>
        <div class="card">
            <h2>Your Password Reset Code</h2>
            <p>We received a request to reset the password for your CodeVerse account. Enter the code below to proceed.</p>
            <div class="otp-code">
                {{ .Token }}
            </div>
            <p>This code will expire in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
            <br>
            <p>Happy coding!</p>
            <p><strong>The CodeVerse Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; {{ .SiteURL }}</p>
        </div>
    </div>
</body>
</html>
```

---

## 3. Magic Link Template

Use this for the **Magic Link** email.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale-1.0">
    <title>Your CodeVerse Magic Link</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body {
            background-color: #18181b;
            color: #d4d4d8;
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #c084fc; /* purple-400 */
            font-size: 28px;
            margin: 0;
        }
        .card {
            background-color: #27272a;
            border-radius: 12px;
            padding: 30px;
            border: 1px solid #3f3f46;
        }
        .card p {
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #7c3aed; /* violet-600 */
            color: #ffffff;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 25px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #71717a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CodeVerse</h1>
        </div>
        <div class="card">
            <h2>Your Magic Link is Here!</h2>
            <p>You requested a magic link to sign in to the CodeVerse account for {{ .Email }}.</p>
            <p>Click the button below to sign in instantly. This link is valid for 1 hour.</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Sign In to CodeVerse</a>
            </p>
            <p>If you didn't request this link, you can safely ignore this email.</p>
            <br>
            <p>Happy coding!</p>
            <p><strong>The CodeVerse Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; {{ .SiteURL }}</p>
        </div>
    </div>
</body>
</html>
```
