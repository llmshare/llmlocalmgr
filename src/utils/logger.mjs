import chalk from 'chalk';

export function log(level, message) {
  const levelColors = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
  };
  const coloredLevel = levelColors[level](level.toUpperCase());
  console.log(`${coloredLevel} ${message}`);
}

