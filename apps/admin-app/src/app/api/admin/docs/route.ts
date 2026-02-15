import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const docPath = searchParams.get('path');

    if (docPath === null || docPath === '') {
        return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    try {
        // Absolute base is the project docs folder
        const docsBase = path.join(process.cwd(), 'docs');
        
        // Target path can be relative to docs/ (e.g. "specs/CORE.md") 
        // Or it can be a special escape to .agent/ (e.g. "../../.agent/AGENT_CONSTITUTION.md")
        const absolutePath = path.resolve(docsBase, docPath);

        // Security: Ensure the path is within project root
        if (!absolutePath.startsWith(process.cwd())) {
             return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
        }

        const content = await fs.readFile(absolutePath, 'utf8');
        return NextResponse.json({ content });
    } catch (error) {
        console.error('API Doc Fetch Error:', error);
        return NextResponse.json({ error: 'File Not Found' }, { status: 404 });
    }
}
