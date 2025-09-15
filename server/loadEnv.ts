import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const envLineRegex = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)?\s*$/;
let isLoaded = false;

const parseValue = (rawValue: string): string => {
  if (rawValue.length === 0) {
    return '';
  }

  const firstChar = rawValue.charAt(0);
  const lastChar = rawValue.charAt(rawValue.length - 1);

  if (rawValue.length > 1 && firstChar === '"' && lastChar === '"') {
    return rawValue.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  }

  if (rawValue.length > 1 && firstChar === "'" && lastChar === "'") {
    return rawValue.slice(1, -1);
  }

  return rawValue.trim();
};

const parseLine = (line: string): [string, string] | undefined => {
  if (!line || /^\s*#/.test(line)) {
    return undefined;
  }

  const match = line.match(envLineRegex);
  if (!match) {
    return undefined;
  }

  const key = match[1];
  const rawValue = match[2] ?? '';
  const value = parseValue(rawValue);

  return [key, value];
};

const loadFromFile = (filePath: string) => {
  const content = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseLine(line);

    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const addCandidateDirectory = (directories: string[], directory: string | undefined) => {
  if (!directory) {
    return;
  }

  if (!directories.includes(directory)) {
    directories.push(directory);
  }
};

export const loadEnv = () => {
  if (isLoaded) {
    return;
  }

  isLoaded = true;

  const directories: string[] = [];
  addCandidateDirectory(directories, process.cwd());
  addCandidateDirectory(directories, fileURLToPath(new URL('..', import.meta.url)));
  addCandidateDirectory(directories, fileURLToPath(new URL('../..', import.meta.url)));
  addCandidateDirectory(directories, fileURLToPath(new URL('.', import.meta.url)));

  for (const directory of directories) {
    const envPath = join(directory, '.env');

    try {
      loadFromFile(envPath);
      return;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code !== 'ENOENT') {
        console.warn(`Impossible de charger le fichier d'environnement ${envPath}:`, error);
      }
    }
  }
};

loadEnv();
