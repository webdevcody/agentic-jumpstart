import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
        // Customize code blocks
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;
          
          if (isInline) {
            return (
              <code 
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }
          
          return (
            <code 
              className={`${className} block bg-muted p-4 rounded-lg overflow-x-auto text-sm`}
              {...props}
            >
              {children}
            </code>
          );
        },
        // Customize headings
        h1: ({ children, ...props }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-2xl font-semibold mt-6 mb-3 text-foreground" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground" {...props}>
            {children}
          </h3>
        ),
        // Customize links
        a: ({ children, href, ...props }) => (
          <a 
            href={href}
            className="text-primary hover:text-primary/80 underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        ),
        // Customize blockquotes
        blockquote: ({ children, ...props }) => (
          <blockquote 
            className="border-l-4 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-lg italic"
            {...props}
          >
            {children}
          </blockquote>
        ),
        // Customize lists
        ul: ({ children, ...props }) => (
          <ul className="list-disc list-inside space-y-1 ml-4" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal list-inside space-y-1 ml-4" {...props}>
            {children}
          </ol>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}