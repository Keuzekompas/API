export class TimeFormatter {
  static format(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minute(s)`;
    return `${Math.ceil(seconds / 3600)} hour(s)`;
  }
}
