export type TerminalEntryType = 'text' | 'command' | 'widget' | 'image' | 'card' | 'pending';

export interface TerminalEntry {
  id: string;
  type: TerminalEntryType;
  timestamp: Date;
  render(): React.ReactNode;
}

export class TextEntry implements TerminalEntry {
  id: string;
  type = 'text' as const;
  timestamp: Date;
  content: string;

  constructor(content: string) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
    this.content = content;
  }

  render() {
    return this.content;
  }
}

export class CommandEntry implements TerminalEntry {
  id: string;
  type = 'command' as const;
  timestamp: Date;
  command: string;
  output?: string;

  constructor(command: string, output?: string) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
    this.command = command;
    this.output = output;
  }

  render() {
    return `> ${this.command}${this.output ? '\n' + this.output : ''}`;
  }
}

export class PendingEntry implements TerminalEntry {
  id: string;
  type = 'pending' as const;
  timestamp: Date;

  constructor() {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }

  render() {
    // Spinner glyphs can be animated later via setInterval or canvas logic
    return '⠋ Nyx is thinking...';
  }
}