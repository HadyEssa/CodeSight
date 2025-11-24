import { ProjectAnalyzer } from './services/ProjectAnalyzer';

async function run() {
    const projectId = 'db15f505-c3f5-42c6-a68f-54414867bd8b';
    console.log(`Testing analysis for project: ${projectId}`);

    try {
        const analyzer = new ProjectAnalyzer(projectId);
        const result = await analyzer.analyze();
        console.log('Analysis success:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

run();
