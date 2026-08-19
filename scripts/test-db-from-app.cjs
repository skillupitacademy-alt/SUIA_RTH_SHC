#!/usr/bin/env node
/**
 * Test Database Connection from Application Context
 * This script runs INSIDE the container with actual app dependencies
 */

const { Pool } = require('@neondatabase/serverless');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(level, message) {
    const prefix = {
        info: `${colors.cyan}[INFO]${colors.reset}`,
        success: `${colors.green}[SUCCESS]${colors.reset}`,
        error: `${colors.red}[ERROR]${colors.reset}`,
        warn: `${colors.yellow}[WARNING]${colors.reset}`
    }[level] || '[LOG]';
    console.log(`${prefix} ${message}`);
}

async function testDatabaseConnection() {
    console.log('\n==================================================');
    console.log('DATABASE CONNECTION TEST (FROM APP CONTEXT)');
    console.log('==================================================\n');

    // Test 1: Check environment variables
    log('info', 'Test 1: Environment Variables');
    console.log('-------------------------------------------');
    
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlTutorial = process.env.DATABASE_URL_TUTORIAL;
    
    if (!dbUrl) {
        log('error', 'DATABASE_URL is not set');
        process.exit(1);
    }
    log('success', 'DATABASE_URL is set');
    
    if (!dbUrlTutorial) {
        log('warn', 'DATABASE_URL_TUTORIAL is not set');
    } else {
        log('success', 'DATABASE_URL_TUTORIAL is set');
    }
    
    // Mask sensitive parts
    const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//USER:****@');
    console.log(`  Format: ${maskedUrl.substring(0, 80)}...`);
    console.log('');

    // Test 2: Basic Connection
    log('info', 'Test 2: Basic PostgreSQL Connection');
    console.log('-------------------------------------------');
    
    const pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 10000,
        max: 1
    });

    try {
        const start = Date.now();
        const client = await pool.connect();
        const duration = Date.now() - start;
        log('success', `Connected in ${duration}ms`);
        
        const result = await client.query('SELECT current_database(), current_user, version()');
        log('success', 'Query executed successfully');
        console.log(`  Database: ${result.rows[0].current_database}`);
        console.log(`  User: ${result.rows[0].current_user}`);
        console.log(`  Version: ${result.rows[0].version.substring(0, 60)}...`);
        
        client.release();
    } catch (err) {
        log('error', `Connection failed: ${err.message}`);
        console.log(`  Code: ${err.code}`);
        console.log(`  Name: ${err.name}`);
        await pool.end();
        process.exit(1);
    }
    console.log('');

    // Test 3: Domains Table Query (The Failing Query)
    log('info', 'Test 3: Domains Table Query (Production Failure Point)');
    console.log('-------------------------------------------');
    
    try {
        const result = await pool.query(`
            SELECT id, name, slug, created_at 
            FROM domains 
            WHERE deleted_at IS NULL 
            ORDER BY created_at 
            LIMIT 5
        `);
        
        log('success', `Found ${result.rows.length} domain(s)`);
        result.rows.forEach(row => {
            console.log(`  - ${row.name} (${row.slug}) [${row.id}]`);
        });
    } catch (err) {
        log('error', `Domains query failed: ${err.message}`);
        console.log(`  Code: ${err.code}`);
        console.log(`  SQL State: ${err.sqlState || 'N/A'}`);
        console.log(`  Position: ${err.position || 'N/A'}`);
        await pool.end();
        process.exit(1);
    }
    console.log('');

    // Test 4: Hierarchy Query (Full Navigation Query)
    log('info', 'Test 4: Full Hierarchy Query (Domain → Subject → Topic)');
    console.log('-------------------------------------------');
    
    try {
        const result = await pool.query(`
            SELECT 
                d.id as domain_id,
                d.name as domain_name,
                d.slug as domain_slug,
                s.id as subject_id,
                s.name as subject_name,
                s.slug as subject_slug,
                t.id as topic_id,
                t.name as topic_name,
                t.slug as topic_slug
            FROM domains d
            LEFT JOIN subjects s ON s.domain_id = d.id AND s.deleted_at IS NULL
            LEFT JOIN topics t ON t.subject_id = s.id AND t.deleted_at IS NULL
            WHERE d.deleted_at IS NULL
            AND d.slug = 'full-stack-development'
            LIMIT 10
        `);
        
        log('success', `Found ${result.rows.length} hierarchy record(s)`);
        result.rows.slice(0, 3).forEach(row => {
            console.log(`  - ${row.domain_name} / ${row.subject_name || 'N/A'} / ${row.topic_name || 'N/A'}`);
        });
    } catch (err) {
        log('error', `Hierarchy query failed: ${err.message}`);
        console.log(`  Code: ${err.code}`);
        await pool.end();
        process.exit(1);
    }
    console.log('');

    // Test 5: Tutorial Sidebar Query (Tutorial DB)
    log('info', 'Test 5: Tutorial Sidebar Query (Tutorial DB)');
    console.log('-------------------------------------------');
    
    const tutorialPool = new Pool({
        connectionString: dbUrlTutorial,
        connectionTimeoutMillis: 10000,
        max: 1
    });

    try {
        const result = await tutorialPool.query(`
            SELECT id, brand, status, version, updated_at
            FROM tutorial_left_sidebar
            WHERE status = 'published'
            AND brand = 'shared'
            LIMIT 5
        `);
        
        log('success', `Found ${result.rows.length} published sidebar(s)`);
        result.rows.forEach(row => {
            console.log(`  - Sidebar ${row.id}: brand=${row.brand}, status=${row.status}, version=${row.version}`);
        });
        await tutorialPool.end();
    } catch (err) {
        log('error', `Tutorial sidebar query failed: ${err.message}`);
        console.log(`  Code: ${err.code}`);
        await tutorialPool.end();
        await pool.end();
        process.exit(1);
    }
    console.log('');

    // Test 6: Combined Query (What the page does)
    log('info', 'Test 6: Combined Query (Parent DB + Tutorial DB)');
    console.log('-------------------------------------------');
    
    try {
        // Get topic from parent DB
        const topicResult = await pool.query(`
            SELECT t.id, t.name, t.slug, s.slug as subject_slug, d.slug as domain_slug
            FROM topics t
            JOIN subjects s ON s.id = t.subject_id
            JOIN domains d ON d.id = s.domain_id
            WHERE t.slug = 'java'
            AND t.deleted_at IS NULL
            LIMIT 1
        `);
        
        if (topicResult.rows.length === 0) {
            log('warn', 'Java topic not found in parent DB');
        } else {
            const topic = topicResult.rows[0];
            log('success', `Found topic: ${topic.name} (${topic.slug})`);
            console.log(`  Domain: ${topic.domain_slug}`);
            console.log(`  Subject: ${topic.subject_slug}`);
            console.log(`  Topic ID: ${topic.id}`);
        }
        
        // Get sidebar from tutorial DB
        const sidebarResult = await tutorialPool.query(`
            SELECT id, brand, status, version
            FROM tutorial_left_sidebar
            WHERE id = $1
            AND status = 'published'
        `, [topicResult.rows.length > 0 ? topicResult.rows[0].id : '4b21ddc0-123b-41e3-8ea1-280d37f7f035']);
        
        if (sidebarResult.rows.length === 0) {
            log('warn', 'Published sidebar not found for this topic');
        } else {
            log('success', `Found published sidebar: version ${sidebarResult.rows[0].version}`);
        }
        
    } catch (err) {
        log('error', `Combined query failed: ${err.message}`);
        console.log(`  Code: ${err.code}`);
    }
    console.log('');

    await pool.end();

    console.log('==================================================');
    log('success', 'ALL DATABASE TESTS PASSED');
    console.log('==================================================\n');
}

testDatabaseConnection().catch(err => {
    console.error('\n' + colors.red + '[FATAL ERROR]' + colors.reset, err.message);
    console.error(err.stack);
    process.exit(1);
});
