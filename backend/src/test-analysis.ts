import { ProjectAnalyzer } from './services/ProjectAnalyzer';
import path from 'path';
import fs from 'fs';

async function run() {
    const projectId = '656c9bd5-7409-41d8-9e53-71c3dbbf8ca5';
    const zipPath = path.join(process.cwd(), 'uploads', `${projectId}.zip`);
    const logPath = path.join(process.cwd(), 'error_log.txt');

    console.log('Testing analysis for:', zipPath);

    const analyzer = new ProjectAnalyzer(projectId);
    try {
        const result = await analyzer.analyze(zipPath);
        console.log('Success');
        fs.writeFileSync(logPath, 'Success\n' + JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('Test Failed:', error);
        const errorLog = `Error: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error, null, 2)}`;
        fs.writeFileSync(logPath, errorLog);
    }
}

run();
