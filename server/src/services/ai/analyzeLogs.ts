export const parseExecutionLogs = (logs: string): string => {
  // Dedicated log parser to extract error blocks (future integration point for LLMs)
  const lines = logs.split('\n');
  const errorLines = lines.filter(line => 
    line.toLowerCase().includes('error') || 
    line.toLowerCase().includes('fail') || 
    line.toLowerCase().includes('exit') ||
    line.toLowerCase().includes('timeout')
  );
  return errorLines.join('\n');
};
