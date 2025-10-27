// Type declarations for Dialogflow Messenger web component
declare namespace JSX {
  interface IntrinsicElements {
    'df-messenger': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      location?: string;
      'project-id'?: string;
      'agent-id'?: string;
      'language-code'?: string;
      'max-query-length'?: string;
    }, HTMLElement>;
    
    'df-messenger-chat-bubble': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      'chat-title'?: string;
    }, HTMLElement>;
  }
}

