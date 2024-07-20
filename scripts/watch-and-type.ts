import chokidar from 'chokidar';
import { execSync } from 'child_process';

chokidar.watch('./packages/builders/src/**/*.ts').on('change', (...args) => {
	console.log(args)
	execSync('pnpm run generate:api', { stdio: 'inherit' });

});
