
'use client';

import './../app/newsletter-terminal.css';

export function NewsletterTerminal() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Here you would handle the newsletter subscription
    alert('Thank you for subscribing!');
  };

  return (
    <div className="card">
      <div className="terminal">
        <div className="terminal-header">
          <span className="terminal-title">
            <svg
              className="terminal-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 17l6-6-6-6M12 19h8"></path>
            </svg>
            Terminal
          </span>
        </div>
        <form onSubmit={handleSubmit} className="terminal-body">
          <div className="command-line">
            <span className="prompt">email:</span>
            <div className="input-wrapper">
              <input
                type="email"
                className="input-field"
                placeholder="Enter your email to subscribe"
                required
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
