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
  private static readonly SPINNER_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

  constructor() {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }

  render() {
    // Animate spinner based on elapsed time (works with 60fps canvas rendering)
    const elapsed = Date.now() - this.timestamp.getTime();
    const frameIndex = Math.floor(elapsed / 80) % PendingEntry.SPINNER_FRAMES.length; // 80ms per frame = ~12.5 fps
    return PendingEntry.SPINNER_FRAMES[frameIndex];
  }
}