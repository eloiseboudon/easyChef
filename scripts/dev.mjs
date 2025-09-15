import { spawn } from 'node:child_process';
import { once } from 'node:events';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const services = [];
let shuttingDown = false;

const log = (message) => {
  console.log(`[dev] ${message}`);
};

const startService = (name, script) => {
  log(`Démarrage de ${name}...`);
  const child = spawn(npmCommand, ['run', script], {
    stdio: 'inherit',
    env: process.env,
    shell: false
  });

  services.push({ name, child });

  child.on('error', (error) => {
    console.error(`[dev] Impossible de lancer ${name}:`, error);
    void shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[dev] ${name} s'est arrêté (signal ${signal}).`);
      void shutdown(1);
      return;
    }

    if (typeof code === 'number') {
      if (code === 0) {
        log(`${name} s'est arrêté.`);
        void shutdown(0);
        return;
      }

      if (code === 127) {
        console.error(
          `[dev] ${name} ne s'est pas lancé car la commande demandée est introuvable. Assurez-vous que les dépendances sont installées (npm install) ou que les scripts référencés existent.`
        );
      } else {
        console.error(`[dev] ${name} s'est terminé avec le code ${code}.`);
      }

      void shutdown(code);
      return;
    }

    console.error(`[dev] ${name} s'est terminé avec le code ${code ?? 'inconnu'}.`);
    void shutdown(1);
  });
};

const shutdown = async (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const { name, child } of services) {
    if (child.exitCode === null && child.signalCode === null) {
      log(`Arrêt de ${name}...`);
      child.kill('SIGINT');
    }
  }

  for (const { child } of services) {
    if (child.exitCode === null && child.signalCode === null) {
      await once(child, 'exit');
    }
  }

  process.exit(exitCode);
};

process.on('SIGINT', () => {
  log('Signal SIGINT reçu. Arrêt en cours...');
  void shutdown(0);
});

process.on('SIGTERM', () => {
  log('Signal SIGTERM reçu. Arrêt en cours...');
  void shutdown(0);
});

startService('API EasyChef', 'server');
startService('serveur Vite', 'client');
